import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { type AppTheme, spacing, typography, useAppTheme } from '../../constants/theme';

function hexToRgba(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const raw = color.slice(1);
    if (raw.length === 6) {
      const r = Number.parseInt(raw.slice(0, 2), 16);
      const g = Number.parseInt(raw.slice(2, 4), 16);
      const b = Number.parseInt(raw.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return color;
}

export default function EmptyState() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {/* Ripple Rings */}
      <View style={styles.rippleContainer}>
        <View style={[styles.ring, styles.ringOuter]} />
        <View style={[styles.ring, styles.ringMiddle]} />
        <View style={[styles.ring, styles.ringInner]} />

        {/* Mic Icon Core */}
        <View style={styles.iconCore}>
          <Ionicons name="mic" size={48} color={theme.colors.primary} />
        </View>
      </View>

      {/* Text Content */}
      <Text variant="headlineSmall" style={styles.title}>
        No expenses yet
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Tap the mic to add your first expense
      </Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    rippleContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    ring: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
    },
    ringOuter: {
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: hexToRgba(theme.colors.primary, 0.05),
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.primary, 0.1),
    },
    ringMiddle: {
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: hexToRgba(theme.colors.primary, 0.1),
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.primary, 0.2),
    },
    ringInner: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: hexToRgba(theme.colors.primary, 0.2),
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.primary, 0.3),
    },
    iconCore: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.colors.surfaceContainerHigh,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.outlineVariant,
    },
    title: {
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.onSurface,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontWeight: typography.fontWeight.regular,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
    },
  });
