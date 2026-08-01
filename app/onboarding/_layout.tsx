import { Stack } from 'expo-router';
import { useColors } from '../../constants/theme';

export default function OnboardingLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="name" />
      <Stack.Screen name="budget" />
    </Stack>
  );
}
