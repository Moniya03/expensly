import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategoryColor, getCategoryConfig } from '../../constants/categories';
import { borderRadius, type Colors, spacing, typography, useColors } from '../../constants/theme';
import { useMonthlyTransactions } from '../../hooks/useTransactions';
import { sentenceCase } from '../../utils/string';
import { useAuthStore } from '../../stores/authStore';
import type { Category, Transaction } from '../../types';
import { formatRupees } from '../../utils/currency';

type GroupedCategory = {
  category: Category;
  total: number;
  groups: Array<{
    key: string;
    label: string;
    total: number;
  }>;
};

function getGroupLabel(transaction: Transaction) {
  const merchant = transaction.merchant?.trim();
  const description = transaction.description?.trim();
  return sentenceCase(merchant || description || 'Unknown');
}

export default function MonthlyInsightsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { profile } = useAuthStore();
  const { data: monthlyTransactions = [], isLoading } = useMonthlyTransactions();
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({});

  const budget = profile?.monthly_budget ?? 0;
  const monthLabel = React.useMemo(
    () =>
      new Date().toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      }),
    [],
  );

  const totalSpent = React.useMemo(
    () => monthlyTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
    [monthlyTransactions],
  );

  const categoryBreakdown = React.useMemo<GroupedCategory[]>(() => {
    const grouped = monthlyTransactions.reduce<Record<string, GroupedCategory>>(
      (acc, transaction) => {
        const key = transaction.category;

        if (!acc[key]) {
          acc[key] = {
            category: transaction.category,
            total: 0,
            groups: [],
          };
        }

        acc[key].total += transaction.amount;

        const label = getGroupLabel(transaction);
        const existingGroup = acc[key].groups.find((group) => group.key === label);

        if (existingGroup) {
          existingGroup.total += transaction.amount;
        } else {
          acc[key].groups.push({
            key: label,
            label,
            total: transaction.amount,
          });
        }

        return acc;
      },
      {},
    );

    return Object.values(grouped)
      .map((item) => ({
        ...item,
        groups: item.groups.sort((a, b) => b.total - a.total),
      }))
      .sort((a, b) => b.total - a.total);
  }, [monthlyTransactions]);

  const toggleCategory = (category: Category) => {
    setExpandedCategories((current) => ({
      ...current,
      [category]: !current[category],
    }));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>

        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Where money is going</Text>
          <Text style={styles.subtitle}>{monthLabel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryLabel}>Spent this month</Text>
          <Text style={styles.summaryAmount}>{formatRupees(totalSpent)}</Text>
          <Text style={styles.summaryMeta}>
            {budget > 0
              ? `${formatRupees(Math.abs(budget - totalSpent))} ${totalSpent > budget ? 'over' : 'left'} of ${formatRupees(budget)}`
              : 'No monthly budget set'}
          </Text>
        </View>

        <View style={styles.section}>
          {categoryBreakdown.length > 0 ? (
            categoryBreakdown.map((item) => {
              const config = getCategoryConfig(item.category);
              const isExpanded = !!expandedCategories[item.category];

              return (
                <View key={item.category} style={styles.categoryBlock}>
                  <Pressable
                    onPress={() => toggleCategory(item.category)}
                    style={({ pressed }) => [styles.categoryRow, pressed && styles.pressed]}
                  >
                    <View style={styles.categoryInfo}>
                      <View
                        style={[
                          styles.categoryDot,
                          { backgroundColor: getCategoryColor(item.category) },
                        ]}
                      />
                      <Text style={styles.categoryLabel}>{config.label}</Text>
                    </View>

                    <View style={styles.categoryAmountWrap}>
                      <Text style={styles.categoryAmount}>{formatRupees(item.total)}</Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.onSurfaceVariant}
                      />
                    </View>
                  </Pressable>

                  {isExpanded ? (
                    <View style={styles.groupList}>
                      {item.groups.map((group) => (
                        <View key={group.key} style={styles.groupRow}>
                          <Text style={styles.groupLabel} numberOfLines={1}>
                            {group.label}
                          </Text>
                          <Text style={styles.groupAmount}>{formatRupees(group.total)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No spends yet this month</Text>
              <Text style={styles.emptySubtitle}>
                Your current-month category breakdown will appear here.
              </Text>
            </View>
          )}
        </View>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.md,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextWrap: {
      flex: 1,
    },
    title: {
      fontSize: typography.fontSize.xxl,
      fontWeight: typography.fontWeight.bold,
      color: colors.onSurface,
    },
    subtitle: {
      marginTop: 2,
      fontSize: typography.fontSize.sm,
      color: colors.onSurfaceVariant,
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    summaryBlock: {
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.outlineVariant,
      paddingBottom: spacing.md,
    },
    summaryLabel: {
      fontSize: typography.fontSize.sm,
      color: '#8B9CC7',
      fontWeight: typography.fontWeight.medium,
    },
    summaryAmount: {
      fontSize: typography.fontSize.xxxl,
      fontWeight: typography.fontWeight.bold,
      color: colors.onSurface,
    },
    summaryMeta: {
      fontSize: typography.fontSize.sm,
      color: colors.onSurfaceVariant,
    },
    section: {
      gap: spacing.sm,
    },
    categoryBlock: {
      paddingVertical: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.outlineVariant,
    },
    categoryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    categoryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    categoryDot: {
      width: 10,
      height: 10,
      borderRadius: borderRadius.full,
    },
    categoryLabel: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.onSurface,
    },
    categoryAmountWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    categoryAmount: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.onSurface,
    },
    groupList: {
      paddingBottom: spacing.sm,
    },
    groupRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      gap: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.outlineVariant,
      marginLeft: 20,
    },
    groupLabel: {
      flex: 1,
      fontSize: typography.fontSize.sm,
      color: colors.onSurfaceVariant,
    },
    groupAmount: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.onSurface,
    },
    emptyState: {
      paddingVertical: spacing.lg,
      gap: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.outlineVariant,
    },
    emptyTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.onSurface,
    },
    emptySubtitle: {
      fontSize: typography.fontSize.sm,
      color: colors.onSurfaceVariant,
    },
    pressed: {
      opacity: 0.72,
    },
  });
