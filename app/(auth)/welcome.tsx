import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { FloatingParticles } from '../../components/ui/FloatingParticles';
import { GlassmorphicCard } from '../../components/ui/GlassmorphicCard';
import { GradientText } from '../../components/ui/GradientText';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { signInWithGoogle, isLoading, error } = useGoogleAuth();

  // Pulsing animation for rings
  const outerScale = useSharedValue(1);
  const middleScale = useSharedValue(1);
  const innerScale = useSharedValue(1);

  useEffect(() => {
    outerScale.value = withRepeat(
      withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    middleScale.value = withRepeat(
      withTiming(1.15, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    innerScale.value = withRepeat(
      withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
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

      {/* Action Section */}
      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={[styles.googleButton, isLoading && styles.googleButtonDisabled]} 
          activeOpacity={0.8}
          onPress={signInWithGoogle}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Ionicons name="logo-google" size={24} color="#000000" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.footerLink}>Terms</Text> and{' '}
            <Text style={styles.footerLink}>Privacy</Text>
          </Text>
          <Text style={styles.copyrightText}>© {new Date().getFullYear()} Expensly</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onSurface,
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: spacing.xl,
  },
  googleButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.05,
    elevation: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.error}80`,
    marginBottom: spacing.md,
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutButtonText: {
    color: colors.error,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.xs,
  },
  helperText: {
    color: colors.onSurfaceVariant,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
  },
  googleButtonText: {
    color: '#000000',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.error}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.xs,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  footerLink: {
    color: '#9ca3af',
    textDecorationLine: 'underline',
  },
  copyrightText: {
    color: '#4b5563',
    fontSize: typography.fontSize.xs,
  },
});
