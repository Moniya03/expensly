/**
 * Currency utilities for handling Indian Rupees
 * All amounts are stored in rupees (whole numbers only)
 */

/**
 * Format rupees amount as string with Indian formatting
 * @param amount - Amount in rupees
 * @param options - Formatting options
 * @returns Formatted rupee string (e.g., "₹1,234")
 */
export const formatRupees = (
  amount: number,
  options: {
    /** Show decimal places (default: false for whole numbers) */
    showDecimals?: boolean;
    /** Show rupee symbol (default: true) */
    showSymbol?: boolean;
    /** Compact format for large numbers (e.g., 1.2K, 12L) */
    compact?: boolean;
  } = {},
): string => {
  const { showSymbol = true, compact = false, showDecimals = false } = options;

  const symbol = showSymbol ? '₹' : '';

  // Compact formatting for large numbers
  if (compact) {
    if (amount >= 10000000) {
      // Crores (1Cr = 10 million)
      const crores = amount / 10000000;
      return `${symbol}${crores.toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      // Lakhs (1L = 100K)
      const lakhs = amount / 100000;
      return `${symbol}${lakhs.toFixed(1)}L`;
    } else if (amount >= 1000) {
      // Thousands
      const thousands = amount / 1000;
      return `${symbol}${thousands.toFixed(1)}K`;
    }
  }

  // Indian number formatting (lakhs and crores)
  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  return `${symbol}${formatted}`;
};

/**
 * Format rupees amount as a short string for display
 * Uses compact notation for readability
 * @param amount - Amount in rupees
 * @returns Short formatted string (e.g., "₹1.2K")
 */
export const formatRupeesShort = (amount: number): string => {
  return formatRupees(amount, { compact: true });
};

/**
 * Parse a rupee string to rupees
 * Handles formats like "₹1,234.56", "1234.56", "₹1234"
 * @param value - String value to parse
 * @returns Amount in rupees or null if invalid
 */
export const parseRupees = (value: string): number | null => {
  // Remove currency symbol, commas, and whitespace
  const cleaned = value.replace(/[₹,\s]/g, '').trim();

  // Handle empty string
  if (!cleaned) {
    return null;
  }

  // Parse as float
  const rupees = parseFloat(cleaned);

  // Validate
  if (Number.isNaN(rupees) || rupees < 0) {
    return null;
  }

  return Math.round(rupees);
};

/**
 * Calculate percentage of budget spent
 * @param spent - Amount spent in rupees
 * @param budget - Budget limit in rupees
 * @returns Percentage as a number (0-100+)
 */
export const calculateBudgetPercentage = (spent: number, budget: number): number => {
  if (budget <= 0) {
    return 0;
  }
  return (spent / budget) * 100;
};

/**
 * Get budget status based on percentage spent
 * @param percentage - Percentage of budget spent
 * @returns Status color indicator
 */
export const getBudgetStatus = (percentage: number): 'safe' | 'warning' | 'danger' => {
  if (percentage >= 100) {
    return 'danger';
  } else if (percentage >= 80) {
    return 'warning';
  }
  return 'safe';
};
