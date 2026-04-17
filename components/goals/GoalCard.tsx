import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

export function GoalCard({ goal, onPress }: { goal: Goal; onPress?: () => void }) {
  const remaining = Math.max(goal.target_amount - goal.saved_amount, 0);
  const progress = goal.target_amount > 0 ? Math.min(goal.saved_amount / goal.target_amount, 1) : 0;
  const Icon = iconMap[goal.icon] || 'briefcase-outline';
  const deadline = goal.target_date ? parseLocalDate(goal.target_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name={Icon} size={20} color={colors.onSurface} />
        </View>
        <View style={styles.meta}>
          <Text style={styles.name} numberOfLines={1}>{goal.name}</Text>
          <Text style={styles.deadline}>{deadline}</Text>
        </View>
        <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(progress * 100, goal.is_completed ? 100 : 8)}%` }]} />
      </View>

      <View style={styles.statsRow}>
        <View>
          <Text style={styles.statLabel}>Saved</Text>
          <Text style={styles.statValue}>{formatRupees(goal.saved_amount)}</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>Target</Text>
          <Text style={styles.statValue}>{formatRupees(goal.target_amount)}</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={styles.statValue}>{formatRupees(remaining)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    gap: spacing.md,
  },
  pressed: { opacity: 0.92 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1 },
  name: { color: colors.onSurface, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semiBold },
  deadline: { color: colors.onSurfaceVariant, fontSize: typography.fontSize.xs, marginTop: 2 },
  percent: { color: colors.secondary, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: colors.surfaceContainer, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.primary },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { color: colors.onSurfaceVariant, fontSize: typography.fontSize.xs, marginBottom: 4 },
  statValue: { color: colors.onSurface, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold },
});
