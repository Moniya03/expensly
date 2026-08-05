import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloatingParticles } from '../components/ui/FloatingParticles';
import { GlassmorphicCard } from '../components/ui/GlassmorphicCard';
import { GradientText } from '../components/ui/GradientText';
import { type Colors, spacing, typography, useColors } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';
import { consumeOnboardingReplay, shouldReplayOnboarding } from '../utils/devOnboardingReplay';

const { width } = Dimensions.get('window');

export default function Index() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { session, profile, isInitialized, hasResolvedProfile } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  // Pulsing animation for rings
  const outerScale = useSharedValue(1);
  const middleScale = useSharedValue(1);
  const innerScale = useSharedValue(1);

  useEffect(() => {
    outerScale.value = withRepeat(
      withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    middleScale.value = withRepeat(
      withTiming(1.15, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    innerScale.value = withRepeat(
      withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    // End splash after a short delay so the user sees it
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
  }));

  const middleRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: middleScale.value }],
  }));

  const innerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  // Untouched auto-created profiles keep created_at === updated_at.
  const hasConfirmedUsername = Boolean(
    profile?.created_at &&
      profile?.updated_at &&
      new Date(profile.updated_at).getTime() > new Date(profile.created_at).getTime(),
  );
  const needsBudgetOnboarding = !!session && hasResolvedProfile && !profile?.onboarding_complete;
  const needsNameOnboarding =
    !!session && hasResolvedProfile && needsBudgetOnboarding && !hasConfirmedUsername;

  useEffect(() => {
    if (showSplash || !isInitialized || (session && !hasResolvedProfile)) return;

    if (!session) {
      router.replace('/(auth)/welcome');
    } else if (shouldReplayOnboarding()) {
      consumeOnboardingReplay();
      router.replace('/onboarding/welcome');
    } else if (needsNameOnboarding) {
      router.replace('/onboarding/name');
    } else if (needsBudgetOnboarding) {
      router.replace('/onboarding/budget');
    } else {
      router.replace('/(tabs)/home');
    }
  }, [
    showSplash,
    isInitialized,
    session,
    hasResolvedProfile,
    needsNameOnboarding,
    needsBudgetOnboarding,
    router,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <FloatingParticles count={15} />
      {/* Background Ambient Glow */}
      <View style={styles.ambientGlow} />

      {/* Hero Section: Voice Ripple */}
      <View style={styles.heroSection}>
        <Animated.View style={[styles.ring, styles.ringOuter, outerRingStyle]} />
        <Animated.View style={[styles.ring, styles.ringMiddle, middleRingStyle]} />
        <Animated.View style={[styles.ring, styles.ringInner, innerRingStyle]} />

        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.coreButton}
        >
          <Ionicons name="mic" size={42} color={colors.onSurface} />
        </LinearGradient>
      </View>

      {/* Brand & Content Section */}
      <View style={styles.contentSection}>
        {/* Badge */}
        <GlassmorphicCard intensity={15} style={styles.badgeContainer}>
          <Text style={styles.badgeText}>voice-first</Text>
        </GlassmorphicCard>

        {/* Title */}
        <Text style={styles.title}>Expensly</Text>

        {/* Tagline */}
        <View style={styles.taglineContainer}>
          <Text style={styles.taglineWhite}>Track your spend,</Text>
          <GradientText style={styles.taglineHighlight}>just say it.</GradientText>
        </View>
      </View>

      {/* Empty Action Section to maintain layout matching welcome screen */}
      <View style={styles.actionSection} />
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.lg,
    },
    ambientGlow: {
      position: 'absolute',
      top: '20%',
      width: width * 1.5,
      height: width * 1.5,
      borderRadius: width * 0.75,
      backgroundColor: `${colors.primary}0D`,
      transform: [{ scale: 1.2 }],
    },
    heroSection: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      marginTop: 40,
    },
    ring: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
    },
    ringOuter: {
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: `${colors.primary}0D`,
      borderWidth: 1,
      borderColor: `${colors.primary}1A`,
    },
    ringMiddle: {
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: `${colors.primary}1A`,
      borderWidth: 1,
      borderColor: `${colors.primary}33`,
    },
    ringInner: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: `${colors.primary}33`,
      borderWidth: 1,
      borderColor: `${colors.primary}4D`,
    },
    coreButton: {
      width: 96,
      height: 96,
      borderRadius: 48,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 10,
    },
    contentSection: {
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xxl,
    },
    badgeContainer: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: 20,
    },
    badgeText: {
      color: colors.primary,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semiBold,
      textTransform: 'lowercase',
      letterSpacing: 0.5,
    },
    title: {
      fontSize: typography.fontSize.xxxl + 4,
      fontWeight: typography.fontWeight.bold,
      color: colors.onSurface,
      marginBottom: spacing.md,
      letterSpacing: -0.5,
    },
    taglineContainer: {
      alignItems: 'center',
    },
    taglineWhite: {
      fontSize: typography.fontSize.xxl,
      fontWeight: typography.fontWeight.regular,
      color: colors.onSurface,
      opacity: 0.9,
    },
    taglineHighlight: {
      fontSize: typography.fontSize.xxl,
      fontWeight: typography.fontWeight.semiBold,
      color: colors.secondary,
      marginTop: 4,
    },
    actionSection: {
      width: '100%',
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      paddingBottom: spacing.lg,
      // Add empty height roughly equal to action section in welcome screen
      height: 150,
    },
  });
