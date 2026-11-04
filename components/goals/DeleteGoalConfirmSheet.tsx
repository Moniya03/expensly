import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Surface, Text } from 'react-native-paper';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
import type { Goal } from '../../types';

type Props = {
  visible: boolean;
  goal: Goal | null;
  isDeleting?: boolean;
  onDelete: () => void | Promise<void>;
  onClose: () => void;
};

export function DeleteGoalConfirmSheet({
  visible,
  goal,
  isDeleting = false,
  onDelete,
  onClose,
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!goal) return null;

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalContent}>
        <Surface elevation={3} style={styles.sheet}>
          <View style={styles.handle} />
          <Text variant="headlineSmall" style={styles.title}>
            Delete goal?
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            This will permanently remove “{goal.name}” and its saved progress.
          </Text>

          <View style={styles.actions}>
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
              loading={isDeleting}
              disabled={isDeleting}
              onPress={onDelete}
              style={styles.actionButton}
            >
              Delete
            </Button>
            <Button
              mode="outlined"
              disabled={isDeleting}
              onPress={onClose}
              style={styles.actionButton}
            >
              Cancel
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContent: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    sheet: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    handle: {
      alignSelf: 'center',
      width: 44,
      height: 5,
      borderRadius: 999,
      backgroundColor: theme.colors.outlineVariant,
    },
    title: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    actionButton: {
      borderRadius: borderRadius.lg,
    },
  });
