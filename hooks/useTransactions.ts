import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Transaction } from '../types';
import { useAuthStore } from '../stores/authStore';

/**
 * Get the start of the current month
 */
function getMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/**
 * Get the end of the current month
 */
function getMonthEnd(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
}

/**
 * Fetch transactions for the current month
 */
async function fetchMonthlyTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('transaction_date', getMonthStart())
    .lte('transaction_date', getMonthEnd())
    .order('transaction_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Fetch recent transactions (last 5)
 */
async function fetchRecentTransactions(userId: string, limit = 5): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Create a new transaction
 */
async function createTransaction(
  transaction: Omit<Transaction, 'id' | 'created_at' | 'is_synced'>
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Hook to get monthly transactions
 */
export function useMonthlyTransactions() {
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['transactions', 'monthly', userId],
    queryFn: () => fetchMonthlyTransactions(userId!),
    enabled: !!userId,
  });
}

/**
 * Hook to get recent transactions
 */
export function useRecentTransactions(limit = 5) {
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['transactions', 'recent', userId, limit],
    queryFn: () => fetchRecentTransactions(userId!, limit),
    enabled: !!userId,
  });
}

/**
 * Hook to create a new transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: (transaction: Omit<Transaction, 'id' | 'created_at' | 'is_synced' | 'user_id'>) =>
      createTransaction({ ...transaction, user_id: userId! }),
    onSuccess: () => {
      // Invalidate transaction queries to refetch
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

/**
 * Calculate total spent this month
 */
export function useMonthlySpent() {
  const { data: transactions, isLoading, error } = useMonthlyTransactions();

  const totalPaise = transactions?.reduce((sum, t) => sum + t.amount_paise, 0) ?? 0;

  return {
    totalPaise,
    isLoading,
    error,
  };
}

/**
 * Calculate spending by category this month
 */
export function useCategorySpending() {
  const { data: transactions, isLoading, error } = useMonthlyTransactions();

  const byCategory = transactions?.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount_paise;
      return acc;
    },
    {} as Record<string, number>
  ) ?? {};

  return {
    byCategory,
    isLoading,
    error,
  };
}
