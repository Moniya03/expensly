import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { Profile } from '../types';
import { supabase } from '../services/supabase';

/**
 * Auth store state interface
 */
interface AuthState {
  /** Current user session from Supabase */
  session: Session | null;
  /** User profile data from the profiles table */
  profile: Profile | null;
  /** Loading state during async operations */
  isLoading: boolean;
  /** Whether the store has been initialized */
  isInitialized: boolean;

  // Actions
  /** Set the current session */
  setSession: (session: Session | null) => void;
  /** Set the user profile */
  setProfile: (profile: Profile | null) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Initialize auth state and set up listeners */
  initialize: () => Promise<void>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Sign in with Google using ID token */
  signInWithGoogle: (idToken: string) => Promise<void>;
}

/**
 * Fetch user profile from the database
 */
const fetchProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching profile:', error);
    return null;
  }
};

/**
 * Zustand auth store
 * Manages authentication state and user profile data
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  setSession: (session) => set({ session }),

  setProfile: (profile) => set({ profile }),

  setLoading: (loading) => set({ isLoading: loading }),

  initialize: async () => {
    const state = get();

    // Prevent multiple initializations
    if (state.isInitialized) {
      return;
    }

    try {
      set({ isLoading: true });

      // Get initial session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error getting initial session:', sessionError.message);
        set({ session: null, profile: null });
      } else if (session?.user) {
        // Fetch user profile if session exists
        const profile = await fetchProfile(session.user.id);
        set({ session, profile });
      } else {
        set({ session: null, profile: null });
      }

      // Set up auth state change listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);

        set({ session });

        if (session?.user) {
          // Fetch profile on sign in or token refresh
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
            const profile = await fetchProfile(session.user.id);
            set({ profile });
          }
        } else {
          // Clear profile on sign out
          set({ profile: null });
        }
      });

      set({ isInitialized: true });
    } catch (error) {
      console.error('Unexpected error during auth initialization:', error);
      set({ session: null, profile: null });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error signing out:', error.message);
        throw error;
      }

      // Clear state
      set({ session: null, profile: null });
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithGoogle: async (idToken: string) => {
    try {
      set({ isLoading: true });

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        console.error('Google sign-in error:', error.message);
        throw error;
      }

      // Session will be set by the auth state change listener
      console.log('Google sign-in successful');
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
