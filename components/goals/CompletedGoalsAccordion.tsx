import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { borderRadius, type Colors, spacing, typography, useColors } from '../../constants/theme';
import type { Goal } from '../../types';
import { GoalCard, type GoalOrigin } from './GoalCard';

export function CompletedGoalsAccordion({
  goals,
  onOpen,
  defaultOpen = false,
}: {
  goals: Goal[];
  onOpen?: (goal: Goal, origin: GoalOrigin) => void;
  defaultOpen?: boolean;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  const chevronRotate = useSharedValue(0);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotate.value}deg` }],
  }));

  useEffect(() => {
    chevronRotate.value = withTiming(open ? 180 : 0, { duration: 220 });
  }, [open, chevronRotate]);

  if (!goals.length) return null;

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.header} onPress={() => setOpen((v) => !v)}>
        <View style={styles.headerIcon}>
          <Ionicons name="checkmark-done" size={16} color={colors.secondary} />
        </View>
        <Text style={styles.title}>Completed goals</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{goals.length}</Text>
        </View>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={18} color={colors.onSurfaceVariant} />
        </Animated.View>
      </Pressable>
      {open ? (
        <View style={styles.list}>
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onOpen={onOpen ? (origin) => onOpen(goal, origin) : undefined}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
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
    headerIcon: {
      width: 30,
      height: 30,
      borderRadius: borderRadius.full,
      backgroundColor: `${colors.secondary}1A`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      color: colors.onSurface,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
    badge: {
      minWidth: 28,
      paddingHorizontal: 8,
      height: 24,
      borderRadius: 999,
      backgroundColor: colors.surfaceContainerHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semiBold,
    },
    list: { padding: spacing.md, gap: spacing.md, paddingTop: 0 },
  });
