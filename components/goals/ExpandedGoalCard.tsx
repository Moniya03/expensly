import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { Goal } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';
import { formatRupees } from '../../utils/currency';
import { parseLocalDate } from '../../utils/date';
import { getGoalMeta } from './goalMeta';
import { ProgressRing } from './ProgressRing';
import { GoalOrigin } from './GoalCard';
import { AmountInput } from '../ui/AmountInput';

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

type Props = {
  visible: boolean;
  goal: Goal | null;
  origin: GoalOrigin | null;
  isSaving: boolean;
  onClose: () => void;
  onSaveProgress: (amount: number) => void | Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
};

export function ExpandedGoalCard({ visible, goal, origin, isSaving, onClose, onSaveProgress, onEdit, onDelete }: Props) {
  const { width: screenW, height: screenH } = useWindowDimensions();

  const expandedW = Math.min(screenW - 48, 420);
  const expandedH = Math.min(screenH * 0.74, 600);
  const expandedX = (screenW - expandedW) / 2;
  const expandedY = (screenH - expandedH) / 2;

  const progress = useSharedValue(0); // 0..1 grow
  const contentOpacity = useSharedValue(0);
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (visible && origin) {
      progress.value = 0;
      contentOpacity.value = 0;
      setAdding(false);
      setAmount('');
      progress.value = withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) });
      contentOpacity.value = withDelay(160, withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }));
    }
  }, [visible, origin, progress, contentOpacity]);

  const shellStyle = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      left: origin ? origin.x + (expandedX - origin.x) * t : expandedX,
      top: origin ? origin.y + (expandedY - origin.y) * t : expandedY,
      width: origin ? origin.width + (expandedW - origin.width) * t : expandedW,
      height: origin ? origin.height + (expandedH - origin.height) * t : expandedH,
      borderRadius: 24 + (28 - 24) * t,
    };
  });

  const innerStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: 0.96 + 0.04 * contentOpacity.value }],
  }));

  const handleClose = () => {
    if (!origin) return onClose();
    contentOpacity.value = withTiming(0, { duration: 120 });
    progress.value = withTiming(
      0,
      { duration: 280, easing: Easing.in(Easing.cubic) },
      (finished) => { if (finished) runOnJS(onClose)(); }
    );
  };

  if (!goal) return null;

  const meta = getGoalMeta(goal.icon);
  const remaining = Math.max(goal.target_amount - goal.saved_amount, 0);
  const ringProgress = goal.target_amount > 0 ? Math.min(goal.saved_amount / goal.target_amount, 1) : 0;
  const percent = Math.round(ringProgress * 100);
  const deadline = goal.target_date
    ? parseLocalDate(goal.target_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'No target date';

  const quickAmount = QUICK_AMOUNTS.filter((q) => q <= remaining)[0] ?? QUICK_AMOUNTS[0];
  const validAmount = Number(amount) > 0 && Number(amount) <= remaining;

  const save = async () => {
    if (!validAmount || isSaving) return;
    await onSaveProgress(Number(amount));
    setAdding(false);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Pressable style={styles.scrim} onPress={handleClose} />
      <Animated.View style={[styles.shell, shellStyle]} pointerEvents="box-none">
        <Animated.View style={[styles.content, innerStyle]}>
          <View style={styles.contentInner}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconWrap, { backgroundColor: `${meta.accent}1F` }]}>
                <Ionicons name={meta.icon} size={22} color={meta.accent} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title} numberOfLines={1}>{goal.name}</Text>
                <Text style={styles.deadline}>{deadline}</Text>
              </View>
              <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            {/* Ring */}
            <View style={styles.ringSection}>
              <ProgressRing size={150} strokeWidth={12} progress={ringProgress} color={meta.accent} trackColor={`${meta.accent}1F`}>
                <View style={styles.ringCenter}>
                  <Text style={[styles.ringPercent, { color: meta.accent }]}>{percent}%</Text>
                  <Text style={styles.ringAmount}>{formatRupees(goal.saved_amount, { compact: true })} of {formatRupees(goal.target_amount, { compact: true })}</Text>
                </View>
              </ProgressRing>
            </View>

            {/* Stats or inline progress */}
            {adding ? (
              <View style={styles.addSection}>
                <AmountInput value={amount} onChangeValue={setAmount} integerOnly />
                <View style={styles.chipsRow}>
                  {QUICK_AMOUNTS.map((q) => (
                    <Pressable key={q} onPress={() => setAmount(String(q))} style={[styles.chip, amount === String(q) && styles.chipActive]}>
                      <Text style={[styles.chipText, amount === String(q) && styles.chipTextActive]}>{formatRupees(q, { showSymbol: false, compact: q >= 1000 })}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.addActions}>
                  <Pressable onPress={() => setAdding(false)} style={styles.cancelButton}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={save} disabled={!validAmount || isSaving} style={[styles.saveButton, (!validAmount || isSaving) && styles.saveDisabled]}>
                    {isSaving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.saveText}>Add</Text>}
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Saved</Text>
                  <Text style={styles.statValue}>{formatRupees(goal.saved_amount)}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Target</Text>
                  <Text style={styles.statValue}>{formatRupees(goal.target_amount)}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Remaining</Text>
                  <Text style={styles.statValue}>{formatRupees(remaining)}</Text>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {goal.is_completed ? (
                <View style={[styles.primaryButton, styles.completedButton]}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.surface} />
                  <Text style={styles.primaryText}>Goal completed</Text>
                </View>
              ) : adding ? null : (
                <Pressable onPress={() => setAdding(true)} style={styles.primaryButton}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.surface} />
                  <Text style={styles.primaryText}>Update progress</Text>
                </Pressable>
              )}
              {!adding && (
                <View style={styles.secondaryRow}>
                  <Pressable onPress={onEdit} style={styles.secondaryButton}>
                    <Ionicons name="create-outline" size={16} color={colors.onSurface} />
                    <Text style={styles.secondaryText}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={onDelete} style={[styles.secondaryButton, styles.dangerButton]}>
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <Text style={[styles.secondaryText, styles.dangerText]}>Delete</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4, 6, 12, 0.82)' },
  shell: { position: 'absolute', overflow: 'hidden', backgroundColor: colors.surfaceContainerHigh, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 28, elevation: 20 },
  content: { flex: 1 },
  contentInner: { flex: 1, padding: spacing.lg, justifyContent: 'space-between', gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: { width: 44, height: 44, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { color: colors.onSurface, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  deadline: { color: colors.onSurfaceVariant, fontSize: typography.fontSize.xs, marginTop: 2 },
  closeButton: { width: 34, height: 34, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  ringSection: { alignItems: 'center', paddingVertical: spacing.sm },
  ringCenter: { alignItems: 'center', gap: 2 },
  ringPercent: { fontSize: 34, fontWeight: typography.fontWeight.bold },
  ringAmount: { color: colors.onSurfaceVariant, fontSize: typography.fontSize.xs },
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: 4,
  },
  statLabel: { color: colors.onSurfaceVariant, fontSize: typography.fontSize.xs },
  statValue: { color: colors.onSurface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semiBold },
  addSection: { gap: spacing.sm },
  chipsRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: `${colors.primary}1F`, borderColor: colors.primary },
  chipText: { color: colors.onSurfaceVariant, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  chipTextActive: { color: colors.primary, fontWeight: typography.fontWeight.semiBold },
  addActions: { flexDirection: 'row', gap: spacing.sm },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: colors.onSurface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.medium },
  saveButton: {
    flex: 1.5,
    minHeight: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDisabled: { opacity: 0.45 },
  saveText: { color: colors.surface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semiBold },
  actions: { gap: spacing.sm },
  primaryButton: {
    minHeight: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  completedButton: { backgroundColor: colors.secondary, opacity: 0.9 },
  primaryText: { color: colors.surface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semiBold },
  secondaryRow: { flexDirection: 'row', gap: spacing.sm },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryText: { color: colors.onSurface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.medium },
  dangerButton: { backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  dangerText: { color: colors.error },
});
