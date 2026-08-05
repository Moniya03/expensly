import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Colors, spacing, typography, useColors } from '../../constants/theme';

export default function OnboardingWelcomeScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Ambient Glow */}
      <View style={styles.ambientGlow} />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mic-outline" size={64} color={colors.primary} />
        </View>

        <Text style={styles.title}>Expensly.</Text>
        <Text style={styles.subtitle}>Manage your transactions simply with a voice message.</Text>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/onboarding/name')}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={colors.surface}
            style={styles.buttonIcon}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    ambientGlow: {
      position: 'absolute',
      top: '-15%',
      right: '-30%',
      width: 400,
      height: 400,
      borderRadius: 200,
      backgroundColor: `${colors.primary}15`,
      transform: [{ scale: 1.5 }],
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.xxl,
      alignItems: 'flex-start',
    },
    iconContainer: {
      marginBottom: spacing.xxl,
    },
    title: {
      color: colors.onSurface,
      fontSize: typography.fontSize.xxxl * 1.2,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.lg,
      letterSpacing: -1,
    },
    subtitle: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.xl,
      lineHeight: 32,
      fontWeight: typography.fontWeight.regular,
    },
    footer: {
      paddingHorizontal: spacing.xxl,
      paddingBottom: spacing.xxl,
    },
    primaryButton: {
      minHeight: 64,
      borderRadius: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
    },
    primaryButtonText: {
      color: colors.surface,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semiBold,
    },
    buttonIcon: {
      marginLeft: spacing.sm,
    },
  });
