import type {
  BackupBudget,
  BackupGoal,
  BackupGoalIcon,
  BackupTransaction,
  Category,
  ExpenslyBackupData,
} from '../types';

export const BACKUP_SCHEMA_VERSION = 1;

export const VALID_CATEGORIES: Set<Category> = new Set([
  'food',
  'transport',
  'shopping',
  'entertainment',
  'bills',
  'health',
  'education',
  'other',
]);

export function normalizeCategory(category: unknown): Category {
  if (typeof category === 'string' && VALID_CATEGORIES.has(category.toLowerCase() as Category)) {
    return category.toLowerCase() as Category;
  }
  return 'other';
}

export type ParsedBackupFile = {
  backup: ExpenslyBackupData;
  fileName: string;
  counts: {
    transactions: number;
    budgets: number;
    goals: number;
    icons: number;
  };
};

/**
 * Parse and validate JSON backup contents.
 * Pure logic without native file system / UI dependencies.
 */
export function parseAndValidateBackupJson(
  fileContent: string,
  fileName = 'backup.json',
): ParsedBackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fileContent);
  } catch {
    throw new Error('Selected file is not valid JSON. Please pick an Expensly backup JSON file.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid backup file format.');
  }

  // Handle various backup structures (official versioned vs raw exported array)
  const rawObj = parsed as Record<string, unknown>;
  let rawTransactions: unknown[] = [];
  let rawBudgets: unknown[] = [];
  let rawGoals: unknown[] = [];
  let rawIcons: unknown[] = [];

  if (Array.isArray(parsed)) {
    // Array of transactions
    rawTransactions = parsed;
  } else if (rawObj.data && typeof rawObj.data === 'object') {
    // Official ExpenslyBackupData format
    const dataSection = rawObj.data as Record<string, unknown>;
    rawTransactions = Array.isArray(dataSection.transactions) ? dataSection.transactions : [];
    rawBudgets = Array.isArray(dataSection.budgets) ? dataSection.budgets : [];
    rawGoals = Array.isArray(dataSection.savings_goals)
      ? dataSection.savings_goals
      : Array.isArray(dataSection.goals)
        ? dataSection.goals
        : [];
    rawIcons = Array.isArray(dataSection.user_goal_icons) ? dataSection.user_goal_icons : [];
  } else {
    // Flat object with top-level arrays
    if (Array.isArray(rawObj.transactions)) rawTransactions = rawObj.transactions;
    if (Array.isArray(rawObj.budgets)) rawBudgets = rawObj.budgets;
    if (Array.isArray(rawObj.savings_goals)) rawGoals = rawObj.savings_goals;
    else if (Array.isArray(rawObj.goals)) rawGoals = rawObj.goals;
    if (Array.isArray(rawObj.user_goal_icons)) rawIcons = rawObj.user_goal_icons;
  }

  // Validate and parse transactions
  const transactions: BackupTransaction[] = [];
  for (const item of rawTransactions) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const amountNum = Number(row.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) continue;

    const dateVal =
      typeof row.date === 'string'
        ? row.date.split('T')[0]
        : typeof row.transaction_date === 'string'
          ? row.transaction_date.split('T')[0]
          : new Date().toISOString().split('T')[0];

    const noteVal =
      typeof row.note === 'string'
        ? row.note
        : typeof row.description === 'string'
          ? row.merchant
            ? `${row.description} · ${row.merchant}`
            : row.description
          : null;

    transactions.push({
      amount: Math.round(amountNum),
      category: normalizeCategory(row.category),
      note: noteVal,
      input_method: row.input_method === 'voice' ? 'voice' : 'manual',
      voice_transcript: typeof row.voice_transcript === 'string' ? row.voice_transcript : null,
      date: dateVal,
      created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
    });
  }

  // Validate and parse budgets
  const budgets: BackupBudget[] = [];
  for (const item of rawBudgets) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const amountNum = Number(row.amount);
    const monthNum = Number(row.month);
    const yearNum = Number(row.year);
    if (!Number.isFinite(amountNum) || amountNum <= 0) continue;
    if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) continue;
    if (!Number.isFinite(yearNum) || yearNum < 2000) continue;

    budgets.push({
      category: row.category ? normalizeCategory(row.category) : null,
      amount: Math.round(amountNum),
      month: monthNum,
      year: yearNum,
      created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
    });
  }

  // Validate and parse savings goals
  const savings_goals: BackupGoal[] = [];
  for (const item of rawGoals) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    const targetAmount = Number(row.target_amount);
    if (!name || !Number.isFinite(targetAmount) || targetAmount <= 0) continue;

    const savedAmount = Number(row.saved_amount ?? 0);
    const isCompleted =
      typeof row.is_completed === 'boolean'
        ? row.is_completed
        : Number.isFinite(savedAmount) && savedAmount >= targetAmount;

    savings_goals.push({
      name,
      target_amount: Math.round(targetAmount),
      saved_amount: Number.isFinite(savedAmount) ? Math.round(savedAmount) : 0,
      deadline:
        typeof row.deadline === 'string'
          ? row.deadline
          : typeof row.target_date === 'string'
            ? row.target_date
            : null,
      emoji:
        typeof row.emoji === 'string'
          ? row.emoji
          : typeof row.icon === 'string'
            ? row.icon
            : 'briefcase-outline',
      is_completed: isCompleted,
      completed_at: typeof row.completed_at === 'string' ? row.completed_at : null,
      created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
    });
  }

  // Validate and parse custom icons
  const user_goal_icons: BackupGoalIcon[] = [];
  for (const item of rawIcons) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const iconName = typeof row.icon_name === 'string' ? row.icon_name.trim() : '';
    const color = typeof row.color === 'string' ? row.color.trim() : '#3b82f6';
    if (!iconName) continue;

    user_goal_icons.push({
      icon_name: iconName,
      label: typeof row.label === 'string' ? row.label : null,
      color,
    });
  }

  if (
    transactions.length === 0 &&
    budgets.length === 0 &&
    savings_goals.length === 0 &&
    user_goal_icons.length === 0
  ) {
    throw new Error('This backup file does not contain any valid Expensly data to restore.');
  }

  const normalizedBackup: ExpenslyBackupData = {
    version: typeof rawObj.version === 'number' ? rawObj.version : BACKUP_SCHEMA_VERSION,
    app: 'Expensly',
    exported_at:
      typeof rawObj.exported_at === 'string' ? rawObj.exported_at : new Date().toISOString(),
    metadata: {
      counts: {
        transactions: transactions.length,
        budgets: budgets.length,
        savings_goals: savings_goals.length,
        user_goal_icons: user_goal_icons.length,
      },
    },
    data: {
      transactions,
      budgets,
      savings_goals,
      user_goal_icons,
    },
  };

  return {
    backup: normalizedBackup,
    fileName,
    counts: {
      transactions: transactions.length,
      budgets: budgets.length,
      goals: savings_goals.length,
      icons: user_goal_icons.length,
    },
  };
}
