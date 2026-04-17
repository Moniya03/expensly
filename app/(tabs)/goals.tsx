import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';
import { useGoalGroups } from '../../hooks/useGoals';
import { GoalCard } from '../../components/goals/GoalCard';
import { CompletedGoalsAccordion } from '../../components/goals/CompletedGoalsAccordion';
import { GoalEmptyState } from '../../components/goals/GoalEmptyState';
import { GoalDetailsSheet } from '../../components/goals/GoalDetailsSheet';
import { GoalProgressSheet } from '../../components/goals/GoalProgressSheet';
import { DeleteGoalConfirmSheet } from '../../components/goals/DeleteGoalConfirmSheet';
import { GoalCelebrationOverlay } from '../../components/goals/GoalCelebrationOverlay';
import { useDeleteGoal, useUpdateGoalProgress } from '../../hooks/useGoals';
import { Goal } from '../../types';

export default function GoalsScreen() {
  const router = useRouter();
  const { active, completed, isLoading } = useGoalGroups();
  const [selectedGoalId, setSelectedGoalId] = React.useState<string | null>(null);
  const [showProgress, setShowProgress] = React.useState(false);
  const [showDelete, setShowDelete] = React.useState(false);
  const [pendingCelebrationGoal, setPendingCelebrationGoal] = React.useState<Goal | null>(null);
  const [shouldOpenCompleted, setShouldOpenCompleted] = React.useState(false);
  const { mutateAsync: updateProgress, isPending: isUpdatingProgress } = useUpdateGoalProgress();
  const { mutateAsync: deleteGoal, isPending: isDeleting } = useDeleteGoal();

  const selectedGoal = React.useMemo(
    () => [...active, ...completed].find((goal) => goal.id === selectedGoalId) ?? null,
    [active, completed, selectedGoalId]
  );

  const closeDetails = () => setSelectedGoalId(null);
  const showCelebration = !!pendingCelebrationGoal;
  const completedAccordionOpen = shouldOpenCompleted || !!pendingCelebrationGoal;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/goals/create' as never)}>
          <Ionicons name="add" size={22} color={colors.surface} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!active.length && !completed.length ? (
            <GoalEmptyState onCreate={() => router.push('/goals/create' as never)} />
          ) : (
            <View style={styles.stack}>
              {active.map((goal) => <GoalCard key={goal.id} goal={goal} onPress={() => setSelectedGoalId(goal.id)} />)}
            </View>
          )}

          <CompletedGoalsAccordion
            goals={completed}
            onGoalPress={(goal) => setSelectedGoalId(goal.id)}
            defaultOpen={completedAccordionOpen}
          />
        </ScrollView>
      )}

      <GoalDetailsSheet
        visible={!!selectedGoal && !showProgress && !showDelete}
        goal={selectedGoal}
        onClose={closeDetails}
        onUpdateProgress={() => setShowProgress(true)}
        onEdit={() => {
          if (!selectedGoal) return;
          closeDetails();
          router.push({ pathname: '/goals/create', params: { goalId: selectedGoal.id } } as never);
        }}
        onDelete={() => setShowDelete(true)}
      />

      <GoalProgressSheet
        visible={!!selectedGoal && showProgress}
        goal={selectedGoal}
        isSaving={isUpdatingProgress}
        onClose={() => setShowProgress(false)}
        onSave={async (amount) => {
          if (!selectedGoal) return;
          const beforeCompleted = selectedGoal.is_completed;
          const updatedGoal = await updateProgress({ id: selectedGoal.id, amount });
          setShowProgress(false);
          closeDetails();
          if (!beforeCompleted && updatedGoal.is_completed) {
            setShouldOpenCompleted(true);
            setPendingCelebrationGoal(updatedGoal);
          }
        }}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { color: colors.onSurface, fontSize: typography.fontSize.xxxl, fontWeight: typography.fontWeight.bold },
  addButton: { width: 44, height: 44, borderRadius: borderRadius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.md, paddingBottom: 140, gap: spacing.lg },
  stack: { gap: spacing.md },
});
