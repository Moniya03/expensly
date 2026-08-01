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
import type { Category, CreateTransactionInput, VoiceExpenseDraft, VoiceExpenseResponse } from '../../types';
import { parseLocalDate, toLocalDateString } from '../../utils/date';

type Props = {
  visible: boolean;
  draft: VoiceExpenseDraft | null;
  transcription: string;
  parseMeta?: VoiceExpenseResponse['parse_meta'];
  isSaving?: boolean;
  errorMessage?: string | null;
  onSave: (transaction: CreateTransactionInput) => void | Promise<void>;
  onReRecord: () => void;
  onCancel: () => void;
};

function toDate(value?: string): Date {
  const fallback = new Date();
  if (!value) return fallback;

  const parsed = parseLocalDate(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export function VoiceExpenseConfirmationSheet({
  visible,
  draft,
  transcription,
  parseMeta,
  isSaving = false,
  errorMessage,
  onSave,
  onReRecord,
  onCancel,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date());
  const [errors, setErrors] = useState<{ amount?: string; category?: string }>({});

  useEffect(() => {
    if (!visible || !draft) return;

    setAmount(Number.isFinite(draft.amount) ? String(Math.round(draft.amount)) : '');
    setCategory(draft.category);
    setDescription(draft.description || '');
    setMerchant(draft.merchant || '');
    setDate(toDate(draft.transaction_date || draft.date));
    setErrors({});
  }, [visible, draft]);

  const transcriptPreview = useMemo(
    () => transcription.trim() || 'No transcript available',
    [transcription]
  );

  const validate = () => {
    const nextErrors: { amount?: string; category?: string } = {};
    const parsedAmount = parseInt(amount, 10);

    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = 'Enter a whole-rupee amount';
    }

    if (!category) {
      nextErrors.category = 'Select a category';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !draft) return;

    const merchantText = merchant.trim();
    const descriptionText = description.trim();

    await onSave({
      amount: parseInt(amount, 10),
      category: category!,
      description: descriptionText || merchantText || draft.description || 'Voice expense',
      merchant: merchantText || null,
      transaction_date: toLocalDateString(date),
      source: 'voice',
      voice_transcript: transcription.trim() || null,
    });
  };

  if (!draft) return null;

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
              <Text style={styles.title}>Confirm expense</Text>
              <Text style={styles.subtitle}>Review the parsed draft before saving.</Text>
            </View>

            {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              <AmountInput value={amount} onChangeValue={setAmount} error={errors.amount} integerOnly />
              <CategoryPicker selectedCategory={category} onSelectCategory={setCategory} error={errors.category} />
              <Input
                label="Description"
                placeholder="Add a short description"
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <Input
                label="Merchant"
                placeholder="Merchant (optional)"
                value={merchant}
                onChangeText={setMerchant}
              />
              <DatePicker value={date} onChange={setDate} />

              <View style={styles.transcriptCard}>
                <Text style={styles.sectionLabel}>Transcript</Text>
                <Text style={styles.transcriptText}>{transcriptPreview}</Text>
              </View>

              {parseMeta?.warnings?.length ? (
                <View style={styles.metaCard}>
                  <Text style={styles.metaLabel}>Review note</Text>
                  <Text style={styles.metaText}>{parseMeta.warnings.join(' • ')}</Text>
                </View>
              ) : null}

              <Pressable onPress={handleSave} disabled={isSaving} style={styles.saveWrapper}>
                <LinearGradient
                  colors={isSaving ? [colors.outlineVariant, colors.outlineVariant] : [colors.primary, colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButton}
                >
                  {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Save</Text>}
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
  metaCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  metaLabel: {
    marginBottom: spacing.xs,
    color: colors.onSurfaceVariant,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaText: {
    color: colors.onSurfaceVariant,
    fontSize: typography.fontSize.xs,
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
