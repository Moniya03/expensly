import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const { session, isInitialized } = useAuthStore();

  // Wait for auth to initialize
  if (!isInitialized) {
    return null;
  }

  // Redirect based on auth state
  if (session) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
