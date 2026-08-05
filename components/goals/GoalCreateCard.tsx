import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { borderRadius, type Colors, spacing, typography, useColors } from '../../constants/theme';
import { useCreateGoal, useUpdateGoal } from '../../hooks/useGoals';
import type { Goal } from '../../types';
import { toLocalDateString } from '../../utils/date';
import { AmountInput } from '../ui/AmountInput';
import { DatePicker } from '../ui/DatePicker';
import { Input } from '../ui/Input';
import { GoalIconPickerRow } from './GoalIconPickerRow';

type Props = {
  visible: boolean;
  /** Non-null when editing an existing goal */
  goal: Goal | null;
  onClose: () => void;
};

export function GoalCreateCard({ visible, goal, onClose }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const isSaving = createGoal.isPending || updateGoal.isPending;

  const [name, setName] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [icon, setIcon] = React.useState('briefcase-outline');
  const [targetDateEnabled, setTargetDateEnabled] = React.useState(false);
  const [targetDate, setTargetDate] = React.useState(new Date());

  const scale = useSharedValue(0.7);
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setName(goal?.name ?? '');
      setAmount(goal ? String(goal.target_amount) : '');
      setIcon(goal?.icon ?? 'briefcase-outline');
      setTargetDateEnabled(!!goal?.target_date);
      setTargetDate(goal?.target_date ? new Date(goal.target_date) : new Date());
      scale.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(0, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, { duration: 150 });
    } else {
      scale.value = 0.7;
      translateY.value = 40;
      opacity.value = 0;
    }
  }, [visible, goal, scale, translateY, opacity]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const valid = name.trim().length >= 2 && Number(amount) > 0;

  const onSave = async () => {
    if (!valid || isSaving) return;
    const payload = {
      name: name.trim(),
      target_amount: Number(amount),
      icon,
      target_date: targetDateEnabled ? toLocalDateString(targetDate) : null,
    };
    if (goal) {
      await updateGoal.mutateAsync({ id: goal.id, ...payload });
    } else {
      await createGoal.mutateAsync(payload);
    }
    onClose();
  };

  const isEditing = !!goal;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.scrim} onPress={onClose} />

        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons
                name={isEditing ? 'create-outline' : 'sparkles'}
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{isEditing ? 'Edit goal' : 'New goal'}</Text>
              <Text style={styles.subtitle}>
                {isEditing
                  ? 'Refine the details of your goal.'
                  : 'Shape a quiet goal that keeps your progress visible.'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.form}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Input
              label="Goal name"
              placeholder="Emergency fund"
              value={name}
              onChangeText={setName}
            />
            <AmountInput value={amount} onChangeValue={setAmount} integerOnly />

            <GoalIconPickerRow value={icon} onChange={setIcon} />

            <Pressable style={styles.dateToggle} onPress={() => setTargetDateEnabled((v) => !v)}>
              <Text style={styles.sectionLabel}>Target date</Text>
              <Ionicons
                name={targetDateEnabled ? 'toggle' : 'toggle-outline'}
                size={26}
                color={targetDateEnabled ? colors.primary : colors.onSurfaceVariant}
              />
            </Pressable>
            {targetDateEnabled ? (
              <DatePicker
                value={targetDate}
                onChange={setTargetDate}
                allowFutureDates
                inlineYearScroller
              />
            ) : null}
          </ScrollView>

          <Pressable
            onPress={onSave}
            disabled={!valid || isSaving}
            style={[styles.saveButton, (!valid || isSaving) && styles.saveDisabled]}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.saveText}>{isEditing ? 'Update goal' : 'Create goal'}</Text>
            )}
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(4, 6, 12, 0.82)',
    },
    card: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '88%',
      backgroundColor: colors.surfaceContainerHigh,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      padding: spacing.lg,
      gap: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 16,
    },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.full,
      backgroundColor: `${colors.primary}1F`,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    headerText: { flex: 1 },
    title: {
      color: colors.onSurface,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
    },
    subtitle: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.xs,
      marginTop: 2,
      lineHeight: 16,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    form: { gap: spacing.sm, paddingBottom: spacing.sm },
    sectionLabel: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.onSurfaceVariant,
      marginBottom: spacing.xs,
    },
    dateToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    saveButton: {
      minHeight: 52,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveDisabled: { opacity: 0.45 },
    saveText: {
      color: colors.surface,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
  });
