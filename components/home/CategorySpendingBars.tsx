import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCategoryConfig, getCategoryColor } from '../../constants/categories';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { Category } from '../../types';
import { formatRupees } from '../../utils/currency';

interface CategorySpendingBarsProps {
  byCategory: Record<string, number>;
}

export default function CategorySpendingBars({ byCategory }: CategorySpendingBarsProps) {
  const items = useMemo(() => {
    const entries = Object.entries(byCategory)
      .filter(([, amount]) => amount > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);

    const total = entries.reduce((sum, [, amount]) => sum + amount, 0);

    return entries.map(([category, amount]) => ({
      category: category as Category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }));
  }, [byCategory]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Where it's going</Text>

      {items.length > 0 ? (
        <View style={styles.list}>
          {items.map((item) => {
            const config = getCategoryConfig(item.category);
            const color = getCategoryColor(item.category);

            return (
              <View key={item.category} style={styles.item}>
                <View style={styles.row}>
                  <View style={styles.labelGroup}>
                    <View
                      style={[
                        styles.iconBubble,
                        { backgroundColor: config.iconBackgroundColor ?? `${config.iconColor}18` },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={config.iconName as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                        size={14}
                        color={config.iconColor}
                      />
                    </View>
                    <Text style={styles.label}>{config.label}</Text>
                  </View>

                  <View style={styles.amountGroup}>
                    <Text style={styles.amount}>{formatRupees(item.amount)}</Text>
                    <Text style={styles.percentage}>{Math.round(item.percentage)}%</Text>
                  </View>
                </View>

                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${item.percentage}%`, backgroundColor: color }]} />
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No category spend yet this month.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
  list: {
    gap: spacing.md,
  },
  item: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBubble: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.onSurface,
  },
  amountGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  amount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
  percentage: {
    fontSize: typography.fontSize.xs,
    color: colors.onSurfaceVariant,
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  emptyState: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceVariant,
  },
});
