/**
 * Expensly Material Design 3 (MD3) Theme System
 *
 * ## Architecture Overview
 * Expensly uses Google Material Design 3 (Material You) powered by `react-native-paper` (MD3)
 * combined with `@pchmn/expo-material3-theme` for dynamic color scheme generation.
 *
 * ### 1. Core Principles
 * - **Dynamic & Accessible Schemes**: Color palettes derive from dynamic Material 3 schemes
 *   with accessible contrast ratios for both light and dark modes.
 * - **Single Source of Truth**: The `MD3ThemeProvider` wraps the application root in `app/_layout.tsx`.
 *   It persists the user's active theme mode (`'dark'` or `'light'`) in AsyncStorage and supplies
 *   the fully configured `AppTheme` to React Native Paper's `PaperProvider`.
 * - **Direct Component Consumption**:
 *   - Use `useAppTheme()` to access MD3 color tokens (`theme.colors.surface`, `theme.colors.primary`,
 *     `theme.colors.onSurface`, `theme.colors.surfaceContainer`, etc.) and Paper's typography & elevations.
 *   - Use `useThemeMode()` to read or change the current mode (`mode`, `setMode`, `toggleMode`).
 *   - Use `useColors()` as a backward-compatibility helper providing the flattened `Colors` palette.
 * - **Layout & Style Scale**: Fixed design tokens such as `spacing`, `typography`, `borderRadius`,
 *   and `gradient` are exported below as shared layout constants across all screens and components.
 */

// Re-export all MD3 theme runtime hooks, types, and providers from ./md3-theme
export {
  type AppTheme,
  type ColorMode,
  type Colors,
  MD3ThemeProvider,
  MD3ThemeProvider as ThemeProvider,
  useAppTheme,
  useColors,
  useThemeMode,
} from './md3-theme';

/**
 * Gradient configuration for primary brand accents
 * Direction: 135deg from primary to secondary
 */
export const gradient = {
  direction: '135deg',
  start: '#1A6BFF',
  end: '#4D9FFF',
  colors: ['#1A6BFF', '#4D9FFF'],
} as const;

/**
 * Spacing scale for consistent layout spacing throughout the app
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
 * Border radius scale for consistent rounded corners across cards, buttons, and inputs
 */
export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

/**
 * Static dark color reference palette based on the Sonic Architect design system.
 * For dynamic runtime colors, prefer `useAppTheme().colors`.
 */
export const darkColors = {
  primary: '#1A6BFF',
  secondary: '#4D9FFF',
  tertiary: '#2DE2FF',
  surface: '#0b0e14',
  surfaceContainer: '#161a21',
  surfaceContainerHigh: '#1c2028',
  surfaceContainerHighest: '#22262f',
  onSurface: '#ecedf6',
  onSurfaceVariant: '#a9abb3',
  outline: '#73757d',
  outlineVariant: '#45484f',
  error: '#ff716c',
  onAccent: '#FFFFFF',
} as const;

/**
 * Static light color reference palette.
 * For dynamic runtime colors, prefer `useAppTheme().colors`.
 */
export const lightColors = {
  primary: '#1A6BFF',
  secondary: '#2E86FF',
  tertiary: '#00A8CC',
  surface: '#F6F7FB',
  surfaceContainer: '#FFFFFF',
  surfaceContainerHigh: '#EDEFF5',
  surfaceContainerHighest: '#E2E5EE',
  onSurface: '#0E1320',
  onSurfaceVariant: '#5A6072',
  outline: '#8B90A0',
  outlineVariant: '#D8DBE4',
  error: '#D94343',
  onAccent: '#FFFFFF',
} as const;

export type Gradient = typeof gradient;
export type Spacing = typeof spacing;
export type Typography = typeof typography;
export type BorderRadius = typeof borderRadius;
