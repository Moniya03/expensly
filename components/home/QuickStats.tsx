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
      {statCards.map((card, index) => (
        <React.Fragment key={card.key}>
          <View style={styles.stat}>
            <Text style={styles.label}>{card.label}</Text>
            <Text style={styles.value}>{values[card.key]}</Text>
          </View>
          {index < statCards.length - 1 ? <View style={styles.divider} /> : null}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: spacing.xs,
  },
  stat: {
    flex: 1,
    gap: 4,
    paddingVertical: spacing.xs,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
});
