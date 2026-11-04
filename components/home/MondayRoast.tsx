import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';

interface MondayRoastProps {
  roastText: string;
  isVisible: boolean;
}

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

export default function MondayRoast({ roastText, isVisible }: MondayRoastProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrap}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🤖</Text>
        </View>
      </View>

      <View style={styles.bubbleWrap}>
        <View style={styles.bubbleTail} />
        <Surface elevation={1} style={styles.bubble}>
          <Text variant="labelSmall" style={styles.eyebrow}>
            AI ROAST
          </Text>
          <Text variant="bodyMedium" style={styles.roastText}>
            {roastText}
          </Text>
        </Surface>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: spacing.sm,
      gap: spacing.md,
    },
    avatarWrap: {
      paddingTop: spacing.xs,
    },
    badge: {
      width: 42,
      height: 42,
      borderRadius: borderRadius.full,
      backgroundColor: hexToRgba(theme.colors.primary, 0.14),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.primary, 0.22),
    },
    badgeText: {
      fontSize: 22,
    },
    bubbleWrap: {
      flex: 1,
      position: 'relative',
      paddingLeft: 2,
    },
    bubbleTail: {
      position: 'absolute',
      left: -6,
      top: 18,
      width: 12,
      height: 12,
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderLeftWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.outlineVariant,
      transform: [{ rotate: '45deg' }],
      zIndex: 2,
    },
    bubble: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: borderRadius.xl,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    eyebrow: {
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.primary,
      letterSpacing: 1,
    },
    roastText: {
      fontWeight: typography.fontWeight.medium,
      color: theme.colors.onSurface,
      lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
    },
  });
