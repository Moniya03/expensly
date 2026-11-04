import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
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
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
    <Surface elevation={1} style={styles.wrap}>
      <Pressable style={styles.header} onPress={() => setOpen((v) => !v)}>
        <View style={styles.headerIcon}>
          <Ionicons name="checkmark-done" size={16} color={theme.colors.secondary} />
        </View>
        <Text variant="titleMedium" style={styles.title}>
          Completed goals
        </Text>
        <View style={styles.badge}>
          <Text variant="labelSmall" style={styles.badgeText}>
            {goals.length}
          </Text>
        </View>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={18} color={theme.colors.onSurfaceVariant} />
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
    </Surface>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: theme.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: borderRadius.lg,
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
      backgroundColor: `${theme.colors.secondary}1A`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.semiBold,
    },
    badge: {
      minWidth: 28,
      paddingHorizontal: 8,
      height: 24,
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceContainerHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: typography.fontWeight.semiBold,
    },
    list: { padding: spacing.md, gap: spacing.md, paddingTop: 0 },
  });
