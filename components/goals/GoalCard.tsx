import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, TouchableRipple } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
import { useGoalIcons } from '../../hooks/useGoalIcons';
import type { Goal } from '../../types';
import { formatRupees } from '../../utils/currency';
import { parseLocalDate } from '../../utils/date';
import { getGoalMeta } from './goalMeta';
import { ProgressRing } from './ProgressRing';

export type GoalOrigin = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const deadlineLabel = (goal: Goal) =>
  goal.target_date
    ? parseLocalDate(goal.target_date).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No deadline';

export function GoalCard({ goal, onOpen }: { goal: Goal; onOpen?: (origin: GoalOrigin) => void }) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
      withTiming(0, { duration: 70 }),
    );
  };

  return (
    <Surface elevation={1} style={styles.surface}>
      <TouchableRipple onPress={handlePress} style={styles.ripple} borderless>
        <View ref={ref} collapsable={false} style={styles.card}>
          <View style={styles.topRow}>
            <Animated.View
              style={[
                styles.iconWrap,
                { backgroundColor: theme.colors.secondaryContainer },
                wiggleStyle,
              ]}
            >
              <Ionicons
                name={meta.icon}
                size={22}
                color={meta.accent || theme.colors.onSecondaryContainer}
              />
            </Animated.View>
            <View style={styles.meta}>
              <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
                {goal.name}
              </Text>
              <Text variant="bodySmall" style={styles.deadline}>
                {deadlineLabel(goal)}
              </Text>
            </View>
            <ProgressRing
              size={56}
              strokeWidth={5}
              progress={progress}
              color={meta.accent || theme.colors.primary}
              trackColor={theme.colors.surfaceContainerHighest}
            >
              <Text
                variant="labelSmall"
                style={[styles.percent, { color: meta.accent || theme.colors.primary }]}
              >
                {percent}%
              </Text>
            </ProgressRing>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text variant="labelSmall" style={styles.statLabel}>
                Saved
              </Text>
              <Text variant="titleSmall" style={styles.statValue}>
                {formatRupees(goal.saved_amount)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text variant="labelSmall" style={styles.statLabel}>
                Target
              </Text>
              <Text variant="titleSmall" style={styles.statValue}>
                {formatRupees(goal.target_amount)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text variant="labelSmall" style={styles.statLabel}>
                Remaining
              </Text>
              <Text variant="titleSmall" style={styles.statValue}>
                {formatRupees(remaining)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableRipple>
    </Surface>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    surface: {
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      overflow: 'hidden',
    },
    ripple: {
      borderRadius: borderRadius.xl,
    },
    card: {
      padding: spacing.md,
      gap: spacing.md,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    meta: {
      flex: 1,
    },
    name: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
    },
    deadline: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    percent: {
      fontWeight: typography.fontWeight.bold,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: borderRadius.lg,
      padding: spacing.sm,
    },
    statBlock: {
      flex: 1,
      gap: 2,
      alignItems: 'center',
    },
    statLabel: {
      color: theme.colors.onSurfaceVariant,
    },
    statValue: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.semiBold,
    },
    statDivider: {
      width: 1,
      height: 20,
      backgroundColor: theme.colors.outlineVariant,
    },
  });
