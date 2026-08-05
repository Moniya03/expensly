import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import type { Budget } from '../types';
import { useMonthlySpent } from './useTransactions';

export function getHistoricalBudgetForMonth({
  budgets,
  fallbackBudget,
  month,
  year,
}: {
  budgets: Budget[];
  fallbackBudget: number;
  month: number;
  year: number;
}) {
  const monthlyBudget = budgets
    .filter((budget) => budget.month === month && budget.year === year)
    .reduce((sum, budget) => sum + budget.amount, 0);

  return monthlyBudget > 0 ? monthlyBudget : fallbackBudget;
}

/**
 * Fetch user's budgets
 */
async function fetchBudgets(userId: string): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .limit(100);

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
  const { total: spent, isLoading: spentLoading } = useMonthlySpent();

  const budget = profile?.monthly_budget ?? 0;
  const remaining = budget - spent;
  const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;

  return {
    budget,
    spent,
    remaining,
    percentUsed: Math.min(percentUsed, 100),
    isOverBudget: spent > budget,
    isLoading: spentLoading,
  };
}
