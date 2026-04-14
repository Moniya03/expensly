import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { formatRupees } from '../../utils/currency';
import { formatDate, getRelativeTime, parseLocalDate } from '../../utils/date';
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
              <React.Fragment key={transaction.id}>
                <View style={styles.transactionItem}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: categoryConfig.iconBackgroundColor ?? `${categoryConfig.iconColor}18` },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={categoryConfig.iconName as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                      size={22}
                      color={categoryConfig.iconColor}
                    />
                  </View>

                  <View style={styles.details}>
                    <Text style={styles.description} numberOfLines={1}>
                      {transaction.description || categoryConfig.label}
                    </Text>
                    <Text style={styles.timeAgo}>
                      {transaction.created_at
                        ? getRelativeTime(new Date(transaction.created_at))
                        : formatDate(parseLocalDate(transaction.transaction_date), 'short')}
                    </Text>
                  </View>

                  <Text style={[styles.amount, { color: categoryColor }]}> 
                    -{formatRupees(transaction.amount)}
                  </Text>
                </View>
                <View style={styles.separator} />
              </React.Fragment>
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
    marginBottom: spacing.xs,
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
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
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
    marginLeft: 60,
  },
  emptyContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurfaceVariant,
  },
});
