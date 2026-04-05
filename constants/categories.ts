/**
 * Category definitions with emoji and colors
 * Used for displaying transaction categories throughout the app
 */

import { Category } from '../types';

export interface CategoryConfig {
  /** Category identifier */
  id: Category;
  /** Display label */
  label: string;
  /** Emoji icon for the category */
  emoji: string;
  /** Primary color for the category */
  color: string;
  /** Background color (with opacity) for cards/badges */
  backgroundColor: string;
}

/**
 * Category configuration map
 * Each category has an emoji, label, and color scheme
 */
export const categories: Record<Category, CategoryConfig> = {
  food: {
    id: 'food',
    label: 'Food',
    emoji: '🍕',
    color: '#FF9500',
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
  },
  transport: {
    id: 'transport',
    label: 'Transport',
    emoji: '🚗',
    color: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  shopping: {
    id: 'shopping',
    label: 'Shopping',
    emoji: '🛍️',
    color: '#FF2D55',
    backgroundColor: 'rgba(255, 45, 85, 0.15)',
  },
  entertainment: {
    id: 'entertainment',
    label: 'Entertainment',
    emoji: '🎬',
    color: '#FFCC00',
    backgroundColor: 'rgba(255, 204, 0, 0.15)',
  },
  bills: {
    id: 'bills',
    label: 'Bills',
    emoji: '📄',
    color: '#5856D6',
    backgroundColor: 'rgba(88, 86, 214, 0.15)',
  },
  health: {
    id: 'health',
    label: 'Health',
    emoji: '💊',
    color: '#34C759',
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  education: {
    id: 'education',
    label: 'Education',
    emoji: '📚',
    color: '#00C7BE',
    backgroundColor: 'rgba(0, 199, 190, 0.15)',
  },
  other: {
    id: 'other',
    label: 'Other',
    emoji: '📦',
    color: '#8E8E93',
    backgroundColor: 'rgba(142, 142, 147, 0.15)',
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
