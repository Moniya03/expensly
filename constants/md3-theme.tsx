import { type Material3Scheme, useMaterial3Theme } from '@pchmn/expo-material3-theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  MD3DarkTheme,
  MD3LightTheme,
  type MD3Theme,
  PaperProvider,
  useTheme,
} from 'react-native-paper';

export type ColorMode = 'dark' | 'light';

export type Colors = {
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

export type AppTheme = MD3Theme & { colors: Material3Scheme };

const THEME_STORAGE_KEY = 'expensly:theme-mode';
const FALLBACK_SEED_COLOR = '#1A6BFF';

type MD3ThemeContextValue = {
  mode: ColorMode;
  colors: Colors;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
};

const defaultColors: Colors = {
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
};

const MD3ThemeContext = createContext<MD3ThemeContextValue>({
  mode: 'dark',
  colors: defaultColors,
  setMode: () => {},
  toggleMode: () => {},
});

export function MD3ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>('dark');

  const { theme } = useMaterial3Theme({ fallbackSourceColor: FALLBACK_SEED_COLOR });

  // Restore persisted preference on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!cancelled && (stored === 'light' || stored === 'dark')) {
          setModeState(stored);
        }
      } catch {
        // ignore storage errors, stay dark
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next: ColorMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next: ColorMode = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const paperTheme = useMemo<AppTheme>(() => {
    const baseTheme = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;
    const schemeColors = mode === 'dark' ? theme.dark : theme.light;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        ...schemeColors,
      },
    };
  }, [mode, theme]);

  const colors: Colors = useMemo(
    () => ({
      primary: paperTheme.colors.primary,
      secondary: paperTheme.colors.secondary,
      tertiary: paperTheme.colors.tertiary,
      surface: paperTheme.colors.surface,
      surfaceContainer: paperTheme.colors.surfaceContainer,
      surfaceContainerHigh: paperTheme.colors.surfaceContainerHigh,
      surfaceContainerHighest: paperTheme.colors.surfaceContainerHighest,
      onSurface: paperTheme.colors.onSurface,
      onSurfaceVariant: paperTheme.colors.onSurfaceVariant,
      outline: paperTheme.colors.outline,
      outlineVariant: paperTheme.colors.outlineVariant,
      error: paperTheme.colors.error,
      onAccent: '#FFFFFF',
    }),
    [paperTheme.colors],
  );

  const contextValue = useMemo(
    () => ({
      mode,
      colors,
      setMode,
      toggleMode,
    }),
    [mode, colors, setMode, toggleMode],
  );

  return (
    <MD3ThemeContext.Provider value={contextValue}>
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </MD3ThemeContext.Provider>
  );
}

export function useAppTheme(): AppTheme {
  return useTheme<AppTheme>();
}

export function useColors(): Colors {
  const context = useContext(MD3ThemeContext);
  const theme = useAppTheme();

  return useMemo(() => {
    if (context?.colors) {
      return context.colors;
    }
    return {
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      tertiary: theme.colors.tertiary,
      surface: theme.colors.surface,
      surfaceContainer: theme.colors.surfaceContainer,
      surfaceContainerHigh: theme.colors.surfaceContainerHigh,
      surfaceContainerHighest: theme.colors.surfaceContainerHighest,
      onSurface: theme.colors.onSurface,
      onSurfaceVariant: theme.colors.onSurfaceVariant,
      outline: theme.colors.outline,
      outlineVariant: theme.colors.outlineVariant,
      error: theme.colors.error,
      onAccent: '#FFFFFF',
    };
  }, [context?.colors, theme.colors]);
}

export function useThemeMode() {
  return useContext(MD3ThemeContext);
}
