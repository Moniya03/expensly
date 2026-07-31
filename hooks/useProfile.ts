/**
 * Profile queries hook using React Query
 * Fetches and caches user profile data from Supabase
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Profile } from '../types';
import { useAuthStore } from '../stores/authStore';
import { fetchProfile, saveProfile } from '../services/profile';

const PROFILE_KEY = ['profile'];

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
    mutationFn: (updates: Partial<Pick<Profile, 'name' | 'monthly_budget' | 'onboarding_complete'>>) => {
      if (!userId) {
        throw new Error('No user session');
      }
      return saveProfile(userId, updates);
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
