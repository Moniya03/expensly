import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../constants/theme';
import { configureGoogleSignIn } from '../hooks/useGoogleAuth';

// Configure Google Sign-In on app startup
configureGoogleSignIn();

if (__DEV__) {
  const globalWithFetchPatch = globalThis as typeof globalThis & {
    __EXPENSLY_FETCH_REJECTION_LOGGER_PATCHED__?: boolean;
  };

  if (!globalWithFetchPatch.__EXPENSLY_FETCH_REJECTION_LOGGER_PATCHED__) {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input, init) => {
      const method = input instanceof Request ? input.method : init?.method || 'GET';
      const url = input instanceof Request ? input.url : String(input);

      try {
        return await originalFetch(input, init);
      } catch (error) {
        console.error(`[fetch] Request failed: ${method} ${url}`, error);
        throw error;
      }
    };

    globalWithFetchPatch.__EXPENSLY_FETCH_REJECTION_LOGGER_PATCHED__ = true;
  }
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { session, profile, isInitialized, hasResolvedProfile, initialize } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initialize().catch((err) => {
      console.error('Auth initialization error:', err);
      setError(err?.message || 'Failed to initialize auth');
    });
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const hasName = Boolean((profile?.name || profile?.display_name || session?.user.user_metadata?.name || '').trim());
    const needsNameOnboarding = !!session && hasResolvedProfile && (!profile?.onboarding_complete || !hasName);

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && !hasResolvedProfile) {
      return;
    } else if (needsNameOnboarding && !inOnboarding) {
      router.replace('/onboarding/name');
    } else if (session && !needsNameOnboarding && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)/home');
    }
  }, [session, profile, isInitialized, hasResolvedProfile, segments]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface, padding: 20 }}>
        <Text style={{ color: colors.error, fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Error</Text>
        <Text style={{ color: colors.onSurface, fontSize: 14, textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="insights" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
