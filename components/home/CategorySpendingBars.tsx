import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProgressBar, Surface, Text } from 'react-native-paper';
import { getCategoryColor, getCategoryConfig } from '../../constants/categories';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
import type { Category } from '../../types';
import { formatRupees } from '../../utils/currency';

interface CategorySpendingBarsProps {
  byCategory: Record<string, number>;
}

export default function CategorySpendingBars({ byCategory }: CategorySpendingBarsProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
      <Text variant="titleMedium" style={styles.title}>
        Where it&apos;s going
      </Text>

      {items.length > 0 ? (
        <Surface elevation={1} style={styles.card}>
          <View style={styles.list}>
            {items.map((item) => {
              const config = getCategoryConfig(item.category);
              const color = getCategoryColor(item.category);
              const progressFraction = Math.min(Math.max(item.percentage / 100, 0), 1);

              return (
                <View key={item.category} style={styles.item}>
                  <View style={styles.row}>
                    <View style={styles.labelGroup}>
                      <View
                        style={[
                          styles.iconBubble,
                          {
                            backgroundColor: config.iconBackgroundColor ?? `${config.iconColor}18`,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={
                            config.iconName as React.ComponentProps<
                              typeof MaterialCommunityIcons
                            >['name']
                          }
                          size={14}
                          color={config.iconColor}
                        />
                      </View>
                      <Text variant="bodyMedium" style={styles.label}>
                        {config.label}
                      </Text>
                    </View>

                    <View style={styles.amountGroup}>
                      <Text variant="titleSmall" style={styles.amount}>
                        {formatRupees(item.amount)}
                      </Text>
                      <Text variant="labelSmall" style={styles.percentage}>
                        {Math.round(item.percentage)}%
                      </Text>
                    </View>
                  </View>

                  <ProgressBar
                    progress={progressFraction}
                    color={color}
                    style={styles.progressBar}
                  />
                </View>
              );
            })}
          </View>
        </Surface>
      ) : (
        <Surface style={styles.emptyState} elevation={0}>
          <Text variant="bodyMedium" style={styles.emptyText}>
            No category spend yet this month.
          </Text>
        </Surface>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      gap: spacing.md,
    },
    title: {
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.onSurface,
    },
    card: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: spacing.md,
    },
    list: {
      gap: spacing.md,
    },
    item: {
      gap: spacing.xs,
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
      width: 26,
      height: 26,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontWeight: typography.fontWeight.semiBold,
      color: theme.colors.onSurface,
    },
    amountGroup: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    amount: {
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.onSurface,
    },
    percentage: {
      color: theme.colors.onSurfaceVariant,
    },
    progressBar: {
      height: 6,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surfaceContainerHighest,
    },
    emptyState: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: spacing.md,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });
