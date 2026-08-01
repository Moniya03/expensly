import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, spacing, typography, useColors, type Colors } from '../../constants/theme';
import { useUpdateProfile } from '../../hooks/useProfile';

export default function NameOnboardingScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
          <Text style={styles.eyebrow}>Step 1 of 2</Text>
          <Text style={styles.title}>What should we call you?</Text>
          <Text style={styles.subtitle}>
            This is how we'll address you in the app.
          </Text>
        </View>

        <View style={[styles.inputWrap, error ? styles.inputWrapError : null]}>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={`${colors.onSurfaceVariant}80`}
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (error) setError(null);
            }}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isPending}
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
          style={[styles.primaryButton, (!name.trim() || isPending) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!name.trim() || isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#000000" style={styles.buttonIcon} />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
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
    borderBottomWidth: 1.5,
    borderBottomColor: `${colors.primary}4D`,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  inputWrapError: {
    borderBottomColor: colors.error,
  },
  input: {
    color: colors.onSurface,
    fontSize: typography.fontSize.xxl,
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
    color: colors.surface,
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
});
