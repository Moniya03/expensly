/**
 * Reusable per-user custom goal icons.
 * Goals store either a preset icon name or a custom icon's UUID.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import { UserGoalIcon } from '../types';

const queryKey = (userId: string) => ['goal-icons', userId];

export const useGoalIcons = () => {
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useQuery({
    queryKey: queryKey(userId ?? ''),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_goal_icons')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as UserGoalIcon[];
    },
  });
};

export const useCreateGoalIcon = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useMutation({
    mutationFn: async (icon: { icon_name: string; label?: string; color: string }) => {
      const { data, error } = await supabase
        .from('user_goal_icons')
        .insert({ user_id: userId, ...icon })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as UserGoalIcon;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(userId ?? '') }),
  });
};

export const useUpdateGoalIcon = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; label?: string | null; color?: string; icon_name?: string }) => {
      const { error } = await supabase.from('user_goal_icons').update(patch).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(userId ?? '') }),
  });
};

export const useDeleteGoalIcon = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_goal_icons').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(userId ?? '') }),
  });
};
