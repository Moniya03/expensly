import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AmountInput } from '../ui/AmountInput';
import { CategoryPicker } from '../ui/CategoryPicker';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { borderRadius, spacing, typography, useColors, type Colors } from '../../constants/theme';
import type { Category, CreateTransactionInput, VoiceExpenseDraft } from '../../types';
import { parseLocalDate, toLocalDateString } from '../../utils/date';

type Props = {
  visible: boolean;
  drafts: VoiceExpenseDraft[];
  transcription: string;
  isSaving?: boolean;
  errorMessage?: string | null;
  onSave: (transactions: CreateTransactionInput[]) => void | Promise<void>;
  onRemoveDraft?: (index: number) => void;
  onReRecord: () => void;
  onCancel: () => void;
};

interface DraftItem {
  amount: string;
  category: Category | null;
  description: string;
  merchant: string;
  date: Date;
}

interface DraftErrors {
  amount?: string;
  category?: string;
}

function toDate(value?: string): Date {
  const fallback = new Date();
  if (!value) return fallback;

  const parsed = parseLocalDate(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export function VoiceExpenseConfirmationSheet({
  visible,
  drafts,
  transcription,
  isSaving = false,
  errorMessage,
  onSave,
  onRemoveDraft,
  onReRecord,
  onCancel,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [items, setItems] = useState<DraftItem[]>([]);
  const [errors, setErrors] = useState<DraftErrors[]>([]);

  useEffect(() => {
    if (!visible || !drafts.length) return;

    setItems(
      drafts.map((draft) => ({
        amount: Number.isFinite(draft.amount) ? String(Math.round(draft.amount)) : '',
        category: draft.category,
        description: draft.description || '',
        merchant: draft.merchant || '',
        date: toDate(draft.transaction_date || draft.date),
      }))
    );
    setErrors(drafts.map(() => ({})));
  }, [visible, drafts]);

  const updateItem = (index: number, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const updateError = (index: number, patch: Partial<DraftErrors>) => {
    setErrors((prev) => prev.map((err, i) => (i === index ? { ...err, ...patch } : err)));
  };

  const transcriptPreview = useMemo(
    () => transcription.trim() || 'No transcript available',
    [transcription]
  );

  const validateAll = (): boolean => {
    let valid = true;
    const nextErrors = items.map((item) => {
      const err: DraftErrors = {};
      const parsedAmount = parseInt(item.amount, 10);

      if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
        err.amount = 'Enter a whole-rupee amount';
      }

      if (!item.category) {
        err.category = 'Select a category';
      }

      if (Object.keys(err).length > 0) valid = false;
      return err;
    });
    setErrors(nextErrors);
    return valid;
  };

  const handleSave = async () => {
    if (!validateAll()) return;

    const transactions: CreateTransactionInput[] = items.map((item) => {
      const merchantText = item.merchant.trim();
      const descriptionText = item.description.trim();

      return {
        amount: parseInt(item.amount, 10),
        category: item.category!,
        description: descriptionText || merchantText || 'Voice expense',
        merchant: merchantText || null,
        transaction_date: toLocalDateString(item.date),
        source: 'voice',
        voice_transcript: transcription.trim() || null,
      };
    });

    await onSave(transactions);
  };

  if (!drafts.length) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}
        >
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>
                {items.length > 1 ? `Confirm ${items.length} expenses` : 'Confirm expense'}
              </Text>
              <Text style={styles.subtitle}>
                {items.length > 1
                  ? 'Review each expense before saving them all.'
                  : 'Review the parsed draft before saving.'}
              </Text>
            </View>

            {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              {items.map((item, index) => (
                <View key={index} style={styles.draftCard}>
                  <View style={styles.draftHeader}>
                    <Text style={styles.draftIndex}>Expense {index + 1}</Text>
                    {items.length > 1 && onRemoveDraft && (
                      <Pressable onPress={() => onRemoveDraft(index)} hitSlop={8}>
                        <Text style={styles.removeText}>Remove</Text>
                      </Pressable>
                    )}
                  </View>

                  <AmountInput
                    value={item.amount}
                    onChangeValue={(value) => updateItem(index, { amount: value })}
                    error={errors[index]?.amount}
                    integerOnly
                  />
                  <CategoryPicker
                    selectedCategory={item.category}
                    onSelectCategory={(category) => {
                      updateItem(index, { category });
                      updateError(index, { category: undefined });
                    }}
                    error={errors[index]?.category}
                  />
                  <Input
                    label="Description"
                    placeholder="Add a short description"
                    value={item.description}
                    onChangeText={(value) => updateItem(index, { description: value })}
                    multiline
                  />
                  <Input
                    label="Merchant"
                    placeholder="Merchant (optional)"
                    value={item.merchant}
                    onChangeText={(value) => updateItem(index, { merchant: value })}
                  />
                  <DatePicker
                    value={item.date}
                    onChange={(date) => updateItem(index, { date })}
                  />
                </View>
              ))}

              <View style={styles.transcriptCard}>
                <Text style={styles.sectionLabel}>Transcript</Text>
                <Text style={styles.transcriptText}>{transcriptPreview}</Text>
              </View>

              <Pressable onPress={handleSave} disabled={isSaving} style={styles.saveWrapper}>
                <LinearGradient
                  colors={isSaving ? [colors.outlineVariant, colors.outlineVariant] : [colors.primary, colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButton}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.saveText}>
                      {items.length > 1 ? `Save all (${items.length})` : 'Save'}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>

              <View style={styles.actionRow}>
                <Pressable
                  onPress={onReRecord}
                  disabled={isSaving}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, isSaving && styles.disabled]}
                >
                  <Text style={styles.secondaryText}>Re-record</Text>
                </Pressable>
                <Pressable
                  onPress={onCancel}
                  disabled={isSaving}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, isSaving && styles.disabled]}
                >
                  <Text style={styles.secondaryText}>Cancel</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  keyboardAvoidingView: {
    width: '100%',
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
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
  subtitle: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceVariant,
  },
  errorBanner: {
    marginBottom: spacing.sm,
    color: colors.error,
    fontSize: typography.fontSize.sm,
  },
  content: {
    paddingBottom: spacing.md,
  },
  draftCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  draftIndex: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  removeText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  transcriptCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceVariant,
    fontWeight: typography.fontWeight.medium,
  },
  transcriptText: {
    color: colors.onSurface,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  saveWrapper: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  saveButton: {
    minHeight: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.onSurface,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
