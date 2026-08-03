/**
 * Export user data as a CSV file and share it (Android share sheet).
 * Covers transactions, savings goals, budgets, and profile basics.
 */

import { supabase } from './supabase';
import { useAuthStore } from '../stores/authStore';

const csvEscape = (value: string | number | null | undefined): string => {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toCsv = (headers: string[], rows: (string | number | null | undefined)[][]) => {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','));
  }
  return lines.join('\n');
};

const exportTransactionsCsv = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('date, amount, category, note, merchant, voice_transcript, input_method, created_at')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);

  return toCsv(
    ['Date', 'Amount', 'Category', 'Note', 'Merchant', 'Input method', 'Logged at'],
    (data ?? []).map((row) => [
      row.date,
      row.amount,
      row.category,
      row.note ?? row.voice_transcript ?? '',
      row.merchant ?? '',
      row.input_method ?? '',
      row.created_at,
    ])
  );
};

const exportGoalsCsv = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('name, target_amount, saved_amount, target_date, icon, is_completed, completed_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return toCsv(
    ['Name', 'Target amount', 'Saved amount', 'Target date', 'Icon', 'Completed', 'Completed at', 'Created at'],
    (data ?? []).map((row) => [
      row.name,
      row.target_amount,
      row.saved_amount,
      row.target_date ?? '',
      row.icon,
      row.is_completed ? 'Yes' : 'No',
      row.completed_at ?? '',
      row.created_at,
    ])
  );
};

const exportBudgetsCsv = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('budgets')
    .select('month, year, amount, created_at')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) throw new Error(error.message);

  return toCsv(
    ['Month', 'Year', 'Amount', 'Created at'],
    (data ?? []).map((row) => [row.month, row.year, row.amount, row.created_at])
  );
};

/**
 * Build all CSVs, write them to the cache directory, and open the
 * Android share sheet so the user can save/send the files.
 */
export const exportUserData = async (): Promise<string[]> => {
  const userId = useAuthStore.getState().session?.user?.id;
  if (!userId) throw new Error('No active session');

  const [transactionsCsv, goalsCsv, budgetsCsv] = await Promise.all([
    exportTransactionsCsv(userId),
    exportGoalsCsv(userId),
    exportBudgetsCsv(userId),
  ]);

  const { writeAsStringAsync, EncodingType } = require('expo-file-system/legacy');
  const { cacheDirectory } = require('expo-file-system');

  const files: { path: string; data: string }[] = [
    { path: `${cacheDirectory}expensly-transactions.csv`, data: transactionsCsv },
    { path: `${cacheDirectory}expensly-goals.csv`, data: goalsCsv },
    { path: `${cacheDirectory}expensly-budgets.csv`, data: budgetsCsv },
  ];

  for (const file of files) {
    await writeAsStringAsync(file.path, file.data, {
      encoding: EncodingType.UTF8,
    });
  }

  return files.map((file) => file.path);
};
