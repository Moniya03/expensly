import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type AppTheme, spacing, typography, useAppTheme } from '../../constants/theme';

export default function OnboardingWelcomeScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Ambient Glow */}
      <View style={styles.ambientGlow} />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mic-outline" size={64} color={theme.colors.primary} />
        </View>

        <Text variant="displaySmall" style={styles.title}>
          Expensly.
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Manage your transactions simply with a voice message.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          mode="contained"
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
          icon="arrow-right"
          contentStyle={styles.buttonContent}
          style={styles.primaryButton}
          onPress={() => router.push('/onboarding/name')}
        >
          Get Started
        </Button>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    ambientGlow: {
      position: 'absolute',
      top: '-15%',
      right: '-30%',
      width: 400,
      height: 400,
      borderRadius: 200,
      backgroundColor: `${theme.colors.primary}15`,
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
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.lg,
      letterSpacing: -1,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      lineHeight: 32,
      fontWeight: typography.fontWeight.regular,
    },
    footer: {
      paddingHorizontal: spacing.xxl,
      paddingBottom: spacing.xxl,
    },
    primaryButton: {
      borderRadius: 28,
    },
    buttonContent: {
      height: 56,
    },
  });
