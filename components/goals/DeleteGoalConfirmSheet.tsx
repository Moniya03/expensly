import { useMemo } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius, type Colors, spacing, typography, useColors } from '../../constants/theme';
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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!goal) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Delete goal?</Text>
          <Text style={styles.subtitle}>
            This will permanently remove “{goal.name}” and its saved progress.
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onDelete}
              disabled={isDeleting}
              style={({ pressed }) => [
                styles.dangerButton,
                pressed && styles.pressed,
                isDeleting && styles.disabled,
              ]}
            >
              {isDeleting ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <Text style={styles.dangerText}>Delete</Text>
              )}
            </Pressable>
            <Pressable
              onPress={onClose}
              disabled={isDeleting}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
                isDeleting && styles.disabled,
              ]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
    },
    sheet: {
      backgroundColor: colors.surfaceContainerHigh,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    handle: {
      alignSelf: 'center',
      width: 44,
      height: 5,
      borderRadius: 999,
      backgroundColor: colors.outlineVariant,
    },
    title: {
      color: colors.onSurface,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
    },
    subtitle: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.sm,
      lineHeight: 20,
    },
    actions: { gap: spacing.sm },
    dangerButton: {
      minHeight: 52,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dangerText: {
      color: colors.onAccent,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
    cancelButton: {
      minHeight: 48,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      color: colors.onSurface,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.medium,
    },
    pressed: { opacity: 0.8 },
    disabled: { opacity: 0.5 },
  });
