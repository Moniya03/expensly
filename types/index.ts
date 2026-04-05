/**
 * Category types for transactions and budgets
 * Represents the different spending categories available in the app
 */
export type Category =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'bills'
  | 'health'
  | 'education'
  | 'other';

/**
 * User profile from Supabase authentication and user table
 * Contains user account information and app preferences
 */
export interface Profile {
  /** Unique user identifier (matches Supabase auth.users.id) */
  id: string;
  /** User's email address */
  email: string;
  /** Display name for the user (optional) */
  display_name: string | null;
  /** URL to user's avatar image (optional) */
  avatar_url: string | null;
  /** Monthly budget amount in rupees (whole numbers only) */
  monthly_budget: number;
  /** Current streak count for daily expense tracking */
  streak_count: number;
  /** Last date the streak was updated (ISO 8601 format) */
  streak_last_date: string | null;
  /** Timestamp when the profile was created */
  created_at: string;
  /** Timestamp when the profile was last updated */
  updated_at: string;
}

/**
 * Transaction (expense) record
 * Represents a single expense entry logged by the user
 */
export interface Transaction {
  /** Unique transaction identifier */
  id: string;
  /** User who created this transaction */
  user_id: string;
  /** Transaction amount in rupees (whole numbers only) */
  amount: number;
  /** Expense category */
  category: Category;
  /** Description of the expense */
  description: string;
  /** Merchant or vendor name (optional) */
  merchant: string | null;
  /** Date when the transaction occurred (ISO 8601 format) */
  transaction_date: string;
  /** Timestamp when the record was created */
  created_at: string;
  /** How the transaction was created (voice input or manual entry) */
  source: 'voice' | 'manual';
  /** Whether the transaction has been synced to the server */
  is_synced: boolean;
}

/**
 * Budget entry for category spending limits
 * Defines spending limits for specific categories over a time period
 */
export interface Budget {
  /** Unique budget identifier */
  id: string;
  /** User who created this budget */
  user_id: string;
  /** Category this budget applies to */
  category: Category;
  /** Budget limit amount in rupees (whole numbers only) */
  limit: number;
  /** Time period for the budget (weekly or monthly) */
  period: 'weekly' | 'monthly';
  /** Timestamp when the budget was created */
  created_at: string;
}

/**
 * Savings goal
 * Represents a financial goal the user is working towards
 */
export interface Goal {
  /** Unique goal identifier */
  id: string;
  /** User who created this goal */
  user_id: string;
  /** Name/description of the savings goal */
  name: string;
  /** Target amount to save in rupees (whole numbers only) */
  target: number;
  /** Amount saved so far in rupees (whole numbers only) */
  saved: number;
  /** Target date to achieve the goal (ISO 8601 format, optional) */
  target_date: string | null;
  /** Timestamp when the goal was created */
  created_at: string;
}

/**
 * Friend split for shared expenses
 * Tracks money owed between user and friends
 */
export interface Split {
  /** Unique split identifier */
  id: string;
  /** User who created this split */
  user_id: string;
  /** Name of the friend involved in the split */
  friend_name: string;
  /** Amount in rupees (whole numbers only) - positive if they owe you, negative if you owe them */
  amount: number;
  /** Description of what the split is for */
  description: string;
  /** Whether the split has been settled/paid */
  is_settled: boolean;
  /** Timestamp when the split was created */
  created_at: string;
}

/**
 * Authentication session
 * Contains session tokens and basic user info after login
 */
export interface AuthSession {
  /** JWT access token for API authentication */
  access_token: string;
  /** Refresh token for obtaining new access tokens */
  refresh_token: string;
  /** Basic user information */
  user: {
    /** Unique user identifier */
    id: string;
    /** User's email address */
    email: string;
  };
}

/**
 * Parsed expense from AI voice/text processing
 * Result from the AI parsing an expense description
 */
export interface ParsedExpense {
  /** Extracted amount in rupees (whole numbers only) */
  amount: number;
  /** Detected expense category */
  category: Category;
  /** Cleaned/normalized description */
  description: string;
  /** Extracted merchant name (optional) */
  merchant: string | null;
  /** AI confidence score (0-1) for the parsing accuracy */
  confidence: number;
}

/**
 * Parsed split from AI voice/text processing
 * Result from the AI parsing a split expense description
 */
export interface ParsedSplit {
  /** Name of the friend in the split */
  friend_name: string;
  /** Amount involved in the split in rupees (whole numbers only) */
  amount: number;
  /** Description of the split */
  description: string;
  /** Direction of the debt - who owes whom */
  direction: 'owes_you' | 'you_owe';
}
