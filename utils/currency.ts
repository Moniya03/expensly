/**
 * Currency utilities for handling Indian Rupees
 * All amounts are stored in paise (1 rupee = 100 paise)
 */

/**
 * Convert paise to rupees
 * @param paise - Amount in paise
 * @returns Amount in rupees as a number
 */
export const paiseToRupees = (paise: number): number => {
  return paise / 100;
};

/**
 * Convert rupees to paise
 * @param rupees - Amount in rupees
 * @returns Amount in paise as a number
 */
export const rupeesToPaise = (rupees: number): number => {
  return Math.round(rupees * 100);
};

/**
 * Format paise amount as rupees string with Indian formatting
 * @param paise - Amount in paise
 * @param options - Formatting options
 * @returns Formatted rupee string (e.g., "₹1,234.56")
 */
export const formatRupees = (
  paise: number,
  options: {
    /** Show decimal places (default: false for whole numbers, true for fractions) */
    showDecimals?: boolean;
    /** Show rupee symbol (default: true) */
    showSymbol?: boolean;
    /** Compact format for large numbers (e.g., 1.2K, 12L) */
    compact?: boolean;
  } = {}
): string => {
  const { showSymbol = true, compact = false } = options;
  const rupees = paiseToRupees(paise);

  // Determine if we need decimals
  const hasDecimals = rupees % 1 !== 0;
  const showDecimals = options.showDecimals ?? hasDecimals;

  const symbol = showSymbol ? '₹' : '';

  // Compact formatting for large numbers
  if (compact) {
    if (rupees >= 10000000) {
      // Crores (1Cr = 10 million)
      const crores = rupees / 10000000;
      return `${symbol}${crores.toFixed(1)}Cr`;
    } else if (rupees >= 100000) {
      // Lakhs (1L = 100K)
      const lakhs = rupees / 100000;
      return `${symbol}${lakhs.toFixed(1)}L`;
    } else if (rupees >= 1000) {
      // Thousands
      const thousands = rupees / 1000;
      return `${symbol}${thousands.toFixed(1)}K`;
    }
  }

  // Indian number formatting (lakhs and crores)
  const formatted = rupees.toLocaleString('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  return `${symbol}${formatted}`;
};

/**
 * Format paise amount as a short string for display
 * Uses compact notation for readability
 * @param paise - Amount in paise
 * @returns Short formatted string (e.g., "₹1.2K")
 */
export const formatRupeesShort = (paise: number): string => {
  return formatRupees(paise, { compact: true });
};

/**
 * Parse a rupee string to paise
 * Handles formats like "₹1,234.56", "1234.56", "₹1234"
 * @param value - String value to parse
 * @returns Amount in paise or null if invalid
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
  if (isNaN(rupees) || rupees < 0) {
    return null;
  }

  return rupeesToPaise(rupees);
};

/**
 * Calculate percentage of budget spent
 * @param spentPaise - Amount spent in paise
 * @param budgetPaise - Budget limit in paise
 * @returns Percentage as a number (0-100+)
 */
export const calculateBudgetPercentage = (
  spentPaise: number,
  budgetPaise: number
): number => {
  if (budgetPaise <= 0) {
    return 0;
  }
  return (spentPaise / budgetPaise) * 100;
};

/**
 * Get budget status based on percentage spent
 * @param percentage - Percentage of budget spent
 * @returns Status color indicator
 */
export const getBudgetStatus = (
  percentage: number
): 'safe' | 'warning' | 'danger' => {
  if (percentage >= 100) {
    return 'danger';
  } else if (percentage >= 80) {
    return 'warning';
  }
  return 'safe';
};
