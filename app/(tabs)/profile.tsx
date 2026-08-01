import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { borderRadius, spacing, typography, useColors, type Colors } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useUpdateProfile } from '../../hooks/useProfile';
import { useAllTransactions } from '../../hooks/useTransactions';
import { getHistoricalBudgetForMonth, useBudgets } from '../../hooks/useBudget';
import { parseLocalDate } from '../../utils/date';
import { formatRupees } from '../../utils/currency';
import { uploadAvatar } from '../../services/avatar';
import NameEditSheet from '../../components/profile/NameEditSheet';

const appVersion = (require('../../package.json') as { version?: string }).version ?? '1.0.0';

export default function ProfileScreen() {
  const { profile, session } = useAuthStore();
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const { data: transactions = [] } = useAllTransactions();
  const { data: budgets = [] } = useBudgets();

  const [nameSheetVisible, setNameSheetVisible] = React.useState(false);
  const [budgetEditing, setBudgetEditing] = React.useState(false);
  const [budgetDraft, setBudgetDraft] = React.useState(profile?.monthly_budget ? String(profile.monthly_budget) : '');
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    setBudgetDraft(profile?.monthly_budget ? String(profile.monthly_budget) : '');
  }, [profile?.monthly_budget]);

  React.useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2200);
    return () => clearTimeout(timer);
  }, [feedback]);

  const displayName = profile?.name || 'User';
  const email = session?.user?.email;
  const fallbackBudget = profile?.monthly_budget ?? 0;

  // "Saved this year": sum of (budget - spent) for each month Jan → now.
  const savedThisYear = React.useMemo(() => {
    const now = new Date();
    let savings = 0;

    for (let month = 1; month <= now.getMonth() + 1; month++) {
      const year = now.getFullYear();
      const monthTransactions = transactions.filter((transaction) => {
        const d = parseLocalDate(transaction.transaction_date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });
      const spent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
      const budget = getHistoricalBudgetForMonth({ budgets, fallbackBudget, month, year });
      savings += budget - spent;
    }

    return savings;
  }, [transactions, budgets, fallbackBudget]);

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setFeedback('Photo access is needed to change avatar');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const userId = session?.user?.id;
      if (!userId) return;

      setAvatarUploading(true);
      const publicUrl = await uploadAvatar(userId, result.assets[0].uri);
      await updateProfile({ avatar_url: publicUrl });
      setFeedback('Avatar updated');
    } catch (error) {
      console.error('Avatar update error:', error);
      setFeedback('Could not update avatar');
    } finally {
      setAvatarUploading(false);
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
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Profile</Text>
          <Pressable style={styles.gearButton} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={22} color={colors.onSurface} />
          </Pressable>
        </View>

        <LinearGradient colors={['#123C86', '#0F2F63', '#0B223F', '#0A191D']} style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Pressable style={styles.avatarWrap} onPress={handlePickAvatar} disabled={avatarUploading}>
              {avatarUploading ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={30} color={colors.surface} />
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={12} color={colors.surface} />
              </View>
            </Pressable>

            <View style={styles.heroTextWrap}>
              <Pressable onPress={() => setNameSheetVisible(true)}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{displayName}</Text>
                  <Ionicons name="pencil" size={14} color="#cfe0ff" />
                </View>
                {email ? <Text style={styles.email}>{email}</Text> : null}
                <Text style={styles.heroHint}>Tap to edit profile</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View>
            <Text style={styles.savingsLabel}>Saved this year</Text>
            <Text style={[styles.savingsValue, savedThisYear < 0 && { color: '#ff9d98' }]}>
              {formatRupees(Math.abs(savedThisYear), { showSymbol: true })}
            </Text>
            <Text style={styles.savingsSub}>
              {savedThisYear < 0 ? 'Overspent vs your monthly budgets' : 'vs your monthly budgets'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Monthly budget</Text>
          <View style={styles.budgetCard}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.cardTitle}>Spending limit</Text>
                {!budgetEditing ? (
                  <Text style={styles.cardValue}>
                    {profile?.monthly_budget ? formatRupees(profile.monthly_budget) : 'No budget set'}
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
                    <Text style={styles.primaryButtonText}>Save</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {feedback ? <Text style={styles.toast}>{feedback}</Text> : null}

        <View style={styles.footerWrap}>
          <Text style={styles.version}>v{appVersion}</Text>
        </View>
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

const createStyles = (colors: Colors) =>
  StyleSheet.create({
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
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  gearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#123C86',
  },
  heroTextWrap: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  email: {
    color: '#cfe0ff',
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  heroHint: {
    color: '#8fb1e8',
    fontSize: typography.fontSize.xs,
    marginTop: 4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginVertical: spacing.md,
  },
  savingsLabel: {
    color: '#9db9e8',
    fontSize: typography.fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  savingsValue: {
    color: colors.surface,
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  savingsSub: {
    color: '#8fb1e8',
    fontSize: typography.fontSize.xs,
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
});
