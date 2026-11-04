import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Divider,
  IconButton,
  Surface,
  Text,
  TouchableRipple,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategoryColor, getCategoryConfig } from '../../constants/categories';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
import { useMonthlyTransactions } from '../../hooks/useTransactions';
import { useAuthStore } from '../../stores/authStore';
import type { Category, Transaction } from '../../types';
import { formatRupees } from '../../utils/currency';
import { sentenceCase } from '../../utils/string';

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
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { profile } = useAuthStore();
  const { data: monthlyTransactions = [], isLoading } = useMonthlyTransactions();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const budget = profile?.monthly_budget ?? 0;
  const monthLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      }),
    [],
  );

  const totalSpent = useMemo(
    () => monthlyTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
    [monthlyTransactions],
  );

  const categoryBreakdown = useMemo<GroupedCategory[]>(() => {
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
      <Surface style={styles.root}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </SafeAreaView>
      </Surface>
    );
  }

  return (
    <Surface style={styles.root}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.onSurface}
            containerColor={theme.colors.surfaceContainer}
            size={20}
            onPress={() => router.back()}
            style={styles.backButton}
          />

          <View style={styles.headerTextWrap}>
            <Text variant="headlineMedium" style={styles.title}>
              Where money is going
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {monthLabel}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Surface elevation={1} style={styles.summaryBlock}>
            <Text variant="bodyMedium" style={styles.summaryLabel}>
              Spent this month
            </Text>
            <Text variant="headlineLarge" style={styles.summaryAmount}>
              {formatRupees(totalSpent)}
            </Text>
            <Text variant="bodyMedium" style={styles.summaryMeta}>
              {budget > 0
                ? `${formatRupees(Math.abs(budget - totalSpent))} ${totalSpent > budget ? 'over' : 'left'} of ${formatRupees(budget)}`
                : 'No monthly budget set'}
            </Text>
          </Surface>

          <View style={styles.section}>
            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.map((item) => {
                const config = getCategoryConfig(item.category);
                const isExpanded = !!expandedCategories[item.category];

                return (
                  <View key={item.category} style={styles.categoryBlock}>
                    <TouchableRipple
                      onPress={() => toggleCategory(item.category)}
                      style={styles.categoryRow}
                      rippleColor={theme.colors.surfaceContainerHighest}
                    >
                      <View style={styles.categoryRowContent}>
                        <View style={styles.categoryInfo}>
                          <View
                            style={[
                              styles.categoryDot,
                              { backgroundColor: getCategoryColor(item.category) },
                            ]}
                          />
                          <Text variant="titleMedium" style={styles.categoryLabel}>
                            {config.label}
                          </Text>
                        </View>

                        <View style={styles.categoryAmountWrap}>
                          <Text variant="titleMedium" style={styles.categoryAmount}>
                            {formatRupees(item.total)}
                          </Text>
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={theme.colors.onSurfaceVariant}
                          />
                        </View>
                      </View>
                    </TouchableRipple>

                    {isExpanded ? (
                      <View style={styles.groupList}>
                        {item.groups.map((group, groupIndex) => (
                          <View key={group.key}>
                            {groupIndex > 0 && <Divider style={styles.groupDivider} />}
                            <View style={styles.groupRow}>
                              <Text variant="bodySmall" style={styles.groupLabel} numberOfLines={1}>
                                {group.label}
                              </Text>
                              <Text variant="bodySmall" style={styles.groupAmount}>
                                {formatRupees(group.total)}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : null}
                    <Divider style={styles.categoryDivider} />
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Divider style={styles.categoryDivider} />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No spends yet this month
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                  Your current-month category breakdown will appear here.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Surface>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    container: {
      flex: 1,
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
      paddingBottom: spacing.sm,
      gap: spacing.xs,
    },
    backButton: {
      marginRight: spacing.xs,
    },
    headerTextWrap: {
      flex: 1,
    },
    title: {
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.onSurface,
    },
    subtitle: {
      marginTop: 2,
      color: theme.colors.onSurfaceVariant,
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    summaryBlock: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    summaryLabel: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: typography.fontWeight.medium,
    },
    summaryAmount: {
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.onSurface,
    },
    summaryMeta: {
      color: theme.colors.onSurfaceVariant,
    },
    section: {
      gap: spacing.xs,
    },
    categoryBlock: {
      overflow: 'hidden',
    },
    categoryRow: {
      borderRadius: borderRadius.sm,
    },
    categoryRowContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
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
      fontWeight: typography.fontWeight.semiBold,
      color: theme.colors.onSurface,
    },
    categoryAmountWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    categoryAmount: {
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.onSurface,
    },
    groupList: {
      paddingBottom: spacing.sm,
    },
    groupDivider: {
      marginLeft: spacing.xl + spacing.sm,
    },
    groupRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingLeft: spacing.xl + spacing.sm,
      paddingRight: spacing.xs,
      gap: spacing.md,
    },
    groupLabel: {
      flex: 1,
      color: theme.colors.onSurfaceVariant,
    },
    groupAmount: {
      fontWeight: typography.fontWeight.semiBold,
      color: theme.colors.onSurface,
    },
    categoryDivider: {
      marginTop: spacing.xs,
    },
    emptyState: {
      paddingVertical: spacing.lg,
      gap: spacing.xs,
    },
    emptyTitle: {
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.onSurface,
      marginTop: spacing.md,
    },
    emptySubtitle: {
      color: theme.colors.onSurfaceVariant,
    },
  });
