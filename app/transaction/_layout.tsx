import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';

export default function TransactionLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.onSurface,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.surface,
        },
      }}
    >
      <Stack.Screen
        name="add"
        options={{
          title: 'Add Expense',
          presentation: 'modal',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
