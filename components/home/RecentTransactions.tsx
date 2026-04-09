import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { formatRupees } from '../../utils/currency';
import { getRelativeTime } from '../../utils/date';
import { getCategoryConfig, getCategoryColor } from '../../constants/categories';
import { Transaction } from '../../types';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onSeeAll?: () => void;
}

export default function RecentTransactions({ transactions, onSeeAll }: RecentTransactionsProps) {
  const recentTransactions = transactions.slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentTransactions.length > 0 ? (
        <View style={styles.list}>
          {recentTransactions.map((transaction) => {
            const categoryConfig = getCategoryConfig(transaction.category);
            const categoryColor = getCategoryColor(transaction.category);
            
            return (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}22` }]}>
                  <Text style={styles.categoryEmoji}>{categoryConfig.emoji}</Text>
                </View>

                <View style={styles.details}>
                  <Text style={styles.description} numberOfLines={1}>
                    {transaction.description || categoryConfig.label}
                  </Text>
                  <Text style={styles.timeAgo}>
                    {getRelativeTime(new Date(transaction.transaction_date))}
                  </Text>
                </View>

                <Text style={[styles.amount, { color: categoryColor }]}>
                  -{formatRupees(transaction.amount)}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
  seeAllText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary,
  },
  list: {
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
  iconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderRadius: borderRadius.full,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  details: {
    flex: 1,
  },
  description: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurface,
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    color: colors.onSurfaceVariant,
  },
  amount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurfaceVariant,
  },
});
