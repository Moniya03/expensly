import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { formatRupees } from '../../utils/currency';

interface QuickStatsProps {
  today: number;
  week: number;
}

const statCards = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
] as const;

export default function QuickStats({ today, week }: QuickStatsProps) {
  const values = {
    today: formatRupees(today),
    week: formatRupees(week),
  };

  return (
    <View style={styles.container}>
      {statCards.map((card) => (
        <View key={card.key} style={styles.card}>
          <Text style={styles.label}>{card.label}</Text>
          <Text style={styles.value}>{values[card.key]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: 6,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurfaceVariant,
  },
  value: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
});
