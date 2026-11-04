import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, HelperText, Modal, Portal, Surface, Text, TextInput } from 'react-native-paper';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
import { useUpdateProfile } from '../../hooks/useProfile';

type NameEditSheetProps = {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSaved: (name: string) => void;
};

export function NameEditSheet({ visible, currentName, onClose, onSaved }: NameEditSheetProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalContent}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Surface elevation={3} style={styles.sheet}>
            <Text variant="titleLarge" style={styles.title}>
              Edit your name
            </Text>

            <TextInput
              mode="outlined"
              label="Your name"
              value={name}
              onChangeText={(value) => {
                setName(value);
                if (error) setError(null);
              }}
              autoFocus
              error={Boolean(error)}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isPending}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <HelperText type="error" visible={Boolean(error)}>
              {error}
            </HelperText>

            <View style={styles.actions}>
              <Button mode="outlined" onPress={onClose} disabled={isPending} style={styles.button}>
                Cancel
              </Button>
              <Button
                mode="contained"
                buttonColor={theme.colors.primary}
                loading={isPending}
                disabled={isPending}
                onPress={handleSave}
                style={styles.button}
              >
                Save
              </Button>
            </View>
          </Surface>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

export default NameEditSheet;

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContent: {
      paddingHorizontal: spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    keyboardView: {
      width: '100%',
      maxWidth: 420,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheet: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
    },
    title: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.semiBold,
      marginBottom: spacing.md,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    button: {
      flex: 1,
    },
  });
