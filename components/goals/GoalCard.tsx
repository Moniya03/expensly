import React, { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Goal } from '../../types';
import { spacing, borderRadius, typography, useColors, type Colors } from '../../constants/theme';
import { formatRupees } from '../../utils/currency';
import { parseLocalDate } from '../../utils/date';
import { getGoalMeta } from './goalMeta';
import { useGoalIcons } from '../../hooks/useGoalIcons';
import { ProgressRing } from './ProgressRing';

export type GoalOrigin = { x: number; y: number; width: number; height: number };

const deadlineLabel = (goal: Goal) =>
  goal.target_date
    ? parseLocalDate(goal.target_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No deadline';

export function GoalCard({ goal, onOpen }: { goal: Goal; onOpen?: (origin: GoalOrigin) => void }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const ref = useRef<View>(null);
  const { data: customIcons } = useGoalIcons();
  const meta = getGoalMeta(goal.icon, customIcons);
  const remaining = Math.max(goal.target_amount - goal.saved_amount, 0);
  const progress = goal.target_amount > 0 ? Math.min(goal.saved_amount / goal.target_amount, 1) : 0;
  const percent = Math.round(progress * 100);

  const wiggle = useSharedValue(0);
  const wiggleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wiggle.value}deg` }],
  }));

  const handlePress = () => {
    ref.current?.measureInWindow((x, y, width, height) => {
      onOpen?.({ x, y, width, height });
    });
    wiggle.value = withSequence(
      withTiming(-8, { duration: 70 }),
      withTiming(7, { duration: 70 }),
      withTiming(-4, { duration: 70 }),
      withTiming(0, { duration: 70 })
    );
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.shadow, pressed && styles.pressed]}>
      <View ref={ref} collapsable={false}>
        <LinearGradient colors={meta.tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <View style={styles.topRow}>
            <Animated.View style={[styles.iconWrap, { backgroundColor: `${meta.accent}1F` }, wiggleStyle]}>
              <Ionicons name={meta.icon} size={20} color={meta.accent} />
            </Animated.View>
            <View style={styles.meta}>
              <Text style={styles.name} numberOfLines={1}>{goal.name}</Text>
              <Text style={styles.deadline}>{deadlineLabel(goal)}</Text>
            </View>
            <ProgressRing size={56} strokeWidth={5} progress={progress} color={meta.accent} trackColor={`${meta.accent}22`}>
              <Text style={[styles.percent, { color: meta.accent }]}>{percent}%</Text>
            </ProgressRing>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Saved</Text>
              <Text style={styles.statValue}>{formatRupees(goal.saved_amount)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Target</Text>
              <Text style={styles.statValue}>{formatRupees(goal.target_amount)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={styles.statValue}>{formatRupees(remaining)}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  shadow: {
    borderRadius: borderRadius.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    gap: spacing.md,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1 },
  name: { color: colors.onSurface, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semiBold },
  deadline: { color: colors.onSurfaceVariant, fontSize: typography.fontSize.xs, marginTop: 2 },
  percent: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBlock: { flex: 1, gap: 2 },
  statLabel: { color: 'rgba(237, 243, 255, 0.55)', fontSize: typography.fontSize.xs },
  statValue: { color: colors.onSurface, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: spacing.sm },
});
