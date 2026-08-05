import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { borderRadius, type Colors, spacing, typography, useColors } from '../../constants/theme';
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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

  // Cute pop entrance (timing, no bounce)
  const scale = useSharedValue(0.7);
  const translateY = useSharedValue(24);
  const opacity = useSharedValue(0);
  useEffect(() => {
    if (visible) {
      scale.value = 0.7;
      translateY.value = 24;
      opacity.value = 0;
      scale.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
      translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration: 150 });
    }
  }, [visible, scale, translateY, opacity]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const updateMutation = useUpdateTransaction(transaction?.id ?? '');
  const deleteMutation = useDeleteTransaction();

  const amountNumber = parseInt(amount, 10);
  const valid = amountNumber > 0 && category !== null;

  const handleSave = async () => {
    if (!transaction || !valid || updateMutation.isPending) return;
    try {
      await updateMutation.mutateAsync({
        amount: amountNumber,
        category: category!,
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.scrim} onPress={onClose} />

        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Edit expense</Text>
              <Text style={styles.subtitle}>Tap any field to refine it.</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
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
              error={amount !== '' && amountNumber <= 0 ? 'Enter a whole-rupee amount' : undefined}
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
              <Text style={styles.deleteConfirmText}>Delete this expense?</Text>
              <View style={styles.deleteConfirmActions}>
                <Pressable
                  onPress={() => setConfirmingDelete(false)}
                  style={[styles.deleteActionButton, styles.cancelButton]}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  disabled={deleteMutation.isPending}
                  style={[styles.deleteActionButton, styles.confirmDeleteButton]}
                >
                  {deleteMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.onAccent} />
                  ) : (
                    <Text style={styles.confirmDeleteText}>Delete</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.actions}>
              <Pressable
                onPress={() => setConfirmingDelete(true)}
                style={styles.deleteRow}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={15} color={colors.error} />
                <Text style={styles.deleteText}>Delete expense</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={!valid || updateMutation.isPending}
                style={[styles.saveButton, (!valid || updateMutation.isPending) && styles.saveDisabled]}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color={colors.onAccent} />
                ) : (
                  <Text style={styles.saveText}>Save changes</Text>
                )}
              </Pressable>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(4, 6, 12, 0.82)',
    },
    card: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '88%',
      backgroundColor: colors.surfaceContainerHigh,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      padding: spacing.lg,
      gap: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 16,
    },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.full,
      backgroundColor: `${colors.primary}1F`,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    headerText: { flex: 1 },
    title: {
      color: colors.onSurface,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
    },
    subtitle: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.xs,
      marginTop: 2,
      lineHeight: 16,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    form: { gap: spacing.sm, paddingBottom: spacing.sm },
    actions: { gap: spacing.sm },
    deleteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.xs,
    },
    deleteText: {
      color: colors.error,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
    },
    saveButton: {
      minHeight: 52,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveDisabled: { opacity: 0.45 },
    saveText: {
      color: colors.onAccent,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
    deleteConfirm: {
      backgroundColor: `${colors.error}14`,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: `${colors.error}40`,
      padding: spacing.md,
      gap: spacing.sm,
    },
    deleteConfirmText: {
      color: colors.onSurface,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semiBold,
    },
    deleteConfirmActions: { flexDirection: 'row', gap: spacing.sm },
    deleteActionButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: { backgroundColor: colors.surfaceContainerHigh },
    cancelButtonText: {
      color: colors.onSurface,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semiBold,
    },
    confirmDeleteButton: { backgroundColor: colors.error },
    confirmDeleteText: {
      color: colors.onAccent,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semiBold,
    },
  });
