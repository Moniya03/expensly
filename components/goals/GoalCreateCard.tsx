import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, IconButton, Modal, Portal, Surface, Switch, Text } from 'react-native-paper';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
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
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const isSaving = createGoal.isPending || updateGoal.isPending;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [icon, setIcon] = useState('briefcase-outline');
  const [targetDateEnabled, setTargetDateEnabled] = useState(false);
  const [targetDate, setTargetDate] = useState(new Date());

  useEffect(() => {
    if (visible) {
      setName(goal?.name ?? '');
      setAmount(goal ? String(goal.target_amount) : '');
      setIcon(goal?.icon ?? 'briefcase-outline');
      setTargetDateEnabled(!!goal?.target_date);
      setTargetDate(goal?.target_date ? new Date(goal.target_date) : new Date());
    }
  }, [visible, goal]);

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
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalContent}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Surface elevation={3} style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons
                  name={isEditing ? 'create-outline' : 'sparkles'}
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.headerText}>
                <Text variant="titleMedium" style={styles.title}>
                  {isEditing ? 'Edit goal' : 'New goal'}
                </Text>
                <Text variant="bodySmall" style={styles.subtitle}>
                  {isEditing
                    ? 'Refine the details of your goal.'
                    : 'Shape a quiet goal that keeps your progress visible.'}
                </Text>
              </View>
              <IconButton
                icon="close"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
                containerColor={theme.colors.surfaceContainer}
                onPress={onClose}
                style={styles.closeButton}
                accessibilityLabel="Close"
              />
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

              <View style={styles.dateToggle}>
                <Text variant="bodyMedium" style={styles.sectionLabel}>
                  Target date
                </Text>
                <Switch
                  value={targetDateEnabled}
                  onValueChange={setTargetDateEnabled}
                  color={theme.colors.primary}
                />
              </View>
              {targetDateEnabled ? (
                <DatePicker
                  value={targetDate}
                  onChange={setTargetDate}
                  allowFutureDates
                  inlineYearScroller
                />
              ) : null}
            </ScrollView>

            <Button
              mode="contained"
              onPress={onSave}
              loading={isSaving}
              disabled={!valid || isSaving}
              style={styles.saveButton}
              contentStyle={styles.saveButtonContent}
              labelStyle={styles.saveButtonLabel}
            >
              {isEditing ? 'Update goal' : 'Create goal'}
            </Button>
          </Surface>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContent: {
      paddingHorizontal: spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    keyboardView: {
      width: '100%',
      maxWidth: 420,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '88%',
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      gap: spacing.md,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
    },
    title: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      lineHeight: 16,
    },
    closeButton: {
      margin: 0,
    },
    form: {
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    sectionLabel: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: theme.colors.onSurfaceVariant,
    },
    dateToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    saveButton: {
      borderRadius: borderRadius.lg,
    },
    saveButtonContent: {
      minHeight: 48,
    },
    saveButtonLabel: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
  });
