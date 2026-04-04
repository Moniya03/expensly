/**
 * Category definitions with emoji and colors
 * Used for displaying transaction categories throughout the app
 */

import { Category } from '../types';
import { colors } from './theme';

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
    color: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  transport: {
    id: 'transport',
    label: 'Transport',
    emoji: '🚗',
    color: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
  },
  shopping: {
    id: 'shopping',
    label: 'Shopping',
    emoji: '🛍️',
    color: '#FFE66D',
    backgroundColor: 'rgba(255, 230, 109, 0.15)',
  },
  entertainment: {
    id: 'entertainment',
    label: 'Entertainment',
    emoji: '🎬',
    color: '#A855F7',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  bills: {
    id: 'bills',
    label: 'Bills',
    emoji: '📄',
    color: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  health: {
    id: 'health',
    label: 'Health',
    emoji: '💊',
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  education: {
    id: 'education',
    label: 'Education',
    emoji: '📚',
    color: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  other: {
    id: 'other',
    label: 'Other',
    emoji: '📦',
    color: colors.onSurfaceVariant,
    backgroundColor: 'rgba(169, 171, 179, 0.15)',
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
