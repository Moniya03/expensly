import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategoryColor, getCategoryConfig } from '../../constants/categories';
import { borderRadius, type Colors, spacing, typography, useColors } from '../../constants/theme';
import { getHistoricalBudgetForMonth, useBudgets } from '../../hooks/useBudget';
import { sentenceCase } from '../../utils/string';
import { useAllTransactions } from '../../hooks/useTransactions';
import { useAuthStore } from '../../stores/authStore';
import type { Transaction } from '../../types';
import { formatRupees } from '../../utils/currency';
import { parseLocalDate } from '../../utils/date';

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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        const transactionDate = parseLocalDate(transaction.transaction_date);
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
          (a, b) =>
            parseLocalDate(b.transaction_date).getTime() -
            parseLocalDate(a.transaction_date).getTime(),
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

  const selectedMonth =
    monthItems.find((item) => item.key === selectedKey) ?? monthItems[monthItems.length - 1];
  const maxValue = React.useMemo(
    () => Math.max(...monthItems.flatMap((item) => [item.spent, item.budget]), 1),
    [monthItems],
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
          <Text style={styles.subtitle}>Monthly spending across recent months</Text>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Spent</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.onSurfaceVariant }]} />
              <Text style={styles.legendText}>Budget</Text>
            </View>
          </View>

          <View style={styles.barChart}>
            {monthItems.map((item) => {
              const selected = item.key === selectedMonth?.key;
              const spentHeight = Math.max((item.spent / maxValue) * 140, item.spent > 0 ? 10 : 4);

              const budgetHeight = Math.max(
                (item.budget / maxValue) * 140,
                item.budget > 0 ? 10 : 4,
              );

              return (
                <Pressable
                  key={item.key}
                  onPress={() => setSelectedKey(item.key)}
                  style={[styles.monthColumn, selected && styles.monthColumnSelected]}
                >
                  <View style={styles.barGroup}>
                    <View style={[styles.bar, styles.budgetBar, { height: budgetHeight }]} />
                    <View style={[styles.bar, styles.spentBar, { height: spentHeight }]} />
                  </View>
                  <Text style={[styles.monthLabel, selected && styles.monthLabelSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {selectedMonth ? (
          <View style={styles.monthSection}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                {new Date(selectedMonth.year, selectedMonth.month - 1, 1).toLocaleDateString(
                  'en-IN',
                  {
                    month: 'long',
                    year: 'numeric',
                  },
                )}
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
                  {selectedMonth.transactions.map((transaction, index) => {
                    const categoryConfig = getCategoryConfig(transaction.category);
                    const categoryColor = getCategoryColor(transaction.category);

                    return (
                      <React.Fragment key={transaction.id}>
                        <View style={styles.transactionItem}>
                          <View
                            style={[
                              styles.transactionIcon,
                              {
                                backgroundColor:
                                  categoryConfig.iconBackgroundColor ??
                                  `${categoryConfig.iconColor}18`,
                              },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={
                                categoryConfig.iconName as React.ComponentProps<
                                  typeof MaterialCommunityIcons
                                >['name']
                              }
                              size={20}
                              color={categoryConfig.iconColor}
                            />
                          </View>

                          <View style={styles.transactionDetails}>
                            <Text style={styles.transactionDescription} numberOfLines={1}>
                              {sentenceCase(transaction.description || categoryConfig.label)}
                            </Text>
                            <Text style={styles.transactionMeta}>
                              {parseLocalDate(transaction.transaction_date).toLocaleDateString(
                                'en-IN',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                },
                              )}
                              {transaction.merchant ? ` • ${transaction.merchant}` : ''}
                            </Text>
                          </View>

                          <Text style={[styles.transactionAmount, { color: categoryColor }]}>
                            {formatRupees(transaction.amount)}
                          </Text>
                        </View>
                        {index < selectedMonth.transactions.length - 1 ? (
                          <View style={styles.transactionSeparator} />
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No transactions for this month</Text>
                </View>
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
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
      paddingBottom: 156,
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
      backgroundColor: colors.onSurfaceVariant,
      opacity: 0.3,
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
      backgroundColor: 'transparent',
      padding: spacing.md,
      gap: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.outlineVariant,
    },
    monthSection: {
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
      paddingVertical: spacing.xs,
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
      fontSize: 10,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    transactionList: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.outlineVariant,
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    transactionSeparator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.outlineVariant,
      marginLeft: 58,
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
      paddingVertical: spacing.lg,
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.outlineVariant,
    },
    emptyText: {
      fontSize: typography.fontSize.md,
      color: colors.onSurfaceVariant,
    },
  });
