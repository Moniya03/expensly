import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Surface, Text } from 'react-native-paper';
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
import { AmountInput } from '../ui/AmountInput';
import type { GoalOrigin } from './GoalCard';
import { getGoalMeta } from './goalMeta';
import { ProgressRing } from './ProgressRing';

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

type Props = {
  visible: boolean;
  goal: Goal | null;
  origin?: GoalOrigin | null;
  isSaving: boolean;
  onClose: () => void;
  onSaveProgress: (amount: number) => void | Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
};

export function ExpandedGoalCard({
  visible,
  goal,
  origin: _origin,
  isSaving,
  onClose,
  onSaveProgress,
  onEdit,
  onDelete,
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: customIcons } = useGoalIcons();

  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (visible) {
      setAdding(false);
      setAmount('');
    }
  }, [visible]);

  if (!goal) return null;

  const meta = getGoalMeta(goal.icon, customIcons);
  const remaining = Math.max(goal.target_amount - goal.saved_amount, 0);
  const ringProgress =
    goal.target_amount > 0 ? Math.min(goal.saved_amount / goal.target_amount, 1) : 0;
  const percent = Math.round(ringProgress * 100);
  const deadline = goal.target_date
    ? parseLocalDate(goal.target_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'No target date';

  const validAmount = Number(amount) > 0 && Number(amount) <= remaining;

  const save = async () => {
    if (!validAmount || isSaving) return;
    await onSaveProgress(Number(amount));
    setAdding(false);
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalContent}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Surface elevation={3} style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconWrap, { backgroundColor: `${meta.accent}1F` }]}>
                <Ionicons name={meta.icon} size={22} color={meta.accent} />
              </View>
              <View style={styles.headerText}>
                <Text variant="titleLarge" style={styles.title} numberOfLines={1}>
                  {goal.name}
                </Text>
                <Text variant="bodySmall" style={styles.deadline}>
                  {deadline}
                </Text>
              </View>
              <IconButton
                icon="close"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
                containerColor={theme.colors.surfaceContainer}
                onPress={onClose}
                style={styles.closeButton}
              />
            </View>

            {/* Ring */}
            <View style={styles.ringSection}>
              <ProgressRing
                size={150}
                strokeWidth={12}
                progress={ringProgress}
                color={meta.accent}
                trackColor={`${meta.accent}1F`}
              >
                <View style={styles.ringCenter}>
                  <Text style={[styles.ringPercent, { color: meta.accent }]}>{percent}%</Text>
                  <Text variant="bodySmall" style={styles.ringAmount}>
                    {formatRupees(goal.saved_amount, { compact: true })} of{' '}
                    {formatRupees(goal.target_amount, { compact: true })}
                  </Text>
                </View>
              </ProgressRing>
            </View>

            {/* Stats or inline progress */}
            {adding ? (
              <View style={styles.addSection}>
                <AmountInput value={amount} onChangeValue={setAmount} integerOnly />
                <View style={styles.chipsRow}>
                  {QUICK_AMOUNTS.map((q) => (
                    <Chip
                      key={q}
                      compact
                      selected={amount === String(q)}
                      showSelectedCheck={false}
                      onPress={() => setAmount(String(q))}
                      style={styles.chip}
                    >
                      {formatRupees(q, {
                        showSymbol: false,
                        compact: q >= 1000,
                      })}
                    </Chip>
                  ))}
                </View>
                <View style={styles.addActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setAdding(false)}
                    style={styles.actionButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    loading={isSaving}
                    disabled={!validAmount || isSaving}
                    onPress={save}
                    buttonColor={theme.colors.primary}
                    textColor={theme.colors.onPrimary}
                    style={styles.actionButton}
                  >
                    Add
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text variant="labelSmall" style={styles.statLabel}>
                    Saved
                  </Text>
                  <Text variant="titleMedium" style={styles.statValue}>
                    {formatRupees(goal.saved_amount)}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text variant="labelSmall" style={styles.statLabel}>
                    Target
                  </Text>
                  <Text variant="titleMedium" style={styles.statValue}>
                    {formatRupees(goal.target_amount)}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text variant="labelSmall" style={styles.statLabel}>
                    Remaining
                  </Text>
                  <Text variant="titleMedium" style={styles.statValue}>
                    {formatRupees(remaining)}
                  </Text>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {goal.is_completed ? (
                <Button
                  mode="contained"
                  icon="check-circle"
                  disabled
                  style={styles.completedButton}
                >
                  Goal completed
                </Button>
              ) : adding ? null : (
                <Button
                  mode="contained"
                  icon="plus-circle-outline"
                  onPress={() => setAdding(true)}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                  style={styles.primaryButton}
                >
                  Update progress
                </Button>
              )}
              {!adding && (
                <View style={styles.secondaryRow}>
                  <Button
                    mode="outlined"
                    icon="pencil-outline"
                    onPress={onEdit}
                    style={styles.secondaryButton}
                  >
                    Edit
                  </Button>
                  <Button
                    mode="outlined"
                    icon="trash-can-outline"
                    textColor={theme.colors.error}
                    onPress={onDelete}
                    style={styles.secondaryButton}
                  >
                    Delete
                  </Button>
                </View>
              )}
            </View>
          </Surface>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContent: {
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    keyboardView: {
      width: '100%',
      maxWidth: 420,
    },
    card: {
      width: '100%',
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: spacing.lg,
      gap: spacing.md,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: { flex: 1 },
    title: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
    },
    deadline: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    closeButton: {
      margin: 0,
    },
    ringSection: { alignItems: 'center', paddingVertical: spacing.sm },
    ringCenter: { alignItems: 'center', gap: 2 },
    ringPercent: { fontSize: 34, fontWeight: typography.fontWeight.bold },
    ringAmount: {
      color: theme.colors.onSurfaceVariant,
    },
    statsGrid: { flexDirection: 'row', gap: spacing.sm },
    statCard: {
      flex: 1,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      gap: 4,
    },
    statLabel: {
      color: theme.colors.onSurfaceVariant,
    },
    statValue: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.semiBold,
    },
    addSection: { gap: spacing.sm },
    chipsRow: { flexDirection: 'row', gap: spacing.xs, justifyContent: 'space-between' },
    chip: {
      flex: 1,
    },
    addActions: { flexDirection: 'row', gap: spacing.sm },
    actionButton: {
      flex: 1,
      borderRadius: borderRadius.lg,
    },
    actions: { gap: spacing.sm },
    primaryButton: {
      borderRadius: borderRadius.lg,
    },
    completedButton: {
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceDisabled,
    },
    secondaryRow: { flexDirection: 'row', gap: spacing.sm },
    secondaryButton: {
      flex: 1,
      borderRadius: borderRadius.lg,
    },
  });
