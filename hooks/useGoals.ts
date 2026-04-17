import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Goal } from '../types';
import { useAuthStore } from '../stores/authStore';

type GoalRow = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline: string | null;
  emoji: string | null;
  is_completed: boolean | null;
  completed_at: string | null;
  created_at: string;
};

const GOALS_KEY = ['goals'];

const normalizeGoal = (row: GoalRow): Goal => {
  const isCompleted = row.is_completed ?? row.saved_amount >= row.target_amount;

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    target_amount: row.target_amount,
    saved_amount: row.saved_amount,
    target_date: row.deadline,
    icon: row.emoji || 'briefcase-outline',
    is_completed: isCompleted,
    completed_at: isCompleted ? row.completed_at : null,
    created_at: row.created_at,
  };
};

const fetchGoals = async (userId: string): Promise<Goal[]> => {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('id,user_id,name,target_amount,saved_amount,deadline,emoji,is_completed,completed_at,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(normalizeGoal);
};

export type CreateGoalInput = {
  name: string;
  target_amount: number;
  icon: string;
  target_date?: string | null;
};

export type UpdateGoalInput = {
  id: string;
  name: string;
  target_amount: number;
  icon: string;
  target_date?: string | null;
};

export type UpdateGoalProgressInput = {
  id: string;
  amount: number;
};

const createGoal = async (userId: string, input: CreateGoalInput): Promise<Goal> => {
  const saved_amount = 0;
  const is_completed = saved_amount >= input.target_amount;

  const payload = {
    user_id: userId,
    name: input.name.trim(),
    target_amount: input.target_amount,
    saved_amount,
    deadline: input.target_date || null,
    emoji: input.icon,
    is_completed,
    completed_at: is_completed ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('savings_goals')
    .insert(payload)
    .select('id,user_id,name,target_amount,saved_amount,deadline,emoji,is_completed,completed_at,created_at')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeGoal(data as GoalRow);
};

const updateGoal = async (userId: string, input: UpdateGoalInput): Promise<Goal> => {
  const { data: current, error: currentError } = await supabase
    .from('savings_goals')
    .select('id,user_id,name,target_amount,saved_amount,deadline,emoji,is_completed,completed_at,created_at')
    .eq('id', input.id)
    .eq('user_id', userId)
    .single();

  if (currentError) {
    throw new Error(currentError.message);
  }

  const currentRow = current as GoalRow;
  const now = new Date().toISOString();
  const isCompleted = currentRow.saved_amount >= input.target_amount;

  const payload = {
    name: input.name.trim(),
    target_amount: input.target_amount,
    saved_amount: currentRow.saved_amount,
    deadline: input.target_date || null,
    emoji: input.icon,
    is_completed: isCompleted,
    completed_at: isCompleted ? currentRow.completed_at || now : null,
  };

  const { data, error } = await supabase
    .from('savings_goals')
    .update(payload)
    .eq('id', input.id)
    .eq('user_id', userId)
    .select('id,user_id,name,target_amount,saved_amount,deadline,emoji,is_completed,completed_at,created_at')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeGoal(data as GoalRow);
};

const updateGoalProgress = async (userId: string, input: UpdateGoalProgressInput): Promise<Goal> => {
  const { data: current, error: currentError } = await supabase
    .from('savings_goals')
    .select('id,user_id,name,target_amount,saved_amount,deadline,emoji,is_completed,completed_at,created_at')
    .eq('id', input.id)
    .eq('user_id', userId)
    .single();

  if (currentError) {
    throw new Error(currentError.message);
  }

  const currentRow = current as GoalRow;
  const nextSavedAmount = Math.min(currentRow.saved_amount + input.amount, currentRow.target_amount);
  const isCompleted = nextSavedAmount >= currentRow.target_amount;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('savings_goals')
    .update({
      saved_amount: nextSavedAmount,
      is_completed: isCompleted,
      completed_at: isCompleted ? currentRow.completed_at || now : null,
    })
    .eq('id', input.id)
    .eq('user_id', userId)
    .select('id,user_id,name,target_amount,saved_amount,deadline,emoji,is_completed,completed_at,created_at')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeGoal(data as GoalRow);
};

const deleteGoal = async (userId: string, goalId: string): Promise<{ id: string }> => {
  const { error } = await supabase.from('savings_goals').delete().eq('id', goalId).eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return { id: goalId };
};

export const useGoals = () => {
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  return useQuery({
    queryKey: [...GOALS_KEY, userId],
    queryFn: () => {
      if (!userId) throw new Error('No user session');
      return fetchGoals(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: (input: CreateGoalInput) => {
      if (!userId) throw new Error('No user session');
      return createGoal(userId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...GOALS_KEY, userId] });
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: (input: UpdateGoalInput) => {
      if (!userId) throw new Error('No user session');
      return updateGoal(userId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...GOALS_KEY, userId] });
    },
  });
};

export const useUpdateGoalProgress = () => {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: (input: UpdateGoalProgressInput) => {
      if (!userId) throw new Error('No user session');
      if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Enter a valid amount');
      return updateGoalProgress(userId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...GOALS_KEY, userId] });
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: (goalId: string) => {
      if (!userId) throw new Error('No user session');
      return deleteGoal(userId, goalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...GOALS_KEY, userId] });
    },
  });
};

export const useGoalGroups = () => {
  const { data = [], ...rest } = useGoals();
  const grouped = useMemo(() => {
    const active = data.filter((goal) => !goal.is_completed);
    const completed = data.filter((goal) => goal.is_completed);
    return { active, completed };
  }, [data]);

  return { ...rest, ...grouped };
};
