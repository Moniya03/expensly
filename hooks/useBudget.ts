import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Budget } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useMonthlySpent } from './useTransactions';

/**
 * Fetch user's budgets
 */
async function fetchBudgets(userId: string): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Hook to get user's budgets
 */
export function useBudgets() {
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['budgets', userId],
    queryFn: () => fetchBudgets(userId!),
    enabled: !!userId,
  });
}

/**
 * Hook to get monthly budget status
 * Returns the monthly budget from profile and spending progress
 */
export function useMonthlyBudget() {
  const { profile } = useAuthStore();
  const { totalPaise: spentPaise, isLoading: spentLoading } = useMonthlySpent();

  const budgetPaise = profile?.monthly_budget_paise ?? 0;
  const remainingPaise = budgetPaise - spentPaise;
  const percentUsed = budgetPaise > 0 ? (spentPaise / budgetPaise) * 100 : 0;

  return {
    budgetPaise,
    spentPaise,
    remainingPaise,
    percentUsed: Math.min(percentUsed, 100),
    isOverBudget: spentPaise > budgetPaise,
    isLoading: spentLoading,
  };
}
