import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompletedGoalsAccordion } from '../../components/goals/CompletedGoalsAccordion';
import { DeleteGoalConfirmSheet } from '../../components/goals/DeleteGoalConfirmSheet';
import { ExpandedGoalCard } from '../../components/goals/ExpandedGoalCard';
import { GoalCard, type GoalOrigin } from '../../components/goals/GoalCard';
import { GoalCelebrationOverlay } from '../../components/goals/GoalCelebrationOverlay';
import { GoalCreateCard } from '../../components/goals/GoalCreateCard';
import { GoalEmptyState } from '../../components/goals/GoalEmptyState';
import { borderRadius, type Colors, spacing, typography, useColors } from '../../constants/theme';
import { useDeleteGoal, useGoalGroups, useUpdateGoalProgress } from '../../hooks/useGoals';
import type { Goal } from '../../types';

export default function GoalsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { active, completed, isLoading } = useGoalGroups();
  const [selectedGoalId, setSelectedGoalId] = React.useState<string | null>(null);
  const [origin, setOrigin] = React.useState<GoalOrigin | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);
  const [showDelete, setShowDelete] = React.useState(false);
  const [pendingCelebrationGoal, setPendingCelebrationGoal] = React.useState<Goal | null>(null);
  const [shouldOpenCompleted, setShouldOpenCompleted] = React.useState(false);
  const { mutateAsync: updateProgress, isPending: isUpdatingProgress } = useUpdateGoalProgress();
  const { mutateAsync: deleteGoal, isPending: isDeleting } = useDeleteGoal();

  const selectedGoal = React.useMemo(
    () => [...active, ...completed].find((goal) => goal.id === selectedGoalId) ?? null,
    [active, completed, selectedGoalId],
  );

  const openGoal = (goal: Goal, goalOrigin: GoalOrigin) => {
    setOrigin(goalOrigin);
    setSelectedGoalId(goal.id);
  };

  const closeDetails = () => {
    setSelectedGoalId(null);
    setOrigin(null);
  };

  const openCreate = (goal: Goal | null) => {
    closeDetails();
    setEditingGoal(goal);
    setCreateOpen(true);
  };

  const showCelebration = !!pendingCelebrationGoal;
  const completedAccordionOpen = shouldOpenCompleted || !!pendingCelebrationGoal;

  // Pulsing add button
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
    );
  }, [pulse]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Goals</Text>
          <Text style={styles.subtitle}>Small milestones, steady wins</Text>
        </View>
        <Animated.View style={pulseStyle}>
          <Pressable style={styles.addButton} onPress={() => openCreate(null)} hitSlop={8}>
            <Ionicons name="add" size={24} color={colors.surface} />
          </Pressable>
        </Animated.View>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!active.length && !completed.length ? (
            <GoalEmptyState onCreate={() => openCreate(null)} />
          ) : (
            <View style={styles.stack}>
              {active.map((goal) => (
                <GoalCard key={goal.id} goal={goal} onOpen={(origin) => openGoal(goal, origin)} />
              ))}
            </View>
          )}

          <CompletedGoalsAccordion
            goals={completed}
            onOpen={openGoal}
            defaultOpen={completedAccordionOpen}
          />
        </ScrollView>
      )}

      <ExpandedGoalCard
        visible={!!selectedGoal && !showDelete}
        goal={selectedGoal}
        origin={origin}
        isSaving={isUpdatingProgress}
        onClose={closeDetails}
        onSaveProgress={async (amount) => {
          if (!selectedGoal) return;
          const beforeCompleted = selectedGoal.is_completed;
          const updatedGoal = await updateProgress({
            id: selectedGoal.id,
            amount,
          });
          closeDetails();
          if (!beforeCompleted && updatedGoal.is_completed) {
            setShouldOpenCompleted(true);
            setPendingCelebrationGoal(updatedGoal);
          }
        }}
        onEdit={() => openCreate(selectedGoal)}
        onDelete={() => setShowDelete(true)}
      />

      <GoalCreateCard
        visible={createOpen}
        goal={editingGoal}
        onClose={() => setCreateOpen(false)}
      />

      <GoalCelebrationOverlay
        visible={showCelebration}
        goal={pendingCelebrationGoal}
        onDone={() => setPendingCelebrationGoal(null)}
      />

      <DeleteGoalConfirmSheet
        visible={!!selectedGoal && showDelete}
        goal={selectedGoal}
        isDeleting={isDeleting}
        onClose={() => setShowDelete(false)}
        onDelete={async () => {
          if (!selectedGoal) return;
          await deleteGoal(selectedGoal.id);
          setShowDelete(false);
          closeDetails();
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    title: {
      color: colors.onSurface,
      fontSize: typography.fontSize.xxxl,
      fontWeight: typography.fontWeight.bold,
    },
    subtitle: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.sm,
      marginTop: 2,
    },
    addButton: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: 140,
      gap: spacing.lg,
    },
    stack: { gap: spacing.md },
  });
