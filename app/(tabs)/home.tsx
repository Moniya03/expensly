import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useMonthlyBudget } from '../../hooks/useBudget';
import {
  useCategorySpending,
  useMonthlyTransactions,
  useRecentTransactions,
} from '../../hooks/useTransactions';
import {
  CategorySpendingBars,
  HeroBudgetCard,
  MondayRoast,
  QuickStats,
  RecentTransactions,
} from '../../components/home';
import VoiceFAB from '../../components/VoiceFAB';
import { getCategoryConfig } from '../../constants/categories';
import { Category } from '../../types';
import { getGreeting } from '../../utils/date';

function getRoastMessage({
  spent,
  budget,
  weekSpent,
  streak,
  topCategory,
}: {
  spent: number;
  budget: number;
  weekSpent: number;
  streak: number;
  topCategory?: { label: string; amount: number };
}) {
  if (spent <= 0) {
    return 'No spends logged yet — clean slate energy. Let’s keep the first swipe intentional.';
  }

  if (budget > 0 && spent > budget) {
    return `You’re already over budget, and ${topCategory?.label ?? 'that top category'} is doing the heavy lifting. Time for fewer “just one more” spends.`;
  }

  if (budget > 0 && spent / budget >= 0.8) {
    return `You’ve burned through ${Math.round((spent / budget) * 100)}% of this month’s budget. Future-you would love a quieter week.`;
  }

  if (topCategory && topCategory.amount >= weekSpent && topCategory.amount > 0) {
    return `${topCategory.label} is leading your spending this month. Apparently that category has a VIP lane to your wallet.`;
  }

  if (streak > 0) {
    return `${streak}-day streak intact. Accountability looks good on you — now keep this week’s ₹${weekSpent.toLocaleString('en-IN')} from getting too confident.`;
  }

  return `This week is at ₹${weekSpent.toLocaleString('en-IN')}. Not chaos, not monk mode — just enough to keep an eye on.`;
}

export default function HomeScreen() {
  const { profile } = useAuthStore();
  const { budget, spent, remaining, percentUsed, isOverBudget, isLoading: budgetLoading } =
    useMonthlyBudget();
  const { data: recentTransactions = [], isLoading: transactionsLoading } = useRecentTransactions(5);
  const { data: monthlyTransactions = [], isLoading: monthlyTransactionsLoading } =
    useMonthlyTransactions();
  const { byCategory, isLoading: categoryLoading } = useCategorySpending();

  const displayName = profile?.display_name || 'there';
  const streakCount = profile?.streak_count ?? 0;
  const greeting = getGreeting();
  const isLoading = budgetLoading || transactionsLoading || monthlyTransactionsLoading || categoryLoading;

  const todaySpent = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return monthlyTransactions
      .filter((transaction) => {
        const date = new Date(transaction.transaction_date);
        date.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [monthlyTransactions]);

  const weekSpent = React.useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return monthlyTransactions
      .filter((transaction) => new Date(transaction.transaction_date) >= startOfWeek)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [monthlyTransactions]);

  const topCategory = React.useMemo(() => {
    const [category, amount] = Object.entries(byCategory)
      .filter(([, value]) => value > 0)
      .sort(([, a], [, b]) => b - a)[0] || [];

    if (!category || typeof amount !== 'number') {
      return undefined;
    }

    return {
      label: getCategoryConfig(category as Category).label,
      amount,
    };
  }, [byCategory]);

  const roastMessage = React.useMemo(
    () =>
      getRoastMessage({
        spent,
        budget,
        weekSpent,
        streak: streakCount,
        topCategory,
      }),
    [budget, spent, streakCount, topCategory, weekSpent]
  );

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}

            <View>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.name}>{displayName} 👋</Text>
            </View>
          </View>

          <View style={styles.streakPill}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>STREAK: {streakCount}</Text>
          </View>
        </View>

        <HeroBudgetCard
          spent={spent}
          budget={budget}
          remaining={remaining}
          percentUsed={percentUsed}
          isOverBudget={isOverBudget}
        />

        <QuickStats today={todaySpent} week={weekSpent} streak={streakCount} />

        <CategorySpendingBars byCategory={byCategory} />

        <MondayRoast roastText={roastMessage} isVisible />

        <RecentTransactions transactions={recentTransactions} />
      </ScrollView>

      <VoiceFAB />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
  greeting: {
    fontSize: typography.fontSize.xs,
    color: '#8B9CC7',
    fontWeight: typography.fontWeight.medium,
  },
  name: {
    fontSize: typography.fontSize.xl,
    color: colors.onSurface,
    fontWeight: typography.fontWeight.bold,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
});
