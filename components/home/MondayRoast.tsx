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
      {/* Robot Emoji */}
      <Text style={styles.robotEmoji}>🤖</Text>

      {/* Chat Bubble */}
      <View style={styles.bubble}>
        <Text style={styles.roastText}>{roastText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  robotEmoji: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  bubble: {
    flex: 1,
    backgroundColor: `${colors.primary}15`,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    padding: spacing.md,
  },
  roastText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    color: colors.onSurface,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.md,
  },
});
