import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useMonthlyTransactions, useRecentTransactions } from '../../hooks/useTransactions';
import {
  HeroBudgetCard,
  QuickStats,
  RecentTransactions,
} from '../../components/home';
import { getGreeting, parseLocalDate } from '../../utils/date';

let budgetTipConsumed = false;

export default function HomeScreen() {
  const router = useRouter();
  const { profile, session } = useAuthStore();
  const { data: recentTransactions = [], isLoading: transactionsLoading } = useRecentTransactions(5);
  const { data: monthlyTransactions = [], isLoading: monthlyTransactionsLoading } =
    useMonthlyTransactions();

  const displayName =
    profile?.name ||
    profile?.display_name ||
    session?.user.user_metadata?.name ||
    'there';
  const greeting = getGreeting();
  const isLoading = transactionsLoading || monthlyTransactionsLoading;
  const { showBudgetTip } = useLocalSearchParams<{ showBudgetTip?: string }>();
  const [isBudgetTipVisible, setIsBudgetTipVisible] = React.useState(
    showBudgetTip === '1' && !budgetTipConsumed
  );

  const budget = profile?.monthly_budget ?? 0;

  const spent = React.useMemo(
    () => monthlyTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
    [monthlyTransactions]
  );

  const byCategory = React.useMemo(
    () =>
      monthlyTransactions.reduce<Record<string, number>>((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
      }, {}),
    [monthlyTransactions]
  );

  const remaining = budget - spent;
  const isOverBudget = spent > budget;

  const todaySpent = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return monthlyTransactions
      .filter((transaction) => {
        const date = parseLocalDate(transaction.transaction_date);
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
      .filter((transaction) => parseLocalDate(transaction.transaction_date) >= startOfWeek)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [monthlyTransactions]);

  React.useEffect(() => {
    if (showBudgetTip === '1' && !budgetTipConsumed) {
      budgetTipConsumed = true;
      setIsBudgetTipVisible(true);
    }
  }, [showBudgetTip]);

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
        </View>

        <HeroBudgetCard
          spent={spent}
          budget={budget}
          remaining={remaining}
          isOverBudget={isOverBudget}
          byCategory={byCategory}
          onPress={() => router.push('/insights/month' as never)}
        />

        <QuickStats today={todaySpent} week={weekSpent} />

        <RecentTransactions transactions={recentTransactions} />
      </ScrollView>

      {isBudgetTipVisible ? (
        <View style={styles.tipOverlay} pointerEvents="box-none">
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Profile tab</Text>
            <Text style={styles.tipBody}>Finish budget setup there later.</Text>
            <Pressable style={styles.tipButton} onPress={() => setIsBudgetTipVisible(false)}>
              <Text style={styles.tipButtonText}>Dismiss</Text>
            </Pressable>
            <View style={styles.tipPointer} />
          </View>
        </View>
      ) : null}
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
    paddingBottom: 156,
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
  tipOverlay: {
    position: 'absolute',
    right: spacing.sm,
    bottom: 86,
    alignItems: 'flex-end',
  },
  tipCard: {
    maxWidth: 220,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
    position: 'relative',
  },
  tipTitle: {
    color: colors.onSurface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
  },
  tipBody: {
    color: colors.onSurfaceVariant,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.xs,
  },
  tipButton: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  tipButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
  },
  tipPointer: {
    position: 'absolute',
    right: 18,
    bottom: -12,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.surfaceContainerHigh,
  },
});
