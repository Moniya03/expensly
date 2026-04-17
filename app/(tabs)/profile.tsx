import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useUpdateProfile } from '../../hooks/useProfile';
import NameEditSheet from '../../components/profile/NameEditSheet';

const appVersion = (require('../../package.json') as { version?: string }).version ?? '1.0.0';

export default function ProfileScreen() {
  const { profile, signOut } = useAuthStore();
  const { mutateAsync: updateProfile, isPending: isBudgetSaving } = useUpdateProfile();

  const [nameSheetVisible, setNameSheetVisible] = React.useState(false);
  const [budgetEditing, setBudgetEditing] = React.useState(false);
  const [budgetDraft, setBudgetDraft] = React.useState(profile?.monthly_budget ? String(profile.monthly_budget) : '');
  const [feedback, setFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    setBudgetDraft(profile?.monthly_budget ? String(profile.monthly_budget) : '');
  }, [profile?.monthly_budget]);

  React.useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2200);
    return () => clearTimeout(timer);
  }, [feedback]);

  const displayName = profile?.name || profile?.display_name || 'User';
  const budgetValue = profile?.monthly_budget ?? 0;
  const version = appVersion;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSaveBudget = async () => {
    const parsed = Number.parseInt(budgetDraft.replace(/[^0-9]/g, ''), 10);

    if (Number.isNaN(parsed) || parsed < 0) {
      return;
    }

    try {
      await updateProfile({ monthly_budget: parsed });
      setBudgetEditing(false);
      setFeedback('Budget updated');
    } catch (error) {
      console.error('Budget update error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.screenTitle}>Profile</Text>

        <Pressable style={styles.headerCard} onPress={() => setNameSheetVisible(true)}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person" size={26} color={colors.surface} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.headerHint}>Tap to edit name</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceVariant} />
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account & settings</Text>

          <View style={styles.budgetCard}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.cardTitle}>Monthly budget</Text>
                {!budgetEditing ? (
                  <Text style={styles.cardValue}>
                    {budgetValue > 0 ? `₹${budgetValue}` : 'No budget set'}
                  </Text>
                ) : null}
              </View>

              {!budgetEditing ? (
                <Pressable style={styles.editPill} onPress={() => setBudgetEditing(true)}>
                  <Text style={styles.editPillText}>Edit</Text>
                </Pressable>
              ) : null}
            </View>

            {budgetEditing ? (
              <View style={styles.budgetEditWrap}>
                <TextInput
                  style={styles.budgetInput}
                  value={budgetDraft}
                  onChangeText={(value) => setBudgetDraft(value.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="Enter amount"
                  placeholderTextColor={colors.onSurfaceVariant}
                  selectionColor={colors.primary}
                />
                <View style={styles.actionsRow}>
                  <Pressable
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => {
                      setBudgetDraft(profile?.monthly_budget ? String(profile.monthly_budget) : '');
                      setBudgetEditing(false);
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={[styles.actionButton, styles.primaryButton]} onPress={handleSaveBudget}>
                    {isBudgetSaving ? (
                      <ActivityIndicator size="small" color={colors.surface} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Save</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {feedback ? <Text style={styles.toast}>{feedback}</Text> : null}

        <View style={styles.footerWrap}>
          <Text style={styles.version}>v{version}</Text>
        </View>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      <NameEditSheet
        visible={nameSheetVisible}
        currentName={displayName}
        onClose={() => setNameSheetVisible(false)}
        onSaved={() => setFeedback('Name updated')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  screenTitle: {
    color: colors.onSurface,
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.lg,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    color: colors.onSurface,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
  },
  headerHint: {
    color: colors.onSurfaceVariant,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionLabel: {
    color: colors.onSurfaceVariant,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  budgetCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: colors.onSurfaceVariant,
    fontSize: typography.fontSize.sm,
    marginBottom: 4,
  },
  cardValue: {
    color: colors.onSurface,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
  },
  editPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  editPillText: {
    color: colors.onSurface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  budgetEditWrap: {
    marginTop: spacing.md,
  },
  budgetInput: {
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.onSurface,
    fontSize: typography.fontSize.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  secondaryButtonText: {
    color: colors.onSurface,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  toast: {
    color: colors.secondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.md,
  },
  footerWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  version: {
    color: colors.onSurfaceVariant,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
    marginBottom: spacing.md,
  },
  signOutText: {
    color: colors.error,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.sm,
  },
});
