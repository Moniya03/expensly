import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { CreateTransactionInput, Transaction } from '../types';
import { useAuthStore } from '../stores/authStore';
import { toLocalDateString } from '../utils/date';

const TRANSACTION_COLUMNS = 'id, user_id, amount, category, note, input_method, voice_transcript, date, created_at';

type TransactionRow = {
  id: string;
  user_id: string;
  amount: number;
  category: Transaction['category'];
  note: string | null;
  input_method: 'voice' | 'manual' | null;
  voice_transcript: string | null;
  date: string;
  created_at: string;
};

function splitNote(note: string | null): Pick<Transaction, 'description' | 'merchant'> {
  if (!note) {
    return {
      description: 'Expense',
      merchant: null,
    };
  }

  const separatorIndex = note.lastIndexOf(' · ');
  if (separatorIndex === -1) {
    return {
      description: note,
      merchant: null,
    };
  }

  const description = note.slice(0, separatorIndex).trim();
  const merchant = note.slice(separatorIndex + 3).trim();

  return {
    description: description || merchant || 'Expense',
    merchant: merchant || null,
  };
}

function mapRowToTransaction(row: TransactionRow): Transaction {
  const { description, merchant } = splitNote(row.note || row.voice_transcript);

  return {
    id: row.id,
    user_id: row.user_id,
    amount: row.amount,
    category: row.category,
    description,
    merchant,
    transaction_date: row.date,
    created_at: row.created_at,
    source: row.input_method === 'voice' ? 'voice' : 'manual',
    is_synced: true,
  };
}

function mapTransactionToInsertRow(
  transaction: CreateTransactionInput & { user_id: string }
): Omit<TransactionRow, 'id' | 'created_at'> {
  const note = transaction.merchant
    ? `${transaction.description}${transaction.description ? ' · ' : ''}${transaction.merchant}`
    : transaction.description;

  return {
    user_id: transaction.user_id,
    amount: transaction.amount,
    category: transaction.category,
    note,
    input_method: transaction.source,
    voice_transcript: transaction.voice_transcript ?? null,
    date: transaction.transaction_date.split('T')[0],
  };
}

function mapTransactionToUpdateRow(
  transaction: CreateTransactionInput
): Partial<Omit<TransactionRow, 'id' | 'user_id' | 'created_at' | 'voice_transcript'>> {
  const note = transaction.merchant
    ? `${transaction.description}${transaction.description ? ' · ' : ''}${transaction.merchant}`
    : transaction.description;

  return {
    amount: transaction.amount,
    category: transaction.category,
    note,
    input_method: transaction.source,
    date: transaction.transaction_date.split('T')[0],
  };
}

/**
 * Get the start of the current month
 */
function getMonthStart(): string {
  const now = new Date();
  return toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
}

/**
 * Get the end of the current month
 */
function getMonthEnd(): string {
  const now = new Date();
  return toLocalDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}

/**
 * Fetch transactions for the current month
 */
async function fetchMonthlyTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .eq('user_id', userId)
    .gte('date', getMonthStart())
    .lte('date', getMonthEnd())
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapRowToTransaction);
}

/**
 * Fetch recent transactions (last 5)
 */
async function fetchRecentTransactions(userId: string, limit = 5): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapRowToTransaction);
}

async function fetchAllTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapRowToTransaction);
}

async function fetchTransactionById(userId: string, id: string): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .eq('user_id', userId)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRowToTransaction(data as TransactionRow);
}

/**
 * Create a new transaction
 */
async function createTransaction(
  transaction: CreateTransactionInput & { user_id: string }
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert(mapTransactionToInsertRow(transaction))
    .select(TRANSACTION_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRowToTransaction(data as TransactionRow);
}

async function updateTransaction(
  userId: string,
  id: string,
  transaction: CreateTransactionInput
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update(mapTransactionToUpdateRow(transaction))
    .eq('user_id', userId)
    .eq('id', id)
    .select(TRANSACTION_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRowToTransaction(data as TransactionRow);
}

async function deleteTransaction(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
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

export function useAllTransactions() {
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['transactions', 'all', userId],
    queryFn: () => fetchAllTransactions(userId!),
    enabled: !!userId,
  });
}

export function useTransaction(id?: string) {
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['transaction', userId, id],
    queryFn: () => fetchTransactionById(userId!, id!),
    enabled: !!userId && !!id,
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
    mutationFn: (transaction: CreateTransactionInput) =>
      createTransaction({ ...transaction, user_id: userId! }),
    onSuccess: () => {
      // Invalidate transaction queries to refetch
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useUpdateTransaction(id: string) {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: (transaction: CreateTransactionInput) =>
      updateTransaction(userId!, id, transaction),
    onSuccess: (updatedTransaction) => {
      queryClient.setQueryData(['transaction', userId, id], updatedTransaction);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(userId!, id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['transaction', userId, id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

/**
 * Calculate total spent this month
 */
export function useMonthlySpent() {
  const { data: transactions, isLoading, error } = useMonthlyTransactions();

  const total = transactions?.reduce((sum, t) => sum + t.amount, 0) ?? 0;

  return {
    total,
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
      acc[t.category] = (acc[t.category] || 0) + t.amount;
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
