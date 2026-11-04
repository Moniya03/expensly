import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Icon, IconButton, Modal, Portal, Surface, Text } from 'react-native-paper';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
import { useDeleteTransaction, useUpdateTransaction } from '../../hooks/useTransactions';
import type { Transaction } from '../../types';
import { toLocalDateString } from '../../utils/date';
import { AmountInput } from '../ui/AmountInput';
import { CategoryPicker } from '../ui/CategoryPicker';
import { DatePicker } from '../ui/DatePicker';
import { Input } from '../ui/Input';

type Props = {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
};

export function TransactionEditCard({ visible, transaction, onClose }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Transaction['category'] | null>(null);
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date());
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Reset fields whenever a transaction is opened
  useEffect(() => {
    if (transaction && visible) {
      setAmount(String(transaction.amount));
      setCategory(transaction.category);
      setDescription(transaction.description === 'Expense' ? '' : transaction.description);
      setMerchant(transaction.merchant ?? '');
      setDate(new Date(`${transaction.transaction_date}T00:00:00`));
      setConfirmingDelete(false);
    }
  }, [transaction, visible]);

  const updateMutation = useUpdateTransaction(transaction?.id ?? '');
  const deleteMutation = useDeleteTransaction();

  const amountNumber = parseInt(amount, 10);
  const isValid = amountNumber > 0 && category !== null;

  const handleSave = async () => {
    if (!transaction || !category || !isValid || updateMutation.isPending) return;
    try {
      await updateMutation.mutateAsync({
        amount: amountNumber,
        category,
        description: description.trim() || merchant.trim() || 'Expense',
        merchant: merchant.trim() || null,
        transaction_date: toLocalDateString(date),
        source: transaction.source,
      });
      onClose();
    } catch {
      // mutation error stays silent; sheet keeps open so the user can retry
    }
  };

  const handleDelete = async () => {
    if (!transaction || deleteMutation.isPending) return;
    try {
      await deleteMutation.mutateAsync(transaction.id);
      onClose();
    } catch {
      setConfirmingDelete(false);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalContent}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Surface elevation={3} style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Icon source="pencil-outline" size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.headerText}>
                <Text variant="titleMedium" style={styles.title}>
                  Edit expense
                </Text>
                <Text variant="bodySmall" style={styles.subtitle}>
                  Tap any field to refine it.
                </Text>
              </View>
              <IconButton
                icon="close"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
                containerColor={theme.colors.surfaceContainer}
                onPress={onClose}
                style={styles.closeButton}
              />
            </View>

            <ScrollView
              contentContainerStyle={styles.form}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <AmountInput
                value={amount}
                onChangeValue={setAmount}
                integerOnly
                error={
                  amount !== '' && amountNumber <= 0 ? 'Enter a whole-rupee amount' : undefined
                }
              />
              <CategoryPicker
                selectedCategory={category}
                onSelectCategory={setCategory}
                error={category === null ? 'Select a category' : undefined}
              />
              <Input
                label="Description"
                placeholder="What was this for?"
                value={description}
                onChangeText={setDescription}
              />
              <Input
                label="Merchant"
                placeholder="Where (optional)"
                value={merchant}
                onChangeText={setMerchant}
              />
              <DatePicker value={date} onChange={setDate} />
            </ScrollView>

            {confirmingDelete ? (
              <View style={styles.deleteConfirm}>
                <Text variant="titleSmall" style={styles.deleteConfirmText}>
                  Delete this expense?
                </Text>
                <View style={styles.deleteConfirmActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setConfirmingDelete(false)}
                    style={styles.deleteActionButton}
                    textColor={theme.colors.onSurface}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    buttonColor={theme.colors.error}
                    textColor={theme.colors.onError}
                    loading={deleteMutation.isPending}
                    disabled={deleteMutation.isPending}
                    onPress={handleDelete}
                    style={styles.deleteActionButton}
                  >
                    Delete
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.actions}>
                <Button
                  mode="text"
                  icon="trash-can-outline"
                  textColor={theme.colors.error}
                  onPress={() => setConfirmingDelete(true)}
                  style={styles.deleteButton}
                  labelStyle={styles.deleteButtonLabel}
                >
                  Delete expense
                </Button>
                <Button
                  mode="contained"
                  loading={updateMutation.isPending}
                  disabled={!isValid || updateMutation.isPending}
                  onPress={handleSave}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                  style={styles.saveButton}
                  contentStyle={styles.saveButtonContent}
                  labelStyle={styles.saveButtonLabel}
                >
                  Save changes
                </Button>
              </View>
            )}
          </Surface>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

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
    card: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '88%',
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      gap: spacing.md,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
    },
    title: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    closeButton: {
      margin: 0,
    },
    form: {
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    actions: {
      gap: spacing.sm,
    },
    deleteButton: {
      alignSelf: 'center',
    },
    deleteButtonLabel: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
    },
    saveButton: {
      borderRadius: borderRadius.lg,
    },
    saveButtonContent: {
      minHeight: 48,
    },
    saveButtonLabel: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
    deleteConfirm: {
      backgroundColor: theme.colors.errorContainer,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.error,
      padding: spacing.md,
      gap: spacing.sm,
    },
    deleteConfirmText: {
      color: theme.colors.onErrorContainer,
      fontWeight: typography.fontWeight.semiBold,
    },
    deleteConfirmActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    deleteActionButton: {
      flex: 1,
      borderRadius: borderRadius.md,
    },
  });
