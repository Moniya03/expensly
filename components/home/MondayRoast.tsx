import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';

interface MondayRoastProps {
  roastText: string;
  isVisible: boolean;
}

export default function MondayRoast({ roastText, isVisible }: MondayRoastProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>🤖</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.eyebrow}>SPENDING INSIGHT</Text>
        <Text style={styles.roastText}>{roastText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(168, 85, 247, 0.10)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.30)',
    padding: spacing.md,
    gap: spacing.md,
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#C084FC',
    letterSpacing: 1,
  },
  roastText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurface,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
});
