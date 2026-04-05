/**
 * Profile queries hook using React Query
 * Fetches and caches user profile data from Supabase
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { useAuthStore } from '../stores/authStore';

const PROFILE_KEY = ['profile'];

/**
 * Fetch profile from Supabase
 */
const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    // PGRST116 = no rows found (new user, profile not yet created)
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message);
  }

  return data;
};

/**
 * Update profile in Supabase
 */
const updateProfile = async (
  userId: string,
  updates: Partial<Pick<Profile, 'display_name' | 'monthly_budget'>>
): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Hook to fetch and cache user profile
 */
export const useProfile = () => {
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  return useQuery({
    queryKey: [...PROFILE_KEY, userId],
    queryFn: () => {
      if (!userId) {
        throw new Error('No user session');
      }
      return fetchProfile(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook to update user profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: (updates: Partial<Pick<Profile, 'display_name' | 'monthly_budget'>>) => {
      if (!userId) {
        throw new Error('No user session');
      }
      return updateProfile(userId, updates);
    },
    onSuccess: (data) => {
      // Update the profile cache
      queryClient.setQueryData([...PROFILE_KEY, userId], data);
      // Also update the auth store profile
      useAuthStore.getState().setProfile(data);
    },
  });
};

/**
 * Get profile data from cache (synchronous)
 * Useful when you need profile data without triggering a fetch
 */
export const useProfileData = (): Profile | null => {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  return profile;
};
