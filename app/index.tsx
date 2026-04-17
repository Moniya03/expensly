import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../constants/theme';

export default function Index() {
  const router = useRouter();
  const { session, profile, isInitialized, hasResolvedProfile } = useAuthStore();

  // Untouched auto-created profiles keep created_at === updated_at.
  const hasConfirmedUsername = Boolean(
    profile?.created_at && profile?.updated_at && new Date(profile.updated_at).getTime() > new Date(profile.created_at).getTime()
  );
  const needsBudgetOnboarding = !!session && hasResolvedProfile && !profile?.onboarding_complete;
  const needsNameOnboarding = !!session && hasResolvedProfile && needsBudgetOnboarding && !hasConfirmedUsername;

  useEffect(() => {
    if (!isInitialized || (session && !hasResolvedProfile)) return;

    if (!session) {
      router.replace('/(auth)/welcome');
    } else if (needsNameOnboarding) {
      router.replace('/onboarding/name');
    } else if (needsBudgetOnboarding) {
      router.replace('/onboarding/budget');
    } else {
      router.replace('/(tabs)/home');
    }
  }, [isInitialized, session, hasResolvedProfile, needsNameOnboarding, needsBudgetOnboarding, router]);

  if (!isInitialized || (session && !hasResolvedProfile)) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.surface,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return null;
}
