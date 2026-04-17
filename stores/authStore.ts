import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { Profile } from '../types';
import { supabase } from '../services/supabase';

let authSubscription: { unsubscribe: () => void } | null = null;
let initializePromise: Promise<void> | null = null;
const profileRequests = new Map<string, Promise<Profile | null>>();
const PROFILE_FETCH_TIMEOUT_MS = 8000;

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
  /** Whether profile resolution is complete for the current session */
  hasResolvedProfile: boolean;

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

const fetchProfileWithTimeout = async (userId: string): Promise<Profile | null> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      fetchProfile(userId),
      new Promise<Profile | null>((resolve) => {
        timeoutId = setTimeout(() => {
          console.error(`Profile fetch timed out after ${PROFILE_FETCH_TIMEOUT_MS}ms for user ${userId}`);
          resolve(null);
        }, PROFILE_FETCH_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const fetchProfileOnce = (userId: string): Promise<Profile | null> => {
  const inFlightRequest = profileRequests.get(userId);

  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = fetchProfileWithTimeout(userId).finally(() => {
    profileRequests.delete(userId);
  });

  profileRequests.set(userId, request);
  return request;
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
  hasResolvedProfile: false,

  setSession: (session) => set({ session }),

  setProfile: (profile) => set({ profile }),

  setLoading: (loading) => set({ isLoading: loading }),

  initialize: async () => {
    const state = get();

    // Prevent multiple initializations
    if (state.isInitialized) {
      return;
    }

    if (initializePromise) {
      return initializePromise;
    }

    initializePromise = (async () => {
      try {
        set({ isLoading: true });

        if (!authSubscription) {
          const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);

            set({ session });

            if (!session?.user) {
              set({ profile: null, hasResolvedProfile: true });
              return;
            }

            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
              set({ hasResolvedProfile: false });
              const profile = await fetchProfileOnce(session.user.id);
              const currentSession = get().session;

              if (currentSession?.user.id === session.user.id) {
                set({ profile, hasResolvedProfile: true });
              }
            }
          });

          authSubscription = data.subscription;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error getting initial session:', sessionError.message);
          set({ session: null, profile: null, isInitialized: true, hasResolvedProfile: true });
          return;
        }

        if (!session?.user) {
          set({ session: null, profile: null, isInitialized: true, hasResolvedProfile: true });
          return;
        }

        set({ session, hasResolvedProfile: false });

        const currentProfile = get().profile;
        const currentSession = get().session;

        if (currentSession?.user.id === session.user.id && currentProfile) {
          set({ isInitialized: true, hasResolvedProfile: true });
          return;
        }

        const profile = await fetchProfileOnce(session.user.id);
        set({ session, profile, isInitialized: true, hasResolvedProfile: true });
      } catch (error) {
        console.error('Unexpected error during auth initialization:', error);
        set({ session: null, profile: null, isInitialized: true, hasResolvedProfile: true });
      } finally {
        set({ isLoading: false });
        initializePromise = null;
      }
    })();

    return initializePromise;
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
      set({ session: null, profile: null, hasResolvedProfile: true });
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
