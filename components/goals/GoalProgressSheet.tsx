import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Goal } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';
import { AmountInput } from '../ui/AmountInput';
import { formatRupees } from '../../utils/currency';

type Props = {
  visible: boolean;
  goal: Goal | null;
  isSaving?: boolean;
  onSave: (amount: number) => void | Promise<void>;
  onClose: () => void;
};

export function GoalProgressSheet({ visible, goal, isSaving = false, onSave, onClose }: Props) {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (!visible) return;
    setAmount('');
  }, [visible, goal?.id]);

  if (!goal) return null;

  const handleSave = async () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    await onSave(parsed);
  };

  const remaining = Math.max(goal.target_amount - goal.saved_amount, 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoidingView}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>Update progress</Text>
              <Text style={styles.subtitle}>{goal.name}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Saved {formatRupees(goal.saved_amount)} of {formatRupees(goal.target_amount)}</Text>
                <Text style={styles.summaryValue}>{formatRupees(remaining)} remaining</Text>
              </View>

              <AmountInput value={amount} onChangeValue={setAmount} integerOnly />

              <Pressable onPress={handleSave} disabled={isSaving} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed, isSaving && styles.disabled]}>
                {isSaving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.saveText}>Save progress</Text>}
              </Pressable>

              <Pressable onPress={onClose} disabled={isSaving} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed, isSaving && styles.disabled]}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  keyboardAvoidingView: { width: '100%' },
  sheet: {
    backgroundColor: colors.surfaceContainerHigh,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    maxHeight: '90%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.outlineVariant,
    marginBottom: spacing.sm,
  },
  header: { marginBottom: spacing.sm },
  title: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.onSurface },
  subtitle: { marginTop: 4, fontSize: typography.fontSize.sm, color: colors.onSurfaceVariant },
  content: { paddingBottom: spacing.md, gap: spacing.md },
  summaryCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: 6,
  },
  summaryLabel: { color: colors.onSurfaceVariant, fontSize: typography.fontSize.sm },
  summaryValue: { color: colors.onSurface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semiBold },
  saveButton: {
    minHeight: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: colors.surface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semiBold },
  cancelButton: {
    minHeight: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: colors.onSurface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.medium },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
});
