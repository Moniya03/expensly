import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Divider, Surface, Text, TouchableRipple } from 'react-native-paper';
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
        <Surface elevation={1} style={styles.card}>
          <View style={styles.list}>
            {recentTransactions.map((transaction, index) => {
              const categoryConfig = getCategoryConfig(transaction.category);
              const pillBg = categoryConfig.iconBackgroundColor ?? `${categoryConfig.iconColor}18`;

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
                            backgroundColor: pillBg,
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
                      style={{ marginLeft: 64, backgroundColor: theme.colors.outlineVariant }}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </View>
        </Surface>
      ) : (
        <Surface elevation={0} style={styles.emptyContainer}>
          <Text variant="bodyMedium" style={styles.emptyText}>
            No transactions yet
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
    card: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      overflow: 'hidden',
    },
    list: {
      borderTopWidth: 0,
    },
    transactionItem: {
      paddingHorizontal: spacing.md,
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
      marginRight: spacing.md,
    },
    details: {
      flex: 1,
      gap: 2,
    },
    description: {
      fontWeight: typography.fontWeight.semiBold,
      color: theme.colors.onSurface,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 2,
    },
    timeAgo: {
      color: theme.colors.onSurfaceVariant,
    },
    categoryPill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      borderWidth: 1,
    },
    categoryPillText: {
      fontSize: 10,
      fontWeight: typography.fontWeight.bold,
      letterSpacing: 0.5,
    },
    amount: {
      fontWeight: typography.fontWeight.bold,
      marginLeft: spacing.sm,
      color: theme.colors.onSurface,
    },
    emptyContainer: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingVertical: spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontWeight: typography.fontWeight.medium,
      color: theme.colors.onSurfaceVariant,
    },
  });
