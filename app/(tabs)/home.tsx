import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useMonthlyTransactions, useRecentTransactions } from '../../hooks/useTransactions';
import {
  HeroBudgetCard,
  QuickStats,
  RecentTransactions,
} from '../../components/home';
import { FloatingParticles } from '../../components/ui/FloatingParticles';
import { GradientText } from '../../components/ui/GradientText';
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
  const headerPulse = React.useRef(new Animated.Value(0)).current;

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

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(headerPulse, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(headerPulse, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [headerPulse]);

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
      <View style={styles.atmosphere} pointerEvents="none">
        <LinearGradient
          colors={['rgba(26,107,255,0.22)', 'rgba(26,107,255,0.00)']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.95, y: 0.85 }}
          style={[styles.glow, styles.glowPrimary]}
        />
        <LinearGradient
          colors={['rgba(0,212,170,0.18)', 'rgba(0,212,170,0.00)']}
          start={{ x: 1, y: 0.15 }}
          end={{ x: 0.2, y: 1 }}
          style={[styles.glow, styles.glowSecondary]}
        />
        <FloatingParticles count={16} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerGlow}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.headerAccent,
              {
                opacity: headerPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.28, 0.46],
                }),
                transform: [
                  {
                    scale: headerPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1.02],
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.avatarGlowRing,
                  {
                    opacity: headerPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.35, 0.62],
                    }),
                    transform: [
                      {
                        scale: headerPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.96, 1.04],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <View style={styles.avatarShell}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <LinearGradient
                    colors={['rgba(26,107,255,0.95)', 'rgba(0,212,170,0.82)']}
                    start={{ x: 0.12, y: 0.05 }}
                    end={{ x: 0.88, y: 0.95 }}
                    style={styles.avatarFallback}
                  >
                    <View style={styles.avatarFallbackInner}>
                      <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
                    </View>
                  </LinearGradient>
                )}
              </View>

              <View style={styles.greetingBlock}>
                <Text style={styles.greeting}>{greeting},</Text>
                <View style={styles.nameRow}>
                  <GradientText style={styles.name}>{displayName}</GradientText>
                  <Text style={styles.nameSuffix}>👋</Text>
                </View>
              </View>
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
    backgroundColor: colors.surface,
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: 'absolute',
    borderRadius: borderRadius.full,
    opacity: 0.9,
  },
  glowPrimary: {
    width: 260,
    height: 260,
    top: -100,
    left: -80,
  },
  glowSecondary: {
    width: 240,
    height: 240,
    top: 90,
    right: -90,
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
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  headerGlow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.10,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    position: 'relative',
  },
  headerAccent: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 2,
    bottom: 2,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(26,107,255,0.06)',
  },
  avatarGlowRing: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: borderRadius.full,
    left: -3,
    top: -3,
    borderWidth: 1,
    borderColor: 'rgba(45,226,255,0.22)',
    backgroundColor: 'rgba(26,107,255,0.06)',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarShell: {
    padding: 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(45,226,255,0.14)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarFallbackInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,12,24,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  avatarInitial: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  greetingBlock: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  greeting: {
    fontSize: typography.fontSize.xs,
    color: '#9AA8D0',
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 0.6,
  },
  name: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  nameSuffix: {
    color: colors.onSurface,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
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
