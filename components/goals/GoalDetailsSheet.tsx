import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';
import { formatRupees } from '../../utils/currency';
import { parseLocalDate } from '../../utils/date';

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  'briefcase-outline': 'briefcase-outline',
  'airplane-outline': 'airplane-outline',
  'car-sport-outline': 'car-sport-outline',
  'home-outline': 'home-outline',
  'school-outline': 'school-outline',
  'medkit-outline': 'medkit-outline',
  'heart-outline': 'heart-outline',
  'film-outline': 'film-outline',
};

type Props = {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
  onUpdateProgress: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function GoalDetailsSheet({ visible, goal, onClose, onUpdateProgress, onEdit, onDelete }: Props) {
  if (!goal) return null;

  const Icon = iconMap[goal.icon] || 'briefcase-outline';
  const remaining = Math.max(goal.target_amount - goal.saved_amount, 0);
  const progress = goal.target_amount > 0 ? Math.min(goal.saved_amount / goal.target_amount, 1) : 0;
  const deadline = goal.target_date
    ? parseLocalDate(goal.target_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'No target date';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.iconWrap}>
              <Ionicons name={Icon} size={24} color={colors.onSurface} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>{goal.name}</Text>
              <Text style={styles.subtitle}>{deadline}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.onSurface} />
            </Pressable>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(progress * 100, goal.is_completed ? 100 : 8)}%` }]} />
            </View>
          </View>

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
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={styles.statValue}>{goal.is_completed ? 'Completed' : 'Active'}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            {goal.is_completed ? (
              <View style={[styles.primaryButton, styles.primaryButtonDisabled]}>
                <Text style={styles.primaryText}>Goal completed</Text>
              </View>
            ) : (
              <Pressable style={styles.primaryButton} onPress={onUpdateProgress}>
                <Text style={styles.primaryText}>Update progress</Text>
              </Pressable>
            )}
            <View style={styles.secondaryRow}>
              <Pressable style={styles.secondaryButton} onPress={onEdit}>
                <Text style={styles.secondaryText}>Edit goal</Text>
              </Pressable>
              <Pressable style={[styles.secondaryButton, styles.dangerButton]} onPress={onDelete}>
                <Text style={[styles.secondaryText, styles.dangerText]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  title: { color: colors.onSurface, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  subtitle: { color: colors.onSurfaceVariant, fontSize: typography.fontSize.sm },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: spacing.sm,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { color: colors.onSurfaceVariant, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  percent: { color: colors.secondary, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: colors.surfaceContainerHigh, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.primary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
    width: '48%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: 6,
  },
  statLabel: { color: colors.onSurfaceVariant, fontSize: typography.fontSize.xs },
  statValue: { color: colors.onSurface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semiBold },
  actions: { gap: spacing.sm, paddingTop: spacing.xs },
  primaryButton: {
    minHeight: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryText: { color: colors.surface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semiBold },
  secondaryRow: { flexDirection: 'row', gap: spacing.sm },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: colors.onSurface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.medium },
  dangerButton: { backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  dangerText: { color: colors.error },
});
