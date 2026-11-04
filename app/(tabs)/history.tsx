import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Divider, Surface, Text, TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionEditCard } from '../../components/transactions/TransactionEditCard';
import { getCategoryColor, getCategoryConfig } from '../../constants/categories';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
import { getHistoricalBudgetForMonth, useBudgets } from '../../hooks/useBudget';
import { useAllTransactions } from '../../hooks/useTransactions';
import { useAuthStore } from '../../stores/authStore';
import type { Transaction } from '../../types';
import { formatRupees } from '../../utils/currency';
import { parseLocalDate } from '../../utils/date';
import { sentenceCase } from '../../utils/string';

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
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { profile } = useAuthStore();
  const { data: transactions = [], isLoading: transactionsLoading } = useAllTransactions();
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets();

  const monthItems = useMemo<MonthItem[]>(() => {
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

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!selectedKey && monthItems.length > 0) {
      setSelectedKey(monthItems[monthItems.length - 1].key);
    }
  }, [monthItems, selectedKey]);

  const selectedMonth =
    monthItems.find((item) => item.key === selectedKey) ?? monthItems[monthItems.length - 1];
  const maxValue = useMemo(
    () => Math.max(...monthItems.flatMap((item) => [item.spent, item.budget]), 1),
    [monthItems],
  );

  if (transactionsLoading || budgetsLoading) {
    return (
      <Surface style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </SafeAreaView>
      </Surface>
    );
  }

  const delta = (selectedMonth?.budget ?? 0) - (selectedMonth?.spent ?? 0);

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              History
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Monthly spending across recent months
            </Text>
          </View>

          <Surface elevation={1} style={styles.chartCard}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
                <Text variant="labelSmall" style={styles.legendText}>
                  Spent
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: theme.colors.onSurfaceVariant }]}
                />
                <Text variant="labelSmall" style={styles.legendText}>
                  Budget
                </Text>
              </View>
            </View>

            <View style={styles.barChart}>
              {monthItems.map((item) => {
                const selected = item.key === selectedMonth?.key;
                const spentHeight = Math.max(
                  (item.spent / maxValue) * 140,
                  item.spent > 0 ? 10 : 4,
                );

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
                    <Text
                      variant="labelSmall"
                      style={[styles.monthLabel, selected && styles.monthLabelSelected]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Surface>

          {selectedMonth ? (
            <View style={styles.monthSection}>
              <Surface elevation={0} style={styles.summaryCard}>
                <Text variant="titleMedium" style={styles.summaryTitle}>
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
                    <Text variant="labelSmall" style={styles.summaryLabel}>
                      Spent
                    </Text>
                    <Text variant="titleMedium" style={styles.summaryValue}>
                      {formatRupees(selectedMonth.spent)}
                    </Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text variant="labelSmall" style={styles.summaryLabel}>
                      Budget
                    </Text>
                    <Text variant="titleMedium" style={styles.summaryValue}>
                      {formatRupees(selectedMonth.budget)}
                    </Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text variant="labelSmall" style={styles.summaryLabel}>
                      {delta >= 0 ? 'Left' : 'Over'}
                    </Text>
                    <Text
                      variant="titleMedium"
                      style={[styles.summaryValue, delta < 0 && styles.overValue]}
                    >
                      {formatRupees(Math.abs(delta))}
                    </Text>
                  </View>
                </View>
              </Surface>

              <View style={styles.transactionsSection}>
                <Text variant="labelSmall" style={styles.transactionsTitle}>
                  Transactions
                </Text>

                {selectedMonth.transactions.length > 0 ? (
                  <View style={styles.transactionList}>
                    {selectedMonth.transactions.map((transaction, index) => {
                      const categoryConfig = getCategoryConfig(transaction.category);
                      const categoryColor = getCategoryColor(transaction.category);

                      return (
                        <React.Fragment key={transaction.id}>
                          <TouchableRipple
                            style={styles.transactionItem}
                            onPress={() => setEditingTransaction(transaction)}
                          >
                            <View style={styles.transactionRow}>
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
                                <Text
                                  variant="bodyMedium"
                                  style={styles.transactionDescription}
                                  numberOfLines={1}
                                >
                                  {sentenceCase(transaction.description || categoryConfig.label)}
                                </Text>
                                <Text variant="bodySmall" style={styles.transactionMeta}>
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

                              <Text
                                variant="titleMedium"
                                style={[styles.transactionAmount, { color: categoryColor }]}
                              >
                                {formatRupees(transaction.amount)}
                              </Text>
                            </View>
                          </TouchableRipple>
                          {index < selectedMonth.transactions.length - 1 ? (
                            <Divider style={styles.transactionSeparator} />
                          ) : null}
                        </React.Fragment>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyCard}>
                    <Text variant="bodyMedium" style={styles.emptyText}>
                      No transactions for this month
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : null}
        </ScrollView>

        <TransactionEditCard
          visible={editingTransaction !== null}
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      </SafeAreaView>
    </Surface>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
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
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.onSurface,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
    },
    chartCard: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
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
      color: theme.colors.onSurfaceVariant,
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
      backgroundColor: theme.colors.surfaceContainerHighest,
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
      backgroundColor: theme.colors.primary,
    },
    budgetBar: {
      backgroundColor: theme.colors.onSurfaceVariant,
      opacity: 0.3,
    },
    monthLabel: {
      marginTop: spacing.sm,
      color: theme.colors.onSurfaceVariant,
    },
    monthLabelSelected: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.semiBold,
    },
    summaryCard: {
      backgroundColor: 'transparent',
      padding: spacing.md,
      gap: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outlineVariant,
    },
    monthSection: {
      gap: spacing.md,
    },
    summaryTitle: {
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.onSurface,
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
      color: theme.colors.onSurfaceVariant,
    },
    summaryValue: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
    },
    overValue: {
      color: theme.colors.error,
    },
    transactionsSection: {
      gap: spacing.md,
    },
    transactionsTitle: {
      fontWeight: typography.fontWeight.semiBold,
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    transactionList: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.outlineVariant,
    },
    transactionItem: {
      borderRadius: borderRadius.sm,
    },
    transactionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    transactionSeparator: {
      marginLeft: 58,
      backgroundColor: theme.colors.outlineVariant,
    },
    transactionIcon: {
      width: 42,
      height: 42,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    transactionDetails: {
      flex: 1,
    },
    transactionDescription: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.medium,
    },
    transactionMeta: {
      marginTop: 2,
      color: theme.colors.onSurfaceVariant,
    },
    transactionAmount: {
      fontWeight: typography.fontWeight.bold,
      marginLeft: spacing.sm,
    },
    emptyCard: {
      paddingVertical: spacing.lg,
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.outlineVariant,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
    },
  });
