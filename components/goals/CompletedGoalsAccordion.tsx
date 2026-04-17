import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';
import { GoalCard } from './GoalCard';

export function CompletedGoalsAccordion({ goals, onGoalPress, defaultOpen = false }: { goals: Goal[]; onGoalPress?: (goal: Goal) => void; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  if (!goals.length) return null;

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.header} onPress={() => setOpen((v) => !v)}>
        <Text style={styles.title}>Completed goals</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{goals.length}</Text></View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.onSurfaceVariant} />
      </Pressable>
      {open ? <View style={styles.list}>{goals.map((goal) => <GoalCard key={goal.id} goal={goal} onPress={onGoalPress ? () => onGoalPress(goal) : undefined} />)}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { flex: 1, color: colors.onSurface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semiBold },
  badge: { minWidth: 28, paddingHorizontal: 8, height: 24, borderRadius: 999, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.onSurfaceVariant, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semiBold },
  list: { padding: spacing.md, gap: spacing.md, paddingTop: 0 },
});
