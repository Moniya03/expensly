import * as DocumentPicker from 'expo-document-picker';
import { cacheDirectory, readAsStringAsync, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '../stores/authStore';
import type {
  BackupBudget,
  BackupGoal,
  BackupGoalIcon,
  BackupTransaction,
  ExpenslyBackupData,
  RestoreSummary,
} from '../types';
import {
  BACKUP_SCHEMA_VERSION,
  normalizeCategory,
  type ParsedBackupFile,
  parseAndValidateBackupJson,
} from './backupParser';
import { supabase } from './supabase';

const CHUNK_SIZE = 100;

function formatDateForFilename(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}${month}${day}-${hours}${minutes}`;
}

async function chunkedInsert<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  chunkSize = CHUNK_SIZE,
): Promise<void> {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) {
      throw new Error(`Failed to restore ${table}: ${error.message}`);
    }
  }
}

/**
 * Fetch and construct full backup JSON from database for given userId.
 */
export async function createBackupPayload(userId: string): Promise<ExpenslyBackupData> {
  const [transactionsRes, budgetsRes, goalsRes, iconsRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, category, note, input_method, voice_transcript, date, created_at')
      .eq('user_id', userId)
      .order('date', { ascending: false }),
    supabase
      .from('budgets')
      .select('category, amount, month, year, created_at')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false }),
    supabase
      .from('savings_goals')
      .select(
        'name, target_amount, saved_amount, deadline, emoji, is_completed, completed_at, created_at',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_goal_icons')
      .select('icon_name, label, color')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
  ]);

  if (transactionsRes.error) {
    throw new Error(`Failed to fetch transactions: ${transactionsRes.error.message}`);
  }
  if (budgetsRes.error) {
    throw new Error(`Failed to fetch budgets: ${budgetsRes.error.message}`);
  }
  if (goalsRes.error) {
    throw new Error(`Failed to fetch savings goals: ${goalsRes.error.message}`);
  }
  if (iconsRes.error) {
    throw new Error(`Failed to fetch custom icons: ${iconsRes.error.message}`);
  }

  const transactions: BackupTransaction[] = (transactionsRes.data ?? []).map((row) => ({
    amount: Number(row.amount),
    category: normalizeCategory(row.category),
    note: row.note ?? null,
    input_method: row.input_method ?? 'manual',
    voice_transcript: row.voice_transcript ?? null,
    date: row.date,
    created_at: row.created_at,
  }));

  const budgets: BackupBudget[] = (budgetsRes.data ?? []).map((row) => ({
    category: row.category ? normalizeCategory(row.category) : null,
    amount: Number(row.amount),
    month: Number(row.month),
    year: Number(row.year),
    created_at: row.created_at,
  }));

  const savings_goals: BackupGoal[] = (goalsRes.data ?? []).map((row) => ({
    name: row.name,
    target_amount: Number(row.target_amount),
    saved_amount: Number(row.saved_amount),
    deadline: row.deadline ?? null,
    emoji: row.emoji ?? 'briefcase-outline',
    is_completed: Boolean(row.is_completed),
    completed_at: row.completed_at ?? null,
    created_at: row.created_at,
  }));

  const user_goal_icons: BackupGoalIcon[] = (iconsRes.data ?? []).map((row) => ({
    icon_name: row.icon_name,
    label: row.label ?? null,
    color: row.color,
  }));

  return {
    version: BACKUP_SCHEMA_VERSION,
    app: 'Expensly',
    exported_at: new Date().toISOString(),
    metadata: {
      counts: {
        transactions: transactions.length,
        budgets: budgets.length,
        savings_goals: savings_goals.length,
        user_goal_icons: user_goal_icons.length,
      },
      app_version: (require('../package.json') as { version?: string }).version ?? '1.6.0',
    },
    data: {
      transactions,
      budgets,
      savings_goals,
      user_goal_icons,
    },
  };
}

/**
 * Export backup as a JSON file and trigger native share sheet.
 */
export async function exportBackupJson(): Promise<{
  success: boolean;
  filePath: string;
  counts: { transactions: number; budgets: number; goals: number };
}> {
  const userId = useAuthStore.getState().session?.user?.id;
  if (!userId) {
    throw new Error('You must be signed in to export data');
  }

  const backupData = await createBackupPayload(userId);
  const jsonContent = JSON.stringify(backupData, null, 2);

  const timestamp = formatDateForFilename(new Date());
  const filename = `expensly-backup-${timestamp}.json`;
  const filePath = `${cacheDirectory ?? ''}${filename}`;

  await writeAsStringAsync(filePath, jsonContent);

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Save or Share Expensly Backup',
      UTI: 'public.json',
    });
  }

  return {
    success: true,
    filePath,
    counts: {
      transactions: backupData.data.transactions.length,
      budgets: backupData.data.budgets?.length ?? 0,
      goals: backupData.data.savings_goals?.length ?? 0,
    },
  };
}

export type { ParsedBackupFile } from './backupParser';
export { parseAndValidateBackupJson } from './backupParser';

/**
 * Open system document picker, read JSON file and validate structure.
 */
export async function pickAndValidateBackupFile(): Promise<ParsedBackupFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', '*/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const fileContent = await readAsStringAsync(asset.uri);

  return parseAndValidateBackupJson(fileContent, asset.name);
}

/**
 * Execute restore operation (merge or replace) for the signed in user.
 */
export async function restoreBackupData(
  userId: string,
  backup: ExpenslyBackupData,
  mode: 'merge' | 'replace',
): Promise<RestoreSummary> {
  if (!userId) {
    throw new Error('User is not authenticated');
  }

  const summary: RestoreSummary = {
    mode,
    transactionsImported: 0,
    transactionsSkipped: 0,
    budgetsImported: 0,
    budgetsSkipped: 0,
    goalsImported: 0,
    goalsSkipped: 0,
    iconsImported: 0,
    iconsSkipped: 0,
    totalImported: 0,
  };

  const backupTransactions = backup.data.transactions ?? [];
  const backupBudgets = backup.data.budgets ?? [];
  const backupGoals = backup.data.savings_goals ?? [];
  const backupIcons = backup.data.user_goal_icons ?? [];

  if (mode === 'replace') {
    // 1. Wipe existing data for user across all tables
    const [delTrans, delBudgets, delGoals, delIcons] = await Promise.all([
      supabase.from('transactions').delete().eq('user_id', userId),
      supabase.from('budgets').delete().eq('user_id', userId),
      supabase.from('savings_goals').delete().eq('user_id', userId),
      supabase.from('user_goal_icons').delete().eq('user_id', userId),
    ]);

    if (delTrans.error) {
      throw new Error(`Failed to clear existing transactions: ${delTrans.error.message}`);
    }
    if (delBudgets.error) {
      throw new Error(`Failed to clear existing budgets: ${delBudgets.error.message}`);
    }
    if (delGoals.error) {
      throw new Error(`Failed to clear existing goals: ${delGoals.error.message}`);
    }
    if (delIcons.error) {
      throw new Error(`Failed to clear existing custom icons: ${delIcons.error.message}`);
    }

    // 2. Insert all items
    const transactionsToInsert = backupTransactions.map((t) => ({
      user_id: userId,
      amount: t.amount,
      category: t.category,
      note: t.note ?? null,
      input_method: t.input_method ?? 'manual',
      voice_transcript: t.voice_transcript ?? null,
      date: t.date,
      created_at: t.created_at ?? new Date().toISOString(),
    }));
    await chunkedInsert('transactions', transactionsToInsert);
    summary.transactionsImported = transactionsToInsert.length;

    const budgetsToInsert = backupBudgets.map((b) => ({
      user_id: userId,
      category: b.category ?? null,
      amount: b.amount,
      month: b.month,
      year: b.year,
      created_at: b.created_at ?? new Date().toISOString(),
    }));
    await chunkedInsert('budgets', budgetsToInsert);
    summary.budgetsImported = budgetsToInsert.length;

    const goalsToInsert = backupGoals.map((g) => ({
      user_id: userId,
      name: g.name,
      target_amount: g.target_amount,
      saved_amount: g.saved_amount,
      deadline: g.deadline ?? g.target_date ?? null,
      emoji: g.emoji ?? g.icon ?? 'briefcase-outline',
      is_completed: g.is_completed ?? false,
      completed_at: g.completed_at ?? null,
      created_at: g.created_at ?? new Date().toISOString(),
    }));
    await chunkedInsert('savings_goals', goalsToInsert);
    summary.goalsImported = goalsToInsert.length;

    const iconsToInsert = backupIcons.map((i) => ({
      user_id: userId,
      icon_name: i.icon_name,
      label: i.label ?? null,
      color: i.color,
    }));
    await chunkedInsert('user_goal_icons', iconsToInsert);
    summary.iconsImported = iconsToInsert.length;
  } else {
    // Merge mode: Deduplicate against existing data

    // Deduplicate Transactions
    const { data: existingTransactions, error: errTrans } = await supabase
      .from('transactions')
      .select('date, amount, category, note')
      .eq('user_id', userId);

    if (errTrans) {
      throw new Error(`Failed to read existing transactions: ${errTrans.message}`);
    }

    const transactionKey = (date: string, amount: number, category: string, note?: string | null) =>
      `${date}|${Math.round(amount)}|${category.toLowerCase()}|${(note || '').trim().toLowerCase()}`;

    const existingTxSet = new Set(
      (existingTransactions ?? []).map((t) =>
        transactionKey(t.date, Number(t.amount), t.category, t.note),
      ),
    );

    const transactionsToInsert: Record<string, unknown>[] = [];
    for (const t of backupTransactions) {
      const key = transactionKey(t.date, t.amount, t.category, t.note);
      if (existingTxSet.has(key)) {
        summary.transactionsSkipped += 1;
      } else {
        existingTxSet.add(key); // Also avoid duplicates in the same backup payload
        transactionsToInsert.push({
          user_id: userId,
          amount: t.amount,
          category: t.category,
          note: t.note ?? null,
          input_method: t.input_method ?? 'manual',
          voice_transcript: t.voice_transcript ?? null,
          date: t.date,
          created_at: t.created_at ?? new Date().toISOString(),
        });
      }
    }
    await chunkedInsert('transactions', transactionsToInsert);
    summary.transactionsImported = transactionsToInsert.length;

    // Deduplicate Budgets
    const { data: existingBudgets, error: errBudgets } = await supabase
      .from('budgets')
      .select('month, year, category')
      .eq('user_id', userId);

    if (errBudgets) {
      throw new Error(`Failed to read existing budgets: ${errBudgets.message}`);
    }

    const budgetKey = (month: number, year: number, category?: string | null) =>
      `${month}|${year}|${(category || '').toLowerCase()}`;

    const existingBudgetSet = new Set(
      (existingBudgets ?? []).map((b) => budgetKey(b.month, b.year, b.category)),
    );

    const budgetsToInsert: Record<string, unknown>[] = [];
    for (const b of backupBudgets) {
      const key = budgetKey(b.month, b.year, b.category);
      if (existingBudgetSet.has(key)) {
        summary.budgetsSkipped += 1;
      } else {
        existingBudgetSet.add(key);
        budgetsToInsert.push({
          user_id: userId,
          category: b.category ?? null,
          amount: b.amount,
          month: b.month,
          year: b.year,
          created_at: b.created_at ?? new Date().toISOString(),
        });
      }
    }
    await chunkedInsert('budgets', budgetsToInsert);
    summary.budgetsImported = budgetsToInsert.length;

    // Deduplicate Savings Goals
    const { data: existingGoals, error: errGoals } = await supabase
      .from('savings_goals')
      .select('name')
      .eq('user_id', userId);

    if (errGoals) {
      throw new Error(`Failed to read existing goals: ${errGoals.message}`);
    }

    const existingGoalSet = new Set(
      (existingGoals ?? []).map((g) => (g.name || '').trim().toLowerCase()),
    );

    const goalsToInsert: Record<string, unknown>[] = [];
    for (const g of backupGoals) {
      const key = g.name.trim().toLowerCase();
      if (existingGoalSet.has(key)) {
        summary.goalsSkipped += 1;
      } else {
        existingGoalSet.add(key);
        goalsToInsert.push({
          user_id: userId,
          name: g.name,
          target_amount: g.target_amount,
          saved_amount: g.saved_amount,
          deadline: g.deadline ?? g.target_date ?? null,
          emoji: g.emoji ?? g.icon ?? 'briefcase-outline',
          is_completed: g.is_completed ?? false,
          completed_at: g.completed_at ?? null,
          created_at: g.created_at ?? new Date().toISOString(),
        });
      }
    }
    await chunkedInsert('savings_goals', goalsToInsert);
    summary.goalsImported = goalsToInsert.length;

    // Deduplicate Custom Icons
    const { data: existingIcons, error: errIcons } = await supabase
      .from('user_goal_icons')
      .select('icon_name')
      .eq('user_id', userId);

    if (errIcons) {
      throw new Error(`Failed to read existing icons: ${errIcons.message}`);
    }

    const existingIconSet = new Set(
      (existingIcons ?? []).map((i) => (i.icon_name || '').trim().toLowerCase()),
    );

    const iconsToInsert: Record<string, unknown>[] = [];
    for (const i of backupIcons) {
      const key = i.icon_name.trim().toLowerCase();
      if (existingIconSet.has(key)) {
        summary.iconsSkipped += 1;
      } else {
        existingIconSet.add(key);
        iconsToInsert.push({
          user_id: userId,
          icon_name: i.icon_name,
          label: i.label ?? null,
          color: i.color,
        });
      }
    }
    await chunkedInsert('user_goal_icons', iconsToInsert);
    summary.iconsImported = iconsToInsert.length;
  }

  summary.totalImported =
    summary.transactionsImported +
    summary.budgetsImported +
    summary.goalsImported +
    summary.iconsImported;

  return summary;
}
