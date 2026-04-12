import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useUpdateProfile } from '../../hooks/useProfile';
import { useAuthStore } from '../../stores/authStore';

export default function NameOnboardingScreen() {
  const router = useRouter();
  const { profile, session } = useAuthStore();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  const initialName = React.useMemo(
    () => profile?.name || profile?.display_name || session?.user.user_metadata?.name || '',
    [profile?.display_name, profile?.name, session?.user.user_metadata?.name]
  );
  const [name, setName] = React.useState(initialName);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(initialName);
  }, [initialName]);

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
        onboarding_complete: true,
      });
      router.replace('/(tabs)/home');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to save your name');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>One quick setup</Text>
        <Text style={styles.title}>What should we call you?</Text>
        <Text style={styles.subtitle}>We’ll use this in your dashboard greeting.</Text>

        <Input
          label="Your name"
          placeholder="Enter your name"
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (error) setError(null);
          }}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isPending}
          containerStyle={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isPending && styles.buttonDisabled]}
          activeOpacity={0.85}
          onPress={handleContinue}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
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
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  button: {
    minHeight: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
  },
});
