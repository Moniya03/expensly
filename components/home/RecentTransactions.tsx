import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../constants/theme';
import { formatRupees } from '../../utils/currency';
import { formatDate, getRelativeTime, parseLocalDate } from '../../utils/date';
import { getCategoryConfig } from '../../constants/categories';
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
        <View style={styles.titleRow}>
          <View style={styles.titleDot} />
          <Text style={styles.title}>Recent</Text>
        </View>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See all →</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentTransactions.length > 0 ? (
        <View style={styles.list}>
          {recentTransactions.map((transaction, index) => {
            const categoryConfig = getCategoryConfig(transaction.category);
            const pillBg = categoryConfig.iconBackgroundColor ?? 'rgba(29,196,150,0.12)';

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
                    <View style={styles.metaRow}>
                      <View style={[styles.categoryPill, { backgroundColor: pillBg, borderColor: `${categoryConfig.color}33` }]}>
                        <Text style={[styles.categoryPillText, { color: categoryConfig.color }]}>
                          {categoryConfig.label}
                        </Text>
                      </View>
                      <Text style={styles.timeAgo}>
                        {transaction.created_at
                          ? getRelativeTime(new Date(transaction.created_at))
                          : formatDate(parseLocalDate(transaction.transaction_date), 'short')}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.amount}>
                    -{formatRupees(transaction.amount)}
                  </Text>
                </View>
                {index < recentTransactions.length - 1 ? <View style={styles.separator} /> : null}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#1DC496',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: '#1DC496',
  },
  list: {
    borderTopWidth: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginRight: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  details: {
    flex: 1,
    gap: 6,
  },
  description: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: '#FFFFFF',
  },
  timeAgo: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    color: 'rgba(173,186,214,0.7)',
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.sm,
    color: '#F5A623',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(29,196,150,0.07)',
    marginLeft: 56,
  },
  emptyContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: 'rgba(173,186,214,0.7)',
  },
});
