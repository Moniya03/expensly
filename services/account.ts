/**
 * Account management (delete account via edge function).
 */

import { useAuthStore } from '../stores/authStore';
import { supabase } from './supabase';

/**
 * Permanently delete the current user's account and all their data.
 */
export const deleteAccount = async (): Promise<void> => {
  const userId = useAuthStore.getState().session?.user?.id;

  if (!userId) {
    throw new Error('No active session');
  }

  const { error } = await supabase.functions.invoke('delete-account', {
    body: { userId },
  });

  if (error) {
    throw new Error(error.message);
  }

  // Session is dead server-side; clear local state.
  await useAuthStore.getState().signOut();
};
