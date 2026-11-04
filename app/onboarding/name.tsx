import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type AppTheme, spacing, typography, useAppTheme } from '../../constants/theme';
import { useUpdateProfile } from '../../hooks/useProfile';

export default function NameOnboardingScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  const [name, setName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleContinue = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Tell us what to call you');
      return;
    }

    try {
      setError(null);
      await updateProfile({
        name: trimmedName,
      });
      router.replace('/onboarding/budget');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to save your name');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Ambient Glow to match welcome */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="labelLarge" style={styles.eyebrow}>
            Step 1 of 2
          </Text>
          <Text variant="headlineMedium" style={styles.title}>
            What should we call you?
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            This is how we&apos;ll address you in the app.
          </Text>
        </View>

        <TextInput
          mode="outlined"
          label="Your name"
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (error) setError(null);
          }}
          autoFocus
          error={Boolean(error)}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isPending}
          returnKeyType="done"
          onSubmitEditing={handleContinue}
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
          disabled={!name.trim() || isPending}
          icon="arrow-right"
          contentStyle={styles.buttonContent}
          style={styles.primaryButton}
          onPress={handleContinue}
        >
          Continue
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
  });
