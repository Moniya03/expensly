import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Divider, Text, TouchableRipple } from 'react-native-paper';
import { getCategoryConfig } from '../../constants/categories';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
import type { Transaction } from '../../types';
import { formatRupees } from '../../utils/currency';
import { formatDate, getRelativeTime, parseLocalDate } from '../../utils/date';
import { sentenceCase } from '../../utils/string';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onSeeAll?: () => void;
  onPressTransaction?: (transaction: Transaction) => void;
}

export default function RecentTransactions({
  transactions,
  onSeeAll,
  onPressTransaction,
}: RecentTransactionsProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleDot} />
          <Text variant="titleMedium" style={styles.title}>
            Recent
          </Text>
        </View>
        {onSeeAll && (
          <Button
            mode="text"
            compact
            textColor={theme.colors.primary}
            onPress={onSeeAll}
            contentStyle={styles.seeAllButtonContent}
            labelStyle={styles.seeAllText}
          >
            See all →
          </Button>
        )}
      </View>

      {recentTransactions.length > 0 ? (
        <View style={styles.list}>
          {recentTransactions.map((transaction, index) => {
            const categoryConfig = getCategoryConfig(transaction.category);
            const pillBg = categoryConfig.iconBackgroundColor ?? 'rgba(29,196,150,0.12)';

            return (
              <React.Fragment key={transaction.id}>
                <TouchableRipple
                  style={styles.transactionItem}
                  onPress={() => onPressTransaction?.(transaction)}
                >
                  <View style={styles.transactionRow}>
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
                      <Text variant="bodyMedium" style={styles.description} numberOfLines={1}>
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
                          <Text
                            variant="labelSmall"
                            style={[styles.categoryPillText, { color: categoryConfig.color }]}
                          >
                            {categoryConfig.label}
                          </Text>
                        </View>
                        <Text variant="bodySmall" style={styles.timeAgo}>
                          {transaction.created_at
                            ? getRelativeTime(new Date(transaction.created_at))
                            : formatDate(parseLocalDate(transaction.transaction_date), 'short')}
                          {transaction.merchant ? ` • ${transaction.merchant}` : ''}
                        </Text>
                      </View>
                    </View>

                    <Text variant="titleMedium" style={styles.amount}>
                      -{formatRupees(transaction.amount)}
                    </Text>
                  </View>
                </TouchableRipple>
                {index < recentTransactions.length - 1 ? (
                  <Divider
                    style={{ marginLeft: 56, backgroundColor: theme.colors.outlineVariant }}
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text variant="bodyMedium" style={styles.emptyText}>
            No transactions yet
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
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
      backgroundColor: theme.colors.primary,
    },
    title: {
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.onSurface,
    },
    seeAllButtonContent: {
      marginHorizontal: 0,
      paddingHorizontal: 0,
    },
    seeAllText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semiBold,
    },
    list: {
      borderTopWidth: 0,
    },
    transactionItem: {
      borderRadius: borderRadius.md,
    },
    transactionRow: {
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
      borderColor: theme.colors.outlineVariant,
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
      fontWeight: typography.fontWeight.medium,
      color: theme.colors.onSurface,
    },
    timeAgo: {
      fontWeight: typography.fontWeight.regular,
      color: theme.colors.onSurfaceVariant,
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
      fontWeight: typography.fontWeight.semiBold,
      marginLeft: spacing.sm,
      color: '#F5A623',
    },
    emptyContainer: {
      paddingVertical: spacing.lg,
      alignItems: 'center',
    },
    emptyText: {
      fontWeight: typography.fontWeight.medium,
      color: theme.colors.onSurfaceVariant,
    },
  });
