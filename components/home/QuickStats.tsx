import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { formatRupees } from '../../utils/currency';

interface QuickStatsProps {
  todayPaise: number;
  weekPaise: number;
}

export default function QuickStats({ todayPaise, weekPaise }: QuickStatsProps) {
  return (
    <View style={styles.container}>
      {/* Today Card */}
      <View style={styles.card}>
        <Text style={styles.label}>Today</Text>
        <Text style={styles.amount}>{formatRupees(todayPaise)}</Text>
      </View>

      {/* This Week Card */}
      <View style={styles.card}>
        <Text style={styles.label}>This Week</Text>
        <Text style={styles.amount}>{formatRupees(weekPaise)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  amount: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
});
