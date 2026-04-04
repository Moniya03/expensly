/**
 * Expensly Theme Constants
 * Design System: Sonic Architect
 * Color Mode: Dark
 * Primary Font: Plus Jakarta Sans
 */

/**
 * Color palette based on Sonic Architect design system
 */
export const colors = {
  // Primary colors
  primary: '#1A6BFF',
  secondary: '#00D4AA',
  tertiary: '#2DE2FF',

  // Surface colors (backgrounds)
  surface: '#0b0e14',
  surfaceContainer: '#161a21',
  surfaceContainerHigh: '#1c2028',
  surfaceContainerHighest: '#22262f',

  // Text colors
  onSurface: '#ecedf6',
  onSurfaceVariant: '#a9abb3',

  // Border and divider colors
  outline: '#73757d',
  outlineVariant: '#45484f',

  // Status colors
  error: '#ff716c',
} as const;

/**
 * Gradient configuration for primary gradient effect
 * Direction: 135deg from primary to secondary
 */
export const gradient = {
  direction: '135deg',
  start: colors.primary,
  end: colors.secondary,
  colors: [colors.primary, colors.secondary],
} as const;

/**
 * Spacing scale for consistent layout spacing
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Typography configuration
 * Font family: Plus Jakarta Sans
 */
export const typography = {
  fontFamily: {
    regular: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    semiBold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

/**
 * Border radius values for consistent rounded corners
 */
export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

/**
 * Complete theme object combining all theme constants
 */
export const theme = {
  colors,
  gradient,
  spacing,
  typography,
  borderRadius,
} as const;

// Type exports for TypeScript support
export type Colors = typeof colors;
export type Gradient = typeof gradient;
export type Spacing = typeof spacing;
export type Typography = typeof typography;
export type BorderRadius = typeof borderRadius;
export type Theme = typeof theme;
