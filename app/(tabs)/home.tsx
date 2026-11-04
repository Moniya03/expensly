import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeroBudgetCard, RecentTransactions } from '../../components/home';
import { FloatingParticles } from '../../components/ui/FloatingParticles';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
import { useMonthlyTransactions, useRecentTransactions } from '../../hooks/useTransactions';
import { useAuthStore } from '../../stores/authStore';
import { getGreetingWithEmoji, parseLocalDate } from '../../utils/date';

const HOME_DIAGNOSTIC_MODE = false;

export default function HomeScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { profile, session } = useAuthStore();
  const { data: recentTransactions = [], isLoading: transactionsLoading } =
    useRecentTransactions(5);
  const { data: monthlyTransactions = [], isLoading: monthlyTransactionsLoading } =
    useMonthlyTransactions();

  const isLoading = transactionsLoading || monthlyTransactionsLoading;
  const { showBudgetTip } = useLocalSearchParams<{ showBudgetTip?: string }>();
  const [isBudgetTipVisible, setIsBudgetTipVisible] = React.useState(showBudgetTip === '1');

  const budget = profile?.monthly_budget ?? 0;

  const spent = React.useMemo(
    () => monthlyTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
    [monthlyTransactions],
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
      <Surface style={styles.screenSurface}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </SafeAreaView>
      </Surface>
    );
  }

  if (HOME_DIAGNOSTIC_MODE) {
    return (
      <Surface style={styles.screenSurface}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.greetingWrap}>
              <Text variant="headlineSmall" style={styles.greetingText}>
                {greeting.greeting} {greeting.emoji}, {displayName}!
              </Text>
            </View>

            <Surface style={styles.diagnosticCard}>
              <Text style={styles.diagnosticEyebrow}>SAFE MODE</Text>
              <Text variant="titleLarge" style={styles.diagnosticTitle}>
                Home loaded without animated UI
              </Text>
              <Text variant="bodyMedium" style={styles.diagnosticBody}>
                Google sign-in and data fetch completed.
              </Text>
              <View style={styles.diagnosticStats}>
                <Text variant="bodyMedium" style={styles.diagnosticStat}>
                  Recent items: {recentTransactions.length}
                </Text>
                <Text variant="bodyMedium" style={styles.diagnosticStat}>
                  Month items: {monthlyTransactions.length}
                </Text>
                <Text variant="bodyMedium" style={styles.diagnosticStat}>
                  Spent: ₹{spent}
                </Text>
                <Text variant="bodyMedium" style={styles.diagnosticStat}>
                  Budget: ₹{budget}
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.diagnosticHint}>
                Next step: re-enable RecentTransactions, then HeroBudgetCard, then
                FloatingParticles.
              </Text>
            </Surface>
          </ScrollView>
        </SafeAreaView>
      </Surface>
    );
  }

  return (
    <Surface style={styles.screenSurface}>
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
            <Text variant="headlineSmall" style={styles.greetingText}>
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
            <RecentTransactions
              transactions={recentTransactions}
              onSeeAll={() => router.push('/(tabs)/history' as never)}
            />
          </View>
        </ScrollView>

        {isBudgetTipVisible ? (
          <View style={styles.tipOverlay} pointerEvents="box-none">
            <Surface elevation={3} style={styles.tipCard}>
              <View style={styles.tipTitleRow}>
                <View style={styles.tipDot} />
                <Text variant="titleSmall" style={styles.tipTitle}>
                  Profile tab
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.tipBody}>
                Set your monthly budget there when you’re ready.
              </Text>
              <Button
                mode="text"
                compact
                textColor={theme.colors.primary}
                style={styles.tipButton}
                contentStyle={styles.tipButtonContent}
                labelStyle={styles.tipButtonText}
                onPress={() => setIsBudgetTipVisible(false)}
              >
                Got it
              </Button>
              <View style={styles.tipPointer} />
            </Surface>
          </View>
        ) : null}
      </SafeAreaView>
    </Surface>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    screenSurface: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
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
      color: theme.colors.onSurface,
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
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerHigh,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      gap: 10,
    },
    diagnosticEyebrow: {
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: typography.fontWeight.bold,
      letterSpacing: 1,
    },
    diagnosticTitle: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
    },
    diagnosticBody: {
      color: theme.colors.onSurfaceVariant,
      fontSize: typography.fontSize.sm,
    },
    diagnosticStats: {
      gap: 6,
      marginTop: 4,
    },
    diagnosticStat: {
      color: theme.colors.onSurface,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
    },
    diagnosticHint: {
      color: theme.colors.primary,
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
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: 4,
      position: 'relative',
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
      backgroundColor: theme.colors.primary,
    },
    tipTitle: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.semiBold,
    },
    tipBody: {
      color: theme.colors.onSurfaceVariant,
      fontSize: typography.fontSize.xs,
      lineHeight: typography.lineHeight.relaxed * typography.fontSize.xs,
    },
    tipButton: {
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    tipButtonContent: {
      paddingHorizontal: 0,
      marginHorizontal: 0,
    },
    tipButtonText: {
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
      borderTopColor: theme.colors.surfaceContainerHigh,
    },
  });
