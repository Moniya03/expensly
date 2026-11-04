import type { Category } from '../types';

/**
 * Category configuration interface
 */
export interface CategoryConfig {
  id: Category;
  label: string;
  iconName: string;
  iconColor: string;
  color: string;
  iconBackgroundColor?: string;
}

/**
 * Category configuration map
 * Harmonized Material 3 category palettes
 */
export const categories: Record<Category, CategoryConfig> = {
  food: {
    id: 'food',
    label: 'Food',
    iconName: 'silverware-fork-knife',
    iconColor: '#F97316',
    color: '#F97316',
    iconBackgroundColor: 'rgba(249, 115, 22, 0.16)',
  },
  transport: {
    id: 'transport',
    label: 'Transport',
    iconName: 'car',
    iconColor: '#3B82F6',
    color: '#3B82F6',
    iconBackgroundColor: 'rgba(59, 130, 246, 0.16)',
  },
  shopping: {
    id: 'shopping',
    label: 'Shopping',
    iconName: 'shopping',
    iconColor: '#EC4899',
    color: '#EC4899',
    iconBackgroundColor: 'rgba(236, 72, 153, 0.16)',
  },
  entertainment: {
    id: 'entertainment',
    label: 'Entertainment',
    iconName: 'headphones',
    iconColor: '#8B5CF6',
    color: '#8B5CF6',
    iconBackgroundColor: 'rgba(139, 92, 246, 0.16)',
  },
  bills: {
    id: 'bills',
    label: 'Bills',
    iconName: 'receipt',
    iconColor: '#EAB308',
    color: '#EAB308',
    iconBackgroundColor: 'rgba(234, 179, 8, 0.16)',
  },
  health: {
    id: 'health',
    label: 'Health',
    iconName: 'hospital-building',
    iconColor: '#10B981',
    color: '#10B981',
    iconBackgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  education: {
    id: 'education',
    label: 'Education',
    iconName: 'book',
    iconColor: '#06B6D4',
    color: '#06B6D4',
    iconBackgroundColor: 'rgba(6, 182, 212, 0.16)',
  },
  other: {
    id: 'other',
    label: 'Other',
    iconName: 'package-variant',
    iconColor: '#64748B',
    color: '#64748B',
    iconBackgroundColor: 'rgba(100, 116, 139, 0.16)',
  },
};

/**
 * Get category configuration by ID
 */
export const getCategoryConfig = (category: Category): CategoryConfig => {
  return categories[category] || categories.other;
};

/**
 * Get category color by ID
 */
export const getCategoryColor = (category: Category): string => {
  return getCategoryConfig(category).color;
};

/**
 * Get all categories as an array for pickers
 */
export const categoryList: CategoryConfig[] = Object.values(categories);
