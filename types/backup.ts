import type { Category } from './index';

export interface BackupTransaction {
  amount: number;
  category: Category;
  note?: string | null;
  merchant?: string | null;
  description?: string | null;
  input_method?: 'voice' | 'manual' | null;
  voice_transcript?: string | null;
  date: string;
  created_at?: string;
}

export interface BackupBudget {
  category?: Category | null;
  amount: number;
  month: number;
  year: number;
  created_at?: string;
}

export interface BackupGoal {
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline?: string | null;
  target_date?: string | null;
  emoji?: string;
  icon?: string;
  is_completed?: boolean;
  completed_at?: string | null;
  created_at?: string;
}

export interface BackupGoalIcon {
  icon_name: string;
  label?: string | null;
  color: string;
}

export interface ExpenslyBackupData {
  version: number;
  app: 'Expensly';
  exported_at: string;
  metadata?: {
    counts?: {
      transactions?: number;
      budgets?: number;
      savings_goals?: number;
      user_goal_icons?: number;
    };
    app_version?: string;
  };
  data: {
    transactions: BackupTransaction[];
    budgets?: BackupBudget[];
    savings_goals?: BackupGoal[];
    user_goal_icons?: BackupGoalIcon[];
  };
}

export interface RestoreSummary {
  mode: 'merge' | 'replace';
  transactionsImported: number;
  transactionsSkipped: number;
  budgetsImported: number;
  budgetsSkipped: number;
  goalsImported: number;
  goalsSkipped: number;
  iconsImported: number;
  iconsSkipped: number;
  totalImported: number;
}
