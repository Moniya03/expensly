/**
 * Date utilities for formatting and calculations
 */

const INDIA_TIMEZONE = 'Asia/Kolkata';

const getTimePartsInTimezone = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(date);
};

const getHourInTimezone = (date: Date, timeZone: string): number => {
  const hourPart = getTimePartsInTimezone(date, timeZone).find((part) => part.type === 'hour');
  return Number(hourPart?.value ?? 0);
};

/**
 * Format a date as a readable string
 * @param date - Date string or Date object
 * @param format - Format type
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date,
  format: 'full' | 'short' | 'time' | 'relative' = 'short'
): string => {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;

  switch (format) {
    case 'full':
      // "Monday, 15 January 2024"
      return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

    case 'short':
      // "15 Jan"
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });

    case 'time':
      // "2:30 PM"
      return d.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

    case 'relative':
      return getRelativeTime(d);

    default:
      return d.toLocaleDateString('en-IN');
  }
};

/**
 * Get relative time string (e.g., "Just now", "2 hours ago", "Yesterday")
 * @param date - Date to compare against now
 * @returns Relative time string
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return formatDate(date, 'short');
  }
};

/**
 * Get the start of today (midnight)
 * @returns Date object at midnight today
 */
export const getStartOfToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Get the start of this week (Monday)
 * @returns Date object at midnight on Monday
 */
export const getStartOfWeek = (): Date => {
  const now = new Date();
  const day = now.getDay();
  // Adjust for Monday start (day 0 is Sunday)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * Get the start of this month
 * @returns Date object at midnight on the 1st
 */
export const getStartOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};

/**
 * Get the end of this month
 * @returns Date object at end of the last day
 */
export const getEndOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
};

/**
 * Check if a date is today
 * @param date - Date to check
 * @returns True if the date is today
 */
export const isToday = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is yesterday
 * @param date - Date to check
 * @returns True if the date is yesterday
 */
export const isYesterday = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * Get ISO date string (YYYY-MM-DD) for database queries
 * @param date - Date to format
 * @returns ISO date string
 */
export const toISODateString = (date: Date): string => {
  return toLocalDateString(date);
};

export const parseLocalDate = (date: string | Date): Date => {
  if (date instanceof Date) {
    return date;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(date);
};

export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get days remaining until a target date
 * @param targetDate - Target date string or Date
 * @returns Number of days remaining (negative if past)
 */
export const getDaysRemaining = (targetDate: string | Date): number => {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Get greeting based on time of day
 * @returns Greeting string
 */
export const getGreeting = (): string => {
  const hour = getHourInTimezone(new Date(), INDIA_TIMEZONE);
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
};
