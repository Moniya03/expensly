import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AmountInput } from '../../components/ui/AmountInput';
import { Input } from '../../components/ui/Input';
import { DatePicker } from '../../components/ui/DatePicker';
import { GoalIconPickerRow } from '../../components/goals/GoalIconPickerRow';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';
import { useCreateGoal, useGoals, useUpdateGoal } from '../../hooks/useGoals';
import { toLocalDateString } from '../../utils/date';
import { useLocalSearchParams } from 'expo-router';

export default function CreateGoalScreen() {
  const router = useRouter();
  const { goalId } = useLocalSearchParams<{ goalId?: string }>();
  const { data: goals = [] } = useGoals();
  const editingGoal = React.useMemo(() => goals.find((goal) => goal.id === goalId) ?? null, [goals, goalId]);
  const isEditing = !!editingGoal;
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const [name, setName] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [icon, setIcon] = React.useState('briefcase-outline');
  const [targetDateEnabled, setTargetDateEnabled] = React.useState(false);
  const [targetDate, setTargetDate] = React.useState(new Date());

  React.useEffect(() => {
    if (!editingGoal) return;
    setName(editingGoal.name);
    setAmount(String(editingGoal.target_amount));
    setIcon(editingGoal.icon);
    setTargetDateEnabled(!!editingGoal.target_date);
    setTargetDate(editingGoal.target_date ? new Date(editingGoal.target_date) : new Date());
  }, [editingGoal]);

  const valid = name.trim().length >= 2 && Number(amount) > 0;

  const onSave = async () => {
    if (!valid) return;
    const payload = {
      name: name.trim(),
      target_amount: Number(amount),
      icon,
      target_date: targetDateEnabled ? toLocalDateString(targetDate) : null,
    };

    if (isEditing && editingGoal) {
      await updateGoal.mutateAsync({ id: editingGoal.id, ...payload });
    } else {
      await createGoal.mutateAsync(payload);
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="close" size={22} color={colors.onSurface} /></Pressable>
          <Text style={styles.title}>{isEditing ? 'Edit goal' : 'New goal'}</Text>
          <Pressable onPress={onSave} disabled={!valid || createGoal.isPending || updateGoal.isPending} style={[styles.saveButton, (!valid || createGoal.isPending || updateGoal.isPending) && styles.saveDisabled]}>
            {createGoal.isPending || updateGoal.isPending ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.saveText}>{isEditing ? 'Update' : 'Save'}</Text>}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>{isEditing ? 'Refine the details of your goal.' : 'Shape a quiet goal that keeps your progress visible.'}</Text>
          <Input label="Goal name" placeholder="Emergency fund" value={name} onChangeText={setName} />
          <AmountInput value={amount} onChangeValue={setAmount} integerOnly />

          <View style={styles.fullBleedRow}>
            <GoalIconPickerRow value={icon} onChange={setIcon} />
          </View>

          <Pressable style={styles.dateToggle} onPress={() => setTargetDateEnabled((v) => !v)}>
            <View style={styles.dateToggleTextWrap}>
              <Text style={styles.sectionTitle}>Target date</Text>
            </View>
            <Ionicons name={targetDateEnabled ? 'toggle' : 'toggle-outline'} size={28} color={targetDateEnabled ? colors.primary : colors.onSurfaceVariant} />
          </Pressable>

          {targetDateEnabled ? <DatePicker value={targetDate} onChange={setTargetDate} allowFutureDates inlineYearScroller /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, gap: spacing.sm },
  iconButton: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.onSurface, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semiBold },
  saveButton: { minWidth: 72, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  saveDisabled: { opacity: 0.45 },
  saveText: { color: colors.surface, fontWeight: typography.fontWeight.semiBold },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 120 },
  subtitle: { color: colors.onSurfaceVariant, fontSize: typography.fontSize.sm, lineHeight: typography.fontSize.sm * 1.5, marginBottom: spacing.sm },
  fullBleedRow: { marginHorizontal: -spacing.md },
  dateToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant },
  dateToggleTextWrap: { gap: 2 },
  sectionTitle: { color: colors.onSurface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semiBold },
});
