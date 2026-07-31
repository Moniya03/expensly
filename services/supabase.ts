import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

const supabaseFetch: typeof fetch = async (input, init) => {
  const request = input instanceof Request ? input : new Request(input, init);
  const method = request.method || 'GET';
  const url = request.url;

  try {
    const response = await fetch(input, init);

    if (__DEV__) {
      const log = response.ok ? console.log : console.warn;
      log(`[Supabase] ${method} ${url} -> ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    if (__DEV__) {
      console.error(`[Supabase] Network failure for ${method} ${url}`, error);
    }

    throw error;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: supabaseFetch,
  },
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const isInvalidRefreshTokenError = (error: { message?: string | null } | null | undefined) => {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('invalid refresh token') || message.includes('refresh token not found');
};

export const clearLocalSession = async () => {
  const { error } = await supabase.auth.signOut({ scope: 'local' });

  if (error) {
    console.error('Error clearing local session:', error.message);
    return false;
  }

  return true;
};

/**
 * Get the current user session
 * @returns The current session or null if not authenticated
 */
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    if (isInvalidRefreshTokenError(error)) {
      await clearLocalSession();
      return null;
    }

    console.error('Error getting session:', error.message);
    return null;
  }

  return data.session;
};

/**
 * Sign out the current user
 * @returns True if sign out was successful, false otherwise
 */
export const signOut = async () => {
  return clearLocalSession();
};
