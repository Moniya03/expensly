import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';

export function GoalEmptyState({ onCreate }: { onCreate: () => void }) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.iconShell}>
        <Ionicons name="sparkles-outline" size={32} color={theme.colors.primary} />
      </View>
      <Text variant="titleLarge" style={styles.title}>
        Build the next milestone
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Add a savings goal and keep the momentum calm and visible.
      </Text>
      <Button
        mode="contained"
        onPress={onCreate}
        buttonColor={theme.colors.primary}
        textColor={theme.colors.onPrimary}
        style={styles.cta}
        contentStyle={styles.ctaContent}
      >
        Create goal
      </Button>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    iconShell: {
      width: 64,
      height: 64,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surfaceContainerHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
      textAlign: 'center',
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      lineHeight: typography.fontSize.sm * 1.5,
      textAlign: 'center',
    },
    cta: {
      marginTop: spacing.xs,
      borderRadius: borderRadius.full,
    },
    ctaContent: {
      paddingHorizontal: spacing.sm,
    },
  });
