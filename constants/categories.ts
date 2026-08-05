/**
 * Category definitions with icon and colors
 * Used for displaying transaction categories throughout the app
 */

import type { Category } from '../types';

export interface CategoryConfig {
  /** Category identifier */
  id: Category;
  /** Display label */
  label: string;
  /** MaterialCommunityIcons name for the category */
  iconName: string;
  /** Icon tint color */
  iconColor: string;
  /** Primary color for the category */
  color: string;
  /** Background tint for circular icon container */
  iconBackgroundColor?: string;
}

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const fullHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  const value = Number.parseInt(fullHex, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

/**
 * Category configuration map
 * Each category has an icon, label, and color scheme
 */
export const categories: Record<Category, CategoryConfig> = {
  food: {
    id: 'food',
    label: 'Food',
    iconName: 'silverware-fork-knife',
    iconColor: '#A9ABB3',
    color: '#FF9500',
    iconBackgroundColor: hexToRgba('#A9ABB3', 0.18),
  },
  transport: {
    id: 'transport',
    label: 'Transport',
    iconName: 'car',
    iconColor: '#FF3B30',
    color: '#007AFF',
    iconBackgroundColor: hexToRgba('#FF3B30', 0.18),
  },
  shopping: {
    id: 'shopping',
    label: 'Shopping',
    iconName: 'shopping',
    iconColor: '#FFCC00',
    color: '#FF2D55',
    iconBackgroundColor: hexToRgba('#FFCC00', 0.18),
  },
  entertainment: {
    id: 'entertainment',
    label: 'Entertainment',
    iconName: 'headphones',
    iconColor: '#1A6BFF',
    color: '#FFCC00',
    iconBackgroundColor: hexToRgba('#1A6BFF', 0.18),
  },
  bills: {
    id: 'bills',
    label: 'Bills',
    iconName: 'receipt',
    iconColor: '#A9ABB3',
    color: '#5856D6',
    iconBackgroundColor: hexToRgba('#A9ABB3', 0.18),
  },
  health: {
    id: 'health',
    label: 'Health',
    iconName: 'hospital-building',
    iconColor: '#A9ABB3',
    color: '#34C759',
    iconBackgroundColor: hexToRgba('#A9ABB3', 0.18),
  },
  education: {
    id: 'education',
    label: 'Education',
    iconName: 'book',
    iconColor: '#1A6BFF',
    color: '#00C7BE',
    iconBackgroundColor: hexToRgba('#1A6BFF', 0.18),
  },
  other: {
    id: 'other',
    label: 'Other',
    iconName: 'package-variant',
    iconColor: '#A9ABB3',
    color: '#8E8E93',
    iconBackgroundColor: hexToRgba('#AF52DE', 0.16),
  },
};

/**
 * Get category configuration by ID
 */
export const getCategoryConfig = (category: Category): CategoryConfig => {
  return categories[category] || categories.other;
};

/**
 * Get all categories as an array
 */
export const categoryList: CategoryConfig[] = Object.values(categories);

/**
 * Get the color for a specific category
 */
export const getCategoryColor = (category: Category): string => {
  return categories[category]?.color || categories.other.color;
};
