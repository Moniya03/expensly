import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRef, useState } from 'react';
import { clearLocalSession, supabase } from '../services/supabase';

/**
 * Configure Google Sign-In with Web Client ID
 * This should be called once on app startup
 */
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });
}

/**
 * Return type for the useGoogleAuth hook
 */
interface UseGoogleAuthReturn {
  /**
   * Initiates the Google sign-in flow
   */
  signInWithGoogle: () => Promise<void>;
  /**
   * Clears Google + Supabase sessions so user can switch accounts
   */
  signOut: () => Promise<void>;
  /**
   * Whether the authentication process is in progress
   */
  isLoading: boolean;
  /**
   * Whether sign out is currently running
   */
  isSigningOut: boolean;
  /**
   * Error message if authentication fails
   */
  error: string | null;
}

/**
 * Custom hook for Google OAuth authentication using native Google Sign-In and Supabase
 *
 * @example
 * ```tsx
 * const { signInWithGoogle, isLoading, error } = useGoogleAuth();
 *
 * <Button
 *   onPress={signInWithGoogle}
 *   disabled={isLoading}
 *   title={isLoading ? 'Signing in...' : 'Sign in with Google'}
 * />
 * {error && <Text>{error}</Text>}
 * ```
 *
 * @returns Object containing signInWithGoogle function, loading state, and error state
 */
export function useGoogleAuth(): UseGoogleAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signInInFlight = useRef(false);

  /**
   * Initiates the Google sign-in flow
   * Uses native Google Sign-In to get the ID token and exchanges it for a Supabase session
   */
  const signInWithGoogle = async () => {
    if (signInInFlight.current || isLoading) {
      return;
    }

    try {
      signInInFlight.current = true;
      setIsLoading(true);
      setError(null);

      // Validate that we have a Google Client ID configured
      if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
        throw new Error(
          'Google Client ID is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your environment variables.',
        );
      }

      // Check if Google Play Services are available (Android only)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();

      // Get the ID token from the data property
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Exchange Google ID token for Supabase session
      const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (supabaseError) {
        throw supabaseError;
      }

      if (!data.session) {
        throw new Error('No session created after sign-in');
      }

      // Success - session will be handled by auth store listener
      console.log('Successfully signed in with Google');
    } catch (err: any) {
      const isInProgressError =
        err?.code === 'IN_PROGRESS' ||
        String(err?.message || '').includes('Sign-in in progress') ||
        String(err?.message || '').includes('previous promise did not settle');

      if (!isInProgressError) {
        console.error('Google auth error:', err);
      }

      // Handle specific Google Sign-In errors
      if (err.code === 'SIGN_IN_CANCELLED') {
        // User cancelled the sign-in flow - don't show error
        setError(null);
      } else if (isInProgressError) {
        setError(null);
      } else if (err.code === 'IN_PROGRESS') {
        setError('Sign-in already in progress');
      } else if (err.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        setError('Google Play Services is not available');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      }
    } finally {
      signInInFlight.current = false;
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsSigningOut(true);
      setError(null);

      const cleared = await clearLocalSession();

      if (!cleared) {
        throw new Error('Failed to clear local session');
      }

      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        console.warn('Google sign-out skipped:', googleError);
      }

      console.log('Signed out of Google and Supabase');
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setIsSigningOut(false);
    }
  };

  return {
    signInWithGoogle,
    signOut,
    isLoading,
    isSigningOut,
    error,
  };
}
