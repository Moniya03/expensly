import React, { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AmountInput } from '../ui/AmountInput';
import { CategoryPicker } from '../ui/CategoryPicker';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { SwipeDeckCard, type SwipeDeckCardHandle } from './SwipeDeckCard';
import {
  borderRadius,
  spacing,
  typography,
  useColors,
  type Colors,
} from '../../constants/theme';
import { categories } from '../../constants/categories';
import type {
  Category,
  CreateTransactionInput,
  VoiceExpenseDraft,
} from '../../types';
import { formatDate, parseLocalDate, toLocalDateString } from '../../utils/date';
import { formatRupees } from '../../utils/currency';

type Props = {
  visible: boolean;
  drafts: VoiceExpenseDraft[];
  transcription: string;
  onSaveSingle: (transaction: CreateTransactionInput) => Promise<void>;
  onCancel: () => void;
};

interface DraftItem {
  amount: string;
  category: Category | null;
  description: string;
  merchant: string;
  date: Date;
}

type FieldKey = 'amount' | 'category' | 'description' | 'merchant' | 'date';

const FLY_OFF_MS = 200;
const ERROR_FLASH_MS = 2800;
const PEEK_OFFSET = 14;
const CARD_ENTER_MS = 220;

function toDate(value?: string): Date {
  const fallback = new Date();
  if (!value) return fallback;
  const parsed = parseLocalDate(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function buildTransaction(
  item: DraftItem,
  transcription: string
): CreateTransactionInput | null {
  const parsed = parseInt(item.amount, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  if (!item.category) return null;
  const merchant = item.merchant.trim();
  const description = item.description.trim();
  return {
    amount: parsed,
    category: item.category,
    description: description || merchant || 'Voice expense',
    merchant: merchant || null,
    transaction_date: toLocalDateString(item.date),
    source: 'voice',
    voice_transcript: transcription.trim() || null,
  };
}

/** Slides the next card in from the peek position when the deck advances. */
function CardEntrance({ children }: { children: ReactNode }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: CARD_ENTER_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + 0.4 * progress.value,
    transform: [
      { translateY: (1 - progress.value) * PEEK_OFFSET },
      { scale: 0.96 + 0.04 * progress.value },
    ],
  }));

  return <Animated.View style={entranceStyle}>{children}</Animated.View>;
}

export function VoiceExpenseConfirmationSheet({
  visible,
  drafts,
  transcription,
  onSaveSingle,
  onCancel,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: screenW } = useWindowDimensions();
  const cardWidth = Math.min(screenW - 48, 340);

  const [items, setItems] = useState<DraftItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<FieldKey | null>(null);
  const [confirmingReject, setConfirmingReject] = useState(false);

  const cardRef = useRef<SwipeDeckCardHandle>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // (Re)initialise when the sheet becomes visible with non-empty drafts.
  useEffect(() => {
    if (!visible) return;
    if (drafts.length === 0) {
      onCancel();
      return;
    }
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    if (errorTimer.current) {
      clearTimeout(errorTimer.current);
      errorTimer.current = null;
    }
    setItems(
      drafts.map((d) => ({
        amount: Number.isFinite(d.amount) ? String(Math.round(d.amount)) : '',
        category: d.category,
        description: d.description || '',
        merchant: d.merchant || '',
        date: toDate(d.transaction_date || d.date),
      }))
    );
    setCurrentIndex(0);
    setAcceptedCount(0);
    setRejectedCount(0);
    setIsSaving(false);
    setSaveError(null);
    setEditingField(null);
    setConfirmingReject(false);
  }, [visible, drafts]);
  // onCancel omitted from deps: only fired at open time when drafts is empty (stable enough).

  // Cleanup pending timers on unmount.
  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, []);

  const topItem = items[currentIndex];
  const peekItem = items[currentIndex + 1];
  const allDecided =
    (items.length === 0 && acceptedCount + rejectedCount > 0) ||
    (items.length > 0 && currentIndex >= items.length);
  const cardDisabled = isSaving || confirmingReject || editingField !== null;

  const updateTopItem = (patch: Partial<DraftItem>) => {
    setItems((prev) =>
      prev.map((it, i) => (i === currentIndex ? { ...it, ...patch } : it))
    );
  };

  const flashError = (message: string) => {
    setSaveError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => {
      errorTimer.current = null;
      setSaveError(null);
    }, ERROR_FLASH_MS);
  };

  const handleSwipedRight = async (): Promise<boolean> => {
    if (!topItem) return false;
    const input = buildTransaction(topItem, transcription);
    if (!input) {
      const parsed = parseInt(topItem.amount, 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        flashError('Enter an amount first');
      } else if (!topItem.category) {
        flashError('Select a category first');
      }
      return false;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSaveSingle(input);
      setAcceptedCount((c) => c + 1);
      setEditingField(null);
      // Keep isSaving=true through the fly-off so the card stays disabled.
      advanceTimer.current = setTimeout(() => {
        advanceTimer.current = null;
        setCurrentIndex((i) => i + 1);
        setIsSaving(false);
      }, FLY_OFF_MS);
      return true;
    } catch {
      setIsSaving(false);
      flashError("Couldn't save — try again");
      return false;
    }
  };

  const handleSwipedLeft = () => {
    setConfirmingReject(true);
  };

  const handleCancelReject = () => {
    setConfirmingReject(false);
    cardRef.current?.retract();
  };

  const handleConfirmReject = () => {
    setConfirmingReject(false);
    setRejectedCount((c) => c + 1);
    setItems((prev) => prev.filter((_, i) => i !== currentIndex));
    setEditingField(null);
  };

  if (!visible) return null;
  if (drafts.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      {/* RNGH requires GestureHandlerRootView inside Modal content on Android
          or pan gestures never activate (touches fall through to Pressables). */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}
        >
          {allDecided ? (
            <SummaryView
              accepted={acceptedCount}
              rejected={rejectedCount}
              total={items.length}
              onClose={onCancel}
              cardWidth={cardWidth}
              styles={styles}
            />
          ) : (
            <>
              <View style={styles.hintPill}>
                <Text style={styles.hintText}>
                  Swipe right to accept · left to reject
                </Text>
              </View>

              {saveError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{saveError}</Text>
                </View>
              ) : null}

              <View style={styles.deck}>
                {peekItem ? (
                  <View style={styles.peekCardWrapper} pointerEvents="none">
                    <PeekCard
                      item={peekItem}
                      index={currentIndex + 2}
                      total={items.length}
                      cardWidth={cardWidth}
                      styles={styles}
                    />
                  </View>
                ) : null}
                {topItem ? (
                  <CardEntrance key={currentIndex}>
                    <SwipeDeckCard
                      ref={cardRef}
                      disabled={cardDisabled}
                      onSwipedRight={handleSwipedRight}
                      onSwipedLeft={handleSwipedLeft}
                      style={[styles.cardFrame, { width: cardWidth }]}
                    >
                      <View
                        style={styles.cardBody}
                        pointerEvents={isSaving ? 'none' : 'auto'}
                      >
                        <View style={styles.cardTopRow}>
                          <Text style={styles.expenseLabel}>
                            Expense {currentIndex + 1} of {items.length}
                          </Text>
                          {isSaving ? (
                            <ActivityIndicator
                              size="small"
                              color={colors.primary}
                              style={styles.cardSpinner}
                            />
                          ) : null}
                        </View>

                        {editingField === 'amount' ? (
                          <AmountInput
                            value={topItem.amount}
                            onChangeValue={(v) => updateTopItem({ amount: v })}
                            integerOnly
                          />
                        ) : (
                          <Pressable
                            onPress={() => setEditingField('amount')}
                            style={({ pressed }) => [styles.bigAmountRow, pressed && styles.pressed]}
                          >
                            <Text style={styles.bigAmount}>
                              {topItem.amount
                                ? formatRupees(parseInt(topItem.amount, 10) || 0)
                                : 'Rs.0'}
                            </Text>
                            <MaterialCommunityIcons
                              name="pencil-outline"
                              size={14}
                              color={colors.onSurfaceVariant}
                            />
                          </Pressable>
                        )}

                        {editingField === 'category' ? (
                          <CategoryPicker
                            selectedCategory={topItem.category}
                            onSelectCategory={(c) => {
                              updateTopItem({ category: c });
                              setEditingField(null);
                            }}
                          />
                        ) : (
                          <Pressable
                            onPress={() => setEditingField('category')}
                            style={({ pressed }) => [styles.fieldRow, pressed && styles.pressed]}
                          >
                            {topItem.category ? (
                              <CategoryChip category={topItem.category} styles={styles} />
                            ) : (
                              <Text style={styles.fieldPlaceholder}>
                                Tap to pick a category
                              </Text>
                            )}
                          </Pressable>
                        )}

                        {editingField === 'description' ? (
                          <Input
                            placeholder="Add a short description"
                            value={topItem.description}
                            onChangeText={(v) => updateTopItem({ description: v })}
                            multiline
                            autoFocus
                          />
                        ) : (
                          <Pressable
                            onPress={() => setEditingField('description')}
                            style={({ pressed }) => [styles.fieldRow, pressed && styles.pressed]}
                          >
                            <MaterialCommunityIcons
                              name="text-short"
                              size={16}
                              color={colors.onSurfaceVariant}
                            />
                            <Text
                              style={topItem.description ? styles.fieldText : styles.fieldPlaceholder}
                              numberOfLines={1}
                            >
                              {topItem.description || 'Add a description'}
                            </Text>
                          </Pressable>
                        )}

                        {editingField === 'date' ? (
                          <DatePicker
                            value={topItem.date}
                            onChange={(d) => updateTopItem({ date: d })}
                          />
                        ) : (
                          <Pressable
                            onPress={() => setEditingField('date')}
                            style={({ pressed }) => [styles.fieldRow, pressed && styles.pressed]}
                          >
                            <MaterialCommunityIcons
                              name="calendar-outline"
                              size={16}
                              color={colors.onSurfaceVariant}
                            />
                            <Text style={styles.fieldText}>
                              {formatDate(topItem.date, 'short')}
                            </Text>
                          </Pressable>
                        )}

                        {editingField === 'merchant' ? (
                          <Input
                            label="Merchant"
                            placeholder="Merchant (optional)"
                            value={topItem.merchant}
                            onChangeText={(v) => updateTopItem({ merchant: v })}
                            autoFocus
                          />
                        ) : (
                          <Pressable
                            onPress={() => setEditingField('merchant')}
                            style={({ pressed }) => [styles.fieldRow, pressed && styles.pressed]}
                          >
                            <MaterialCommunityIcons
                              name="store-outline"
                              size={16}
                              color={colors.onSurfaceVariant}
                            />
                            <Text
                              style={topItem.merchant ? styles.fieldText : styles.fieldPlaceholder}
                              numberOfLines={1}
                            >
                              {topItem.merchant || 'Add merchant (optional)'}
                            </Text>
                          </Pressable>
                        )}

                        {editingField !== null ? (
                          <Pressable
                            onPress={() => setEditingField(null)}
                            style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
                          >
                            <Text style={styles.doneButtonText}>Done</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </SwipeDeckCard>
                  </CardEntrance>
                ) : null}
              </View>
            </>
          )}
        </KeyboardAvoidingView>

        {confirmingReject ? (
          <View style={styles.confirmOverlay}>
            <Pressable style={styles.confirmBackdrop} onPress={handleCancelReject} />
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>Reject this expense?</Text>
              <Text style={styles.confirmBody}>It won't be saved.</Text>
              <View style={styles.confirmActions}>
                <Pressable
                  onPress={handleCancelReject}
                  style={({ pressed }) => [styles.confirmCancel, pressed && styles.pressed]}
                >
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmReject}
                  style={({ pressed }) => [styles.confirmReject, pressed && styles.pressed]}
                >
                  <Text style={styles.confirmRejectText}>Reject</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function PeekCard({
  item,
  index,
  total,
  cardWidth,
  styles,
}: {
  item: DraftItem;
  index: number;
  total: number;
  cardWidth: number;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={[styles.cardFrame, { width: cardWidth }]}>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.expenseLabel}>
            Expense {index} of {total}
          </Text>
        </View>
        <View style={styles.bigAmountRow}>
          <Text style={styles.bigAmount}>
            {item.amount ? formatRupees(parseInt(item.amount, 10) || 0) : 'Rs.0'}
          </Text>
        </View>
        <View style={styles.fieldRow}>
          {item.category ? (
            <CategoryChip category={item.category} styles={styles} />
          ) : (
            <Text style={styles.fieldPlaceholder}>Tap to pick a category</Text>
          )}
        </View>
        <View style={styles.fieldRow}>
          <MaterialCommunityIcons
            name="text-short"
            size={16}
            color={styles.fieldIcon.color}
          />
          <Text
            style={item.description ? styles.fieldText : styles.fieldPlaceholder}
            numberOfLines={1}
          >
            {item.description || 'Add a description'}
          </Text>
        </View>
        <View style={styles.fieldRow}>
          <MaterialCommunityIcons
            name="calendar-outline"
            size={16}
            color={styles.fieldIcon.color}
          />
          <Text style={styles.fieldText}>{formatDate(item.date, 'short')}</Text>
        </View>
      </View>
    </View>
  );
}

function CategoryChip({
  category,
  styles,
}: {
  category: Category;
  styles: ReturnType<typeof createStyles>;
}) {
  const config = categories[category];
  if (!config) return null;
  return (
    <View style={styles.chip}>
      <View
        style={[
          styles.chipIconContainer,
          { backgroundColor: config.iconBackgroundColor || `${config.color}22` },
        ]}
      >
        <MaterialCommunityIcons
          name={config.iconName as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
          size={14}
          color={config.iconColor}
        />
      </View>
      <Text style={[styles.chipText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function SummaryView({
  accepted,
  rejected,
  total,
  onClose,
  cardWidth,
  styles,
}: {
  accepted: number;
  rejected: number;
  total: number;
  onClose: () => void;
  cardWidth: number;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={[styles.summaryCard, { width: cardWidth }]}>
      <MaterialCommunityIcons
        name="check-decagram"
        size={56}
        color={styles.summaryTitle.color}
      />
      <Text style={styles.summaryTitle}>
        {accepted > 0
          ? `${accepted} expense${accepted === 1 ? '' : 's'} saved`
          : 'Nothing saved'}
      </Text>
      {rejected > 0 ? (
        <Text style={styles.summarySubtitle}>
          {rejected} expense{rejected === 1 ? '' : 's'} rejected
        </Text>
      ) : null}
      <Text style={styles.summaryBody}>
        {total === 1
          ? 'Your voice note is done.'
          : `Processed ${total} expenses from your voice note.`}
      </Text>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [styles.summaryCloseButton, pressed && styles.pressed]}
      >
        <Text style={styles.summaryCloseButtonText}>Close</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
    },
    keyboardAvoidingView: {
      width: '100%',
      alignItems: 'center',
    },
    hintPill: {
      marginBottom: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs + 2,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    hintText: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
    },
    errorBanner: {
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: 'rgba(255,113,108,0.15)',
    },
    errorBannerText: {
      color: colors.error,
      fontSize: typography.fontSize.sm,
    },
    deck: {
      position: 'relative',
      minHeight: 250,
      justifyContent: 'center',
    },
    peekCardWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: -PEEK_OFFSET,
      bottom: -PEEK_OFFSET,
      transform: [{ scale: 0.96 }],
      opacity: 0.65,
    },
    cardFrame: {
      backgroundColor: colors.surfaceContainer,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    cardBody: {
      padding: spacing.lg,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    cardSpinner: {
      marginLeft: spacing.sm,
    },
    expenseLabel: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      textAlign: 'center',
    },
    bigAmountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surfaceContainerHigh,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    bigAmount: {
      fontSize: typography.fontSize.xxxl,
      fontWeight: typography.fontWeight.bold,
      color: colors.onSurface,
      letterSpacing: -0.5,
    },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surfaceContainerHigh,
      marginBottom: spacing.xs,
      gap: spacing.sm,
    },
    fieldIcon: {
      color: colors.onSurfaceVariant,
    },
    fieldText: {
      flex: 1,
      fontSize: typography.fontSize.md,
      color: colors.onSurface,
    },
    fieldPlaceholder: {
      flex: 1,
      fontSize: typography.fontSize.md,
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceContainerHigh,
      gap: spacing.sm,
    },
    chipIconContainer: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semiBold,
    },
    doneButton: {
      alignSelf: 'center',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
    },
    doneButtonText: {
      color: '#FFFFFF',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semiBold,
    },
    summaryCard: {
      alignItems: 'center',
      padding: spacing.xl,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.surfaceContainer,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    summaryTitle: {
      color: colors.primary,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    summarySubtitle: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.md,
      textAlign: 'center',
    },
    summaryBody: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.sm,
      textAlign: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    summaryCloseButton: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
    },
    summaryCloseButtonText: {
      color: '#FFFFFF',
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
    confirmOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    confirmCard: {
      width: '80%',
      maxWidth: 320,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surfaceContainerHighest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    confirmTitle: {
      color: colors.onSurface,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semiBold,
      textAlign: 'center',
    },
    confirmBody: {
      marginTop: spacing.xs,
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.sm,
      textAlign: 'center',
    },
    confirmActions: {
      flexDirection: 'row',
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    confirmCancel: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      alignItems: 'center',
    },
    confirmCancelText: {
      color: colors.onSurface,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.medium,
    },
    confirmReject: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.error,
      alignItems: 'center',
    },
    confirmRejectText: {
      color: '#FFFFFF',
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
    pressed: {
      opacity: 0.7,
    },
  });
