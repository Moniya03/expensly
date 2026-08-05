import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { borderRadius, type Colors, spacing, typography, useColors } from '../../constants/theme';
import { useUpdateProfile } from '../../hooks/useProfile';

type NameEditSheetProps = {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSaved: (name: string) => void;
};

export default function NameEditSheet({
  visible,
  currentName,
  onClose,
  onSaved,
}: NameEditSheetProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const [name, setName] = React.useState(currentName);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setName(currentName);
      setError(null);
    }
  }, [visible, currentName]);

  const handleSave = async () => {
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Name is required');
      return;
    }

    try {
      setError(null);
      await updateProfile({ name: trimmed });
      onSaved(trimmed);
      onClose();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to save name');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Edit name</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (error) setError(null);
            }}
            placeholder="Your name"
            placeholderTextColor={colors.onSurfaceVariant}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isPending}
            selectionColor={colors.primary}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isPending}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={colors.onAccent} />
              ) : (
                <View style={styles.saveInner}>
                  <Ionicons name="checkmark" size={16} color={colors.onAccent} />
                  <Text style={styles.saveText}>Save</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    sheet: {
      backgroundColor: colors.surfaceContainer,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
    },
    handle: {
      width: 42,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.outlineVariant,
      alignSelf: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      color: colors.onSurface,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semiBold,
      marginBottom: spacing.md,
    },
    input: {
      backgroundColor: colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: borderRadius.md,
      color: colors.onSurface,
      fontSize: typography.fontSize.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    inputError: {
      borderColor: colors.error,
    },
    error: {
      color: colors.error,
      fontSize: typography.fontSize.sm,
      marginTop: spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    button: {
      flex: 1,
      minHeight: 48,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    cancelText: {
      color: colors.onSurface,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.medium,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    saveInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    saveText: {
      color: colors.onAccent,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
  });
