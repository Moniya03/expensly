import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

/**
 * Expensly Theme Constants
 * Design System: Sonic Architect
 * Primary Font: Plus Jakarta Sans
 */

/**
 * Dark color palette (default) based on Sonic Architect design system
 */
const darkColors = {
  // Primary colors
  primary: '#1A6BFF',
  secondary: '#4D9FFF',
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

  // Text/icons on top of a colored surface (primary buttons, blue gradient
  // hero, dark tint cards, error buttons). Always white in BOTH modes.
  onAccent: '#FFFFFF',
} as const;

/**
 * Light color palette
 */
const lightColors = {
  // Primary colors
  primary: '#1A6BFF',
  secondary: '#2E86FF',
  tertiary: '#00A8CC',

  // Surface colors (backgrounds)
  surface: '#F6F7FB',
  surfaceContainer: '#FFFFFF',
  surfaceContainerHigh: '#EDEFF5',
  surfaceContainerHighest: '#E2E5EE',

  // Text colors
  onSurface: '#0E1320',
  onSurfaceVariant: '#5A6072',

  // Border and divider colors
  outline: '#8B90A0',
  outlineVariant: '#D8DBE4',

  // Status colors
  error: '#D94343',

  // Text/icons on top of a colored surface (primary buttons, blue gradient
  // hero, dark tint cards, error buttons). Always white in BOTH modes.
  onAccent: '#FFFFFF',
} as const;

export type ColorMode = 'dark' | 'light';

type Palette = {
  primary: string;
  secondary: string;
  tertiary: string;
  surface: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  error: string;
  onAccent: string;
};

export type Colors = Palette;

const palettes: Record<ColorMode, Palette> = {
  dark: darkColors,
  light: lightColors,
};

/**
 * Gradient configuration for primary gradient effect
 * Direction: 135deg from primary to secondary
 */
export const gradient = {
  direction: '135deg',
  start: '#1A6BFF',
  end: '#4D9FFF',
  colors: ['#1A6BFF', '#4D9FFF'],
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

export type Gradient = typeof gradient;
export type Spacing = typeof spacing;
export type Typography = typeof typography;
export type BorderRadius = typeof borderRadius;

/* ------------------------------------------------------------------ */
/* Theme state + provider                                               */
/* ------------------------------------------------------------------ */

const THEME_STORAGE_KEY = 'expensly:theme-mode';

type ThemeContextValue = {
  mode: ColorMode;
  colors: Colors;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue>({
  mode: 'dark',
  colors: darkColors,
  setMode: () => {},
  toggleMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<ColorMode>('dark');
  const [hydrated, setHydrated] = React.useState(false);

  // Restore persisted preference on mount.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!cancelled && (stored === 'light' || stored === 'dark')) {
          setModeState(stored);
        }
      } catch {
        // ignore storage errors, stay dark
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = React.useCallback((next: ColorMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
  }, []);

  const toggleMode = React.useCallback(() => {
    setModeState((prev) => {
      const next: ColorMode = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  // Block render until the persisted preference is read to avoid a flash.
  if (!hydrated) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        colors: palettes[mode],
        setMode,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Access the active color palette inside a component.
 * Re-renders automatically when the theme mode changes.
 */
export function useColors(): Colors {
  return React.useContext(ThemeContext).colors;
}

/**
 * Access the theme mode + controls inside a component.
 */
export function useThemeMode() {
  return React.useContext(ThemeContext);
}
