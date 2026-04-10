import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useAllTransactions } from '../../hooks/useTransactions';
import { getHistoricalBudgetForMonth, useBudgets } from '../../hooks/useBudget';
import { Transaction } from '../../types';
import { formatRupees } from '../../utils/currency';
import { getCategoryColor, getCategoryConfig } from '../../constants/categories';

type MonthItem = {
  key: string;
  label: string;
  month: number;
  year: number;
  spent: number;
  budget: number;
  transactions: Transaction[];
};

export default function HistoryScreen() {
  const { profile } = useAuthStore();
  const { data: transactions = [], isLoading: transactionsLoading } = useAllTransactions();
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets();

  const monthItems = React.useMemo<MonthItem[]>(() => {
    const now = new Date();
    const fallbackBudget = profile?.monthly_budget ?? 0;

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthTransactions = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.transaction_date);
        return transactionDate.getMonth() + 1 === month && transactionDate.getFullYear() === year;
      });
      const spent = monthTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      const budget = getHistoricalBudgetForMonth({
        budgets,
        fallbackBudget,
        month,
        year,
      });

      return {
        key: `${year}-${month}`,
        label: date.toLocaleDateString('en-IN', { month: 'short' }),
        month,
        year,
        spent,
        budget,
        transactions: monthTransactions.sort(
          (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
        ),
      };
    });
  }, [budgets, profile?.monthly_budget, transactions]);

  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedKey && monthItems.length > 0) {
      setSelectedKey(monthItems[monthItems.length - 1].key);
    }
  }, [monthItems, selectedKey]);

  const selectedMonth = monthItems.find((item) => item.key === selectedKey) ?? monthItems[monthItems.length - 1];
  const maxValue = React.useMemo(
    () => Math.max(...monthItems.flatMap((item) => [item.spent, item.budget]), 1),
    [monthItems]
  );

  if (transactionsLoading || budgetsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const delta = (selectedMonth?.budget ?? 0) - (selectedMonth?.spent ?? 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Spent vs budget across recent months</Text>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Spent</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
              <Text style={styles.legendText}>Budget</Text>
            </View>
          </View>

          <View style={styles.barChart}>
            {monthItems.map((item) => {
              const selected = item.key === selectedMonth?.key;
              const spentHeight = Math.max((item.spent / maxValue) * 140, item.spent > 0 ? 10 : 4);
              const budgetHeight = Math.max((item.budget / maxValue) * 140, item.budget > 0 ? 10 : 4);

              return (
                <Pressable
                  key={item.key}
                  onPress={() => setSelectedKey(item.key)}
                  style={[styles.monthColumn, selected && styles.monthColumnSelected]}
                >
                  <View style={styles.barGroup}>
                    <View style={[styles.bar, styles.spentBar, { height: spentHeight }]} />
                    <View style={[styles.bar, styles.budgetBar, { height: budgetHeight }]} />
                  </View>
                  <Text style={[styles.monthLabel, selected && styles.monthLabelSelected]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {selectedMonth ? (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                {new Date(selectedMonth.year, selectedMonth.month - 1, 1).toLocaleDateString('en-IN', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryLabel}>Spent</Text>
                  <Text style={styles.summaryValue}>{formatRupees(selectedMonth.spent)}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryLabel}>Budget</Text>
                  <Text style={styles.summaryValue}>{formatRupees(selectedMonth.budget)}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryLabel}>{delta >= 0 ? 'Left' : 'Over'}</Text>
                  <Text style={[styles.summaryValue, delta < 0 && styles.overValue]}>
                    {formatRupees(Math.abs(delta))}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.transactionsSection}>
              <Text style={styles.transactionsTitle}>Transactions</Text>

              {selectedMonth.transactions.length > 0 ? (
                <View style={styles.transactionList}>
                  {selectedMonth.transactions.map((transaction) => {
                    const categoryConfig = getCategoryConfig(transaction.category);
                    const categoryColor = getCategoryColor(transaction.category);

                    return (
                      <View key={transaction.id} style={styles.transactionItem}>
                        <View style={[styles.transactionIcon, { backgroundColor: `${categoryColor}22` }]}>
                          <Text style={styles.transactionEmoji}>{categoryConfig.emoji}</Text>
                        </View>

                        <View style={styles.transactionDetails}>
                          <Text style={styles.transactionDescription} numberOfLines={1}>
                            {transaction.description || categoryConfig.label}
                          </Text>
                          <Text style={styles.transactionMeta}>
                            {new Date(transaction.transaction_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                            {transaction.merchant ? ` • ${transaction.merchant}` : ''}
                          </Text>
                        </View>

                        <Text style={[styles.transactionAmount, { color: categoryColor }]}>
                          {formatRupees(transaction.amount)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No transactions for this month</Text>
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.onSurfaceVariant,
  },
  chartCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    gap: spacing.md,
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
  },
  legendText: {
    color: colors.onSurfaceVariant,
    fontSize: typography.fontSize.xs,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 180,
  },
  monthColumn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
  },
  monthColumnSelected: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  barGroup: {
    height: 148,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 5,
  },
  bar: {
    width: 12,
    borderRadius: borderRadius.sm,
  },
  spentBar: {
    backgroundColor: colors.primary,
  },
  budgetBar: {
    backgroundColor: colors.secondary,
  },
  monthLabel: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.onSurfaceVariant,
  },
  monthLabelSelected: {
    color: colors.onSurface,
    fontWeight: typography.fontWeight.semiBold,
  },
  summaryCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    gap: spacing.md,
  },
  summaryTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryStat: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    gap: 4,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.onSurfaceVariant,
  },
  summaryValue: {
    fontSize: typography.fontSize.md,
    color: colors.onSurface,
    fontWeight: typography.fontWeight.bold,
  },
  overValue: {
    color: colors.error,
  },
  transactionsSection: {
    gap: spacing.md,
  },
  transactionsTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
  transactionList: {
    gap: spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  transactionEmoji: {
    fontSize: 18,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: typography.fontSize.md,
    color: colors.onSurface,
    fontWeight: typography.fontWeight.medium,
  },
  transactionMeta: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: colors.onSurfaceVariant,
  },
  transactionAmount: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.onSurfaceVariant,
  },
});
