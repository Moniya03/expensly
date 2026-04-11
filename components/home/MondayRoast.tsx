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
      <View style={styles.avatarWrap}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🤖</Text>
        </View>
      </View>

      <View style={styles.bubbleWrap}>
        <View style={styles.bubbleTail} />
        <View style={styles.bubble}>
          <Text style={styles.eyebrow}>AI ROAST</Text>
          <Text style={styles.roastText}>{roastText}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(26, 107, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 107, 255, 0.22)',
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
    backgroundColor: colors.surfaceContainerHigh,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.outlineVariant,
    transform: [{ rotate: '45deg' }],
  },
  bubble: {
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#8B9CC7',
    letterSpacing: 1,
  },
  roastText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurface,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
});
