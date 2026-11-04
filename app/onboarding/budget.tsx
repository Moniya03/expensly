import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type AppTheme, spacing, typography, useAppTheme } from '../../constants/theme';
import { useUpdateProfile } from '../../hooks/useProfile';

function formatBudgetInput(value: string) {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-IN');
}

export default function BudgetOnboardingScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
          <Text variant="labelLarge" style={styles.eyebrow}>
            Step 2 of 2
          </Text>
          <Text variant="headlineMedium" style={styles.title}>
            Set a monthly budget
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            This helps us track your spending progress. You can change this later.
          </Text>
        </View>

        <TextInput
          mode="outlined"
          label="Monthly budget"
          left={<TextInput.Affix text="₹" />}
          keyboardType="number-pad"
          value={budget}
          onChangeText={(value) => {
            setBudget(formatBudgetInput(value));
            if (error) setError(null);
          }}
          error={Boolean(error)}
          editable={!isPending}
          maxLength={12}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
          style={styles.input}
        />
        <HelperText type="error" visible={Boolean(error)}>
          {error}
        </HelperText>
      </View>

      <View style={styles.footer}>
        <Button
          mode="contained"
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
          loading={isPending}
          disabled={!budget || isPending}
          icon="arrow-right"
          contentStyle={styles.buttonContent}
          style={styles.primaryButton}
          onPress={handleSave}
        >
          Save budget
        </Button>

        <Button
          mode="text"
          textColor={theme.colors.onSurfaceVariant}
          disabled={isPending}
          onPress={handleSkip}
          style={styles.skipButton}
        >
          Skip for now
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
      top: '10%',
      right: '-20%',
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: `${theme.colors.primary}0D`,
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
      color: theme.colors.primary,
      textTransform: 'lowercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    title: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.xs,
      letterSpacing: -0.5,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      lineHeight: 24,
    },
    input: {
      backgroundColor: theme.colors.surface,
    },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
    },
    primaryButton: {
      borderRadius: 28,
    },
    buttonContent: {
      height: 56,
    },
    skipButton: {
      alignSelf: 'center',
      marginTop: spacing.md,
    },
  });
