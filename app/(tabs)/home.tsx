import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useMonthlyTransactions, useRecentTransactions } from '../../hooks/useTransactions';
import { HeroBudgetCard, RecentTransactions } from '../../components/home';
import { FloatingParticles } from '../../components/ui/FloatingParticles';
import { getGreetingWithEmoji, parseLocalDate } from '../../utils/date';

const HOME_DIAGNOSTIC_MODE = false;

export default function HomeScreen() {
  const router = useRouter();
  const { profile, session } = useAuthStore();
  const { data: recentTransactions = [], isLoading: transactionsLoading } = useRecentTransactions(5);
  const { data: monthlyTransactions = [], isLoading: monthlyTransactionsLoading } =
    useMonthlyTransactions();

  const isLoading = transactionsLoading || monthlyTransactionsLoading;
  const { showBudgetTip } = useLocalSearchParams<{ showBudgetTip?: string }>();
  const [isBudgetTipVisible, setIsBudgetTipVisible] = React.useState(showBudgetTip === '1');

  const budget = profile?.monthly_budget ?? 0;

  const spent = React.useMemo(
    () => monthlyTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
    [monthlyTransactions]
  );

  const remaining = budget - spent;
  const displayName =
    profile?.name ||
    session?.user.user_metadata?.full_name ||
    session?.user.user_metadata?.name ||
    session?.user.email?.split('@')[0] ||
    'User';
  const greeting = getGreetingWithEmoji();

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
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(now.getDate() - daysSinceMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    return monthlyTransactions
      .filter((transaction) => parseLocalDate(transaction.transaction_date) >= startOfWeek)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [monthlyTransactions]);

  React.useEffect(() => {
    if (showBudgetTip === '1') {
      setIsBudgetTipVisible(true);
    }
  }, [showBudgetTip]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A6BFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (HOME_DIAGNOSTIC_MODE) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.greetingWrap}>
            <Text style={styles.greetingText}>
              {greeting.greeting} {greeting.emoji}, {displayName}!
            </Text>
          </View>

          <View style={styles.diagnosticCard}>
            <Text style={styles.diagnosticEyebrow}>SAFE MODE</Text>
            <Text style={styles.diagnosticTitle}>Home loaded without animated UI</Text>
            <Text style={styles.diagnosticBody}>Google sign-in and data fetch completed.</Text>
            <View style={styles.diagnosticStats}>
              <Text style={styles.diagnosticStat}>Recent items: {recentTransactions.length}</Text>
              <Text style={styles.diagnosticStat}>Month items: {monthlyTransactions.length}</Text>
              <Text style={styles.diagnosticStat}>Spent: ₹{spent}</Text>
              <Text style={styles.diagnosticStat}>Budget: ₹{budget}</Text>
            </View>
            <Text style={styles.diagnosticHint}>
              Next step: re-enable RecentTransactions, then HeroBudgetCard, then FloatingParticles.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.atmosphere} pointerEvents="none">
        <FloatingParticles count={6} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingWrap}>
          <Text style={styles.greetingText}>
            {greeting.greeting} {greeting.emoji}, {displayName}!
          </Text>
        </View>

        <View style={styles.heroWrap}>
          <HeroBudgetCard
            spent={spent}
            budget={budget}
            remaining={remaining}
            todaySpent={todaySpent}
            weekSpent={weekSpent}
            onPress={() => router.push('/insights/month' as never)}
          />
        </View>

        <View style={styles.recentWrap}>
          <RecentTransactions transactions={recentTransactions} />
        </View>
      </ScrollView>

      {isBudgetTipVisible ? (
        <View style={styles.tipOverlay} pointerEvents="box-none">
          <View style={styles.tipCard}>
            <View style={styles.tipTitleRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipTitle}>Profile tab</Text>
            </View>
            <Text style={styles.tipBody}>Set your monthly budget there when you’re ready.</Text>
            <Pressable style={styles.tipButton} onPress={() => setIsBudgetTipVisible(false)}>
              <Text style={styles.tipButtonText}>Got it</Text>
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
    backgroundColor: '#0A0F1A',
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
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
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: 154,
    gap: 28,
  },
  greetingWrap: {
    marginTop: -2,
    marginBottom: -6,
  },
  greetingText: {
    color: colors.onSurface,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    letterSpacing: -0.3,
  },
  heroWrap: {
    marginTop: -2,
  },
  diagnosticCard: {
    marginTop: 8,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(120, 160, 255, 0.18)',
    backgroundColor: 'rgba(15, 22, 40, 0.94)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: 10,
  },
  diagnosticEyebrow: {
    color: 'rgba(120,170,255,0.7)',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
  diagnosticTitle: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  diagnosticBody: {
    color: 'rgba(219, 228, 255, 0.82)',
    fontSize: typography.fontSize.sm,
  },
  diagnosticStats: {
    gap: 6,
    marginTop: 4,
  },
  diagnosticStat: {
    color: '#DDE8FF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  diagnosticHint: {
    color: "#4D9FFF",
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.xs,
    marginTop: 4,
  },
  recentWrap: {
    marginTop: 48,
  },
  tipOverlay: {
    position: 'absolute',
    right: spacing.md,
    bottom: 92,
    alignItems: 'flex-end',
  },
  tipCard: {
    maxWidth: 230,
    backgroundColor: 'rgba(15, 22, 40, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(120, 160, 255, 0.20)',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
    position: 'relative',
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  tipTitle: {
    color: colors.onSurface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
  },
  tipBody: {
    color: 'rgba(219, 228, 255, 0.82)',
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.xs,
  },
  tipButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(26,107,255,0.12)',
  },
  tipButtonText: {
    color: '#DDE8FF',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
  },
  tipPointer: {
    position: 'absolute',
    right: 24,
    bottom: -11,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(15, 22, 40, 0.94)',
  },
});
