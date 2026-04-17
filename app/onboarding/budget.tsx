import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
      <View style={styles.content}>
        <Text style={styles.eyebrow}>One quick setup</Text>
        <Text style={styles.title}>Set your monthly budget</Text>

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
            placeholderTextColor={colors.onSurfaceVariant}
            keyboardType="number-pad"
            selectionColor={colors.primary}
            editable={!isPending}
            maxLength={12}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.primaryButton, isPending && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.primaryButtonText}>Save budget</Text>
          )}
        </Pressable>

        <Pressable style={styles.skipButton} onPress={handleSkip} disabled={isPending}>
          <Text style={styles.skipButtonText}>Skip</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.onSurface,
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  inputWrap: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputWrapError: {
    borderColor: colors.error,
  },
  currency: {
    color: colors.secondary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semiBold,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.onSurface,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semiBold,
    padding: 0,
  },
  error: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginTop: spacing.xl,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
  },
  skipButton: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipButtonText: {
    color: colors.onSurfaceVariant,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
