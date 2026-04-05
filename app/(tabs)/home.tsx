import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useMonthlyBudget } from '../../hooks/useBudget';
import { useRecentTransactions, useCategorySpending } from '../../hooks/useTransactions';
import {
  SpendingRing,
  QuickStats,
  RecentTransactions,
  MondayRoast,
  EmptyState,
} from '../../components/home';
import VoiceFAB from '../../components/VoiceFAB';
import { GlassmorphicCard } from '../../components/ui/GlassmorphicCard';

export default function HomeScreen() {
  const { profile } = useAuthStore();
  const { budget, spent, isLoading: budgetLoading } = useMonthlyBudget();
  const { data: recentTransactions, isLoading: transactionsLoading } = useRecentTransactions(5);
  const { byCategory, isLoading: categoryLoading } = useCategorySpending();

  const displayName = profile?.display_name || 'there';
  const isLoading = budgetLoading || transactionsLoading || categoryLoading;
  const hasTransactions = recentTransactions && recentTransactions.length > 0;
  const isMonday = new Date().getDay() === 1;

  // Format current month for header
  const currentMonth = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Calculate today and week spending from recent transactions
  const todaySpent = React.useMemo(() => {
    if (!recentTransactions) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return recentTransactions
      .filter((t) => new Date(t.transaction_date) >= today)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [recentTransactions]);

  const weekSpent = React.useMemo(() => {
    if (!recentTransactions) return 0;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    return recentTransactions
      .filter((t) => new Date(t.transaction_date) >= weekAgo)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [recentTransactions]);

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hi, {displayName} 👋</Text>
          <Text style={styles.month}>{currentMonth}</Text>
        </View>

        {hasTransactions ? (
          <>
            {/* Spending Ring */}
            <View style={styles.ringContainer}>
              <SpendingRing
                budget={budget}
                spent={spent}
                categoryBreakdown={byCategory}
              />
            </View>

            {/* Quick Stats */}
            <GlassmorphicCard intensity={8} style={{ marginBottom: spacing.lg }}>
              <QuickStats today={todaySpent} week={weekSpent} />
            </GlassmorphicCard>

            {/* Monday Roast - only on Mondays */}
            {isMonday && (
              <MondayRoast
                roastText="Happy Monday! Ready to track your spending like a pro? 💪"
                isVisible={true}
              />
            )}

            {/* Recent Transactions */}
            <RecentTransactions transactions={recentTransactions} />
          </>
        ) : (
          /* Empty State - when no transactions exist */
          <EmptyState />
        )}
      </ScrollView>

      {/* Voice FAB - positioned outside ScrollView */}
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
    paddingBottom: 100, // Extra padding for FAB
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
  month: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurfaceVariant,
  },
  ringContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
});
