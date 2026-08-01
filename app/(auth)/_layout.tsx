import { Stack } from 'expo-router';
import { useColors } from '../../constants/theme';

export default function AuthLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
