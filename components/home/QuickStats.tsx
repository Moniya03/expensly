import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { formatRupees } from '../../utils/currency';
import { SoftDivider } from '../ui/SoftDivider';

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
      <View style={styles.frame}>
        {statCards.map((card, index) => (
          <React.Fragment key={card.key}>
            <View style={styles.stat}>
              <Text style={styles.label}>{card.label}</Text>
              <Text style={styles.value}>{values[card.key]}</Text>
            </View>
            {index < statCards.length - 1 ? <SoftDivider vertical style={styles.divider} /> : null}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: colors.primary,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  frame: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stat: {
    flex: 1,
    gap: 6,
    paddingVertical: spacing.xs,
  },
  divider: {
    width: 1,
    marginHorizontal: spacing.sm,
    opacity: 0.7,
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
