import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  IconButton,
  Snackbar,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import NameEditSheet from '../../components/profile/NameEditSheet';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
import { getHistoricalBudgetForMonth, useBudgets } from '../../hooks/useBudget';
import { useUpdateProfile } from '../../hooks/useProfile';
import { useAllTransactions } from '../../hooks/useTransactions';
import { uploadAvatar } from '../../services/avatar';
import { useAuthStore } from '../../stores/authStore';
import { formatRupees } from '../../utils/currency';
import { parseLocalDate } from '../../utils/date';

const appVersion = (require('../../package.json') as { version?: string }).version ?? '1.0.0';

export default function ProfileScreen() {
  const { profile, session } = useAuthStore();
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const { data: transactions = [] } = useAllTransactions();
  const { data: budgets = [] } = useBudgets();

  const [nameSheetVisible, setNameSheetVisible] = useState(false);
  const [budgetEditing, setBudgetEditing] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(
    profile?.monthly_budget ? String(profile.monthly_budget) : '',
  );
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    setBudgetDraft(profile?.monthly_budget ? String(profile.monthly_budget) : '');
  }, [profile?.monthly_budget]);

  const displayName = profile?.name || 'User';
  const email = session?.user?.email;
  const fallbackBudget = profile?.monthly_budget ?? 0;

  // "Saved till now": sum of (budget - spent) for each month from the month
  // the user first logged an expense (or created their account if they have
  // no transactions yet) up to the current month.
  const savedTillNow = useMemo(() => {
    const now = new Date();

    // Start from the month of the first logged expense, else account creation.
    let startMonth = now.getMonth() + 1;
    let startYear = now.getFullYear();

    if (transactions.length > 0) {
      let firstDate: Date | null = null;
      for (const transaction of transactions) {
        const d = parseLocalDate(transaction.transaction_date);
        if (firstDate === null || d < firstDate) {
          firstDate = d;
        }
      }
      if (firstDate) {
        startMonth = firstDate.getMonth() + 1;
        startYear = firstDate.getFullYear();
      }
    } else if (profile?.created_at) {
      const created = new Date(profile.created_at);
      if (!Number.isNaN(created.getTime())) {
        startMonth = created.getMonth() + 1;
        startYear = created.getFullYear();
      }
    }

    let savings = 0;
    let month = startMonth;
    let year = startYear;

    while (
      year < now.getFullYear() ||
      (year === now.getFullYear() && month <= now.getMonth() + 1)
    ) {
      const monthTransactions = transactions.filter((transaction) => {
        const d = parseLocalDate(transaction.transaction_date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });
      const spent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
      const budget = getHistoricalBudgetForMonth({
        budgets,
        fallbackBudget,
        month,
        year,
      });
      savings += budget - spent;

      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }

    return savings;
  }, [transactions, budgets, fallbackBudget, profile?.created_at]);

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
          <Text variant="headlineMedium" style={styles.screenTitle}>
            Profile
          </Text>
          <IconButton
            icon="cog-outline"
            size={22}
            containerColor={theme.colors.surfaceContainer}
            iconColor={theme.colors.onSurface}
            onPress={() => router.push('/settings')}
            style={styles.gearButton}
          />
        </View>

        <LinearGradient
          colors={['#123C86', '#0F2F63', '#0B223F', '#0A191D']}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <Pressable
              style={styles.avatarWrap}
              onPress={handlePickAvatar}
              disabled={avatarUploading}
            >
              {avatarUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={30} color="#FFFFFF" />
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={12} color="#FFFFFF" />
              </View>
            </Pressable>

            <View style={styles.heroTextWrap}>
              <Pressable onPress={() => setNameSheetVisible(true)}>
                <View style={styles.nameRow}>
                  <Text variant="titleMedium" style={styles.name}>
                    {displayName}
                  </Text>
                  <Ionicons name="pencil" size={14} color="#cfe0ff" />
                </View>
                {email ? (
                  <Text variant="bodyMedium" style={styles.email}>
                    {email}
                  </Text>
                ) : null}
                <Text variant="labelSmall" style={styles.heroHint}>
                  Tap to edit profile
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View>
            <Text variant="labelSmall" style={styles.savingsLabel}>
              Saved till now
            </Text>
            <Text
              variant="headlineMedium"
              style={[styles.savingsValue, savedTillNow < 0 && { color: '#ff9d98' }]}
            >
              {formatRupees(Math.abs(savedTillNow), { showSymbol: true })}
            </Text>
            <Text variant="labelSmall" style={styles.savingsSub}>
              {savedTillNow < 0 ? 'Overspent vs your monthly budgets' : 'vs your monthly budgets'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text variant="labelSmall" style={styles.sectionLabel}>
            Monthly budget
          </Text>
          <Surface elevation={1} style={styles.budgetCard}>
            <View style={styles.rowBetween}>
              <View>
                <Text variant="bodyMedium" style={styles.cardTitle}>
                  Spending limit
                </Text>
                {!budgetEditing ? (
                  <Text variant="titleMedium" style={styles.cardValue}>
                    {profile?.monthly_budget
                      ? formatRupees(profile.monthly_budget)
                      : 'No budget set'}
                  </Text>
                ) : null}
              </View>

              {!budgetEditing ? (
                <Button
                  mode="outlined"
                  compact
                  textColor={theme.colors.onSurface}
                  onPress={() => setBudgetEditing(true)}
                  style={styles.editButton}
                >
                  Edit
                </Button>
              ) : null}
            </View>

            {budgetEditing ? (
              <View style={styles.budgetEditWrap}>
                <TextInput
                  mode="outlined"
                  keyboardType="number-pad"
                  value={budgetDraft}
                  onChangeText={(value) => setBudgetDraft(value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter amount"
                  left={<TextInput.Affix text="₹" />}
                  textColor={theme.colors.onSurface}
                  outlineColor={theme.colors.outlineVariant}
                  activeOutlineColor={theme.colors.primary}
                  style={styles.budgetInput}
                />
                <View style={styles.actionsRow}>
                  <Button
                    mode="outlined"
                    style={styles.actionButton}
                    textColor={theme.colors.onSurface}
                    onPress={() => {
                      setBudgetDraft(profile?.monthly_budget ? String(profile.monthly_budget) : '');
                      setBudgetEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    style={styles.actionButton}
                    buttonColor={theme.colors.primary}
                    textColor="#FFFFFF"
                    onPress={handleSaveBudget}
                  >
                    Save
                  </Button>
                </View>
              </View>
            ) : null}
          </Surface>
        </View>

        <View style={styles.footerWrap}>
          <Text variant="labelSmall" style={styles.version}>
            v{appVersion}
          </Text>
        </View>
      </View>

      <Snackbar visible={Boolean(feedback)} onDismiss={() => setFeedback(null)} duration={2200}>
        {feedback}
      </Snackbar>

      <NameEditSheet
        visible={nameSheetVisible}
        currentName={displayName}
        onClose={() => setNameSheetVisible(false)}
        onSaved={() => setFeedback('Name updated')}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    screenTitle: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    gearButton: {
      margin: 0,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
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
      backgroundColor: theme.colors.primary,
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
      color: '#FFFFFF',
      fontWeight: typography.fontWeight.bold,
    },
    email: {
      color: '#cfe0ff',
      marginTop: 2,
    },
    heroHint: {
      color: '#8fb1e8',
      marginTop: 4,
    },
    heroDivider: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.14)',
      marginVertical: spacing.md,
    },
    savingsLabel: {
      color: '#9db9e8',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    savingsValue: {
      color: '#FFFFFF',
      fontWeight: typography.fontWeight.bold,
      marginTop: 2,
    },
    savingsSub: {
      color: '#8fb1e8',
      marginTop: 2,
    },
    section: {
      marginTop: spacing.xl,
    },
    sectionLabel: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: typography.fontWeight.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.sm,
    },
    budgetCard: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: spacing.md,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitle: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    cardValue: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.semiBold,
    },
    editButton: {
      borderColor: theme.colors.outlineVariant,
    },
    budgetEditWrap: {
      marginTop: spacing.md,
    },
    budgetInput: {
      backgroundColor: theme.colors.surfaceContainerHigh,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    actionButton: {
      flex: 1,
    },
    footerWrap: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    version: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });
