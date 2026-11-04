import { Stack } from 'expo-router';
import { useAppTheme } from '../../constants/theme';

export default function AuthLayout() {
  const theme = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.surface },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
