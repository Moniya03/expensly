import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useUpdateProfile } from '../../hooks/useProfile';

function formatBudgetInput(value: string) {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-IN');
}

export default function BudgetOnboardingScreen() {
  const router = useRouter();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const [budget, setBudget] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleSave = async () => {
    const digits = budget.replace(/[^0-9]/g, '');
    const value = Number(digits);

    if (!Number.isInteger(value) || value < 1) {
      setError('Enter a monthly budget of at least 1');
      return;
    }

    try {
      setError(null);
      await updateProfile({
        monthly_budget: value,
        onboarding_complete: true,
      });
      router.replace('/(tabs)/home');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save budget');
    }
  };

  const handleSkip = async () => {
    try {
      setError(null);
      await updateProfile({
        monthly_budget: 0,
        onboarding_complete: true,
      });
      router.replace('/(tabs)/home?showBudgetTip=1');
    } catch (skipError) {
      setError(skipError instanceof Error ? skipError.message : 'Failed to skip budget setup');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Ambient Glow to match welcome */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Step 2 of 2</Text>
          <Text style={styles.title}>Set a monthly budget</Text>
          <Text style={styles.subtitle}>
            This helps us track your spending progress. You can change this later.
          </Text>
        </View>

        <View style={[styles.inputWrap, error ? styles.inputWrapError : null]}>
          <Text style={styles.currency}>₹</Text>
          <TextInput
            style={styles.input}
            value={budget}
            onChangeText={(value) => {
              setBudget(formatBudgetInput(value));
              if (error) setError(null);
            }}
            placeholder="0"
            placeholderTextColor={`${colors.onSurfaceVariant}80`}
            keyboardType="number-pad"
            selectionColor={colors.primary}
            editable={!isPending}
            maxLength={12}
            autoFocus
            cursorColor={colors.primary}
          />
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryButton, (!budget || isPending) && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!budget || isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Save budget</Text>
              <Ionicons name="arrow-forward" size={20} color="#000000" style={styles.buttonIcon} />
            </>
          )}
        </Pressable>

        <Pressable style={styles.skipButton} onPress={handleSkip} disabled={isPending}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  ambientGlow: {
    position: 'absolute',
    top: '10%',
    right: '-20%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: `${colors.primary}0D`,
    transform: [{ scale: 1.2 }],
  },
  content: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing.xxl,
    marginTop: spacing.xl,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    textTransform: 'lowercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.onSurface,
    fontSize: typography.fontSize.xxl + 4,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: typography.fontSize.md,
    lineHeight: 24,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: `${colors.primary}4D`,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  inputWrapError: {
    borderBottomColor: colors.error,
  },
  currency: {
    color: colors.secondary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semiBold,
    marginRight: spacing.sm,
    marginTop: 2, // Slight alignment tweak for large numbers
  },
  input: {
    flex: 1,
    color: colors.onSurface,
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.medium,
    padding: 0,
    letterSpacing: -0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.error}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
  },
  buttonIcon: {
    marginLeft: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  skipButton: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipButtonText: {
    color: colors.onSurfaceVariant,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textDecorationLine: 'underline',
  },
});
