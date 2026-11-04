import { Stack } from 'expo-router';
import { useAppTheme } from '../../constants/theme';

export default function TransactionLayout() {
  const theme = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: theme.colors.surface,
        },
      }}
    >
      <Stack.Screen
        name="add"
        options={{
          title: 'Add Expense',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
