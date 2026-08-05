import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCategoryConfig } from '../../constants/categories';
import { borderRadius, type Colors, spacing, typography, useColors } from '../../constants/theme';
import type { Transaction } from '../../types';
import { formatRupees } from '../../utils/currency';
import { formatDate, getRelativeTime, parseLocalDate } from '../../utils/date';
import { sentenceCase } from '../../utils/string';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onSeeAll?: () => void;
}

export default function RecentTransactions({ transactions, onSeeAll }: RecentTransactionsProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
                      {
                        backgroundColor:
                          categoryConfig.iconBackgroundColor ?? `${categoryConfig.iconColor}18`,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        categoryConfig.iconName as React.ComponentProps<
                          typeof MaterialCommunityIcons
                        >['name']
                      }
                      size={22}
                      color={categoryConfig.iconColor}
                    />
                  </View>

                  <View style={styles.details}>
                    <Text style={styles.description} numberOfLines={1}>
                      {sentenceCase(transaction.description || categoryConfig.label)}
                    </Text>
                    <View style={styles.metaRow}>
                      <View
                        style={[
                          styles.categoryPill,
                          {
                            backgroundColor: pillBg,
                            borderColor: `${categoryConfig.color}33`,
                          },
                        ]}
                      >
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

                  <Text style={styles.amount}>-{formatRupees(transaction.amount)}</Text>
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

const createStyles = (colors: Colors) =>
  StyleSheet.create({
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
      backgroundColor: colors.primary,
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
      color: colors.onSurface,
    },
    timeAgo: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.regular,
      color: colors.onSurfaceVariant,
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
      backgroundColor: colors.outlineVariant,
      marginLeft: 56,
    },
    emptyContainer: {
      paddingVertical: spacing.lg,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.medium,
      color: colors.onSurfaceVariant,
    },
  });
