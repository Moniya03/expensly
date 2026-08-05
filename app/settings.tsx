import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  borderRadius,
  type Colors,
  spacing,
  typography,
  useColors,
  useThemeMode,
} from '../constants/theme';
import { useUpdateProfile } from '../hooks/useProfile';
import { deleteAccount } from '../services/account';
import { exportUserData } from '../services/export';
import { useAuthStore } from '../stores/authStore';

const appVersion = (require('../package.json') as { version?: string }).version ?? '1.0.0';

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children?: React.ReactNode;
  danger?: boolean;
  onPress?: () => void;
  soon?: boolean;
  disabled?: boolean;
};

function SettingRow({ icon, label, children, danger, onPress, soon, disabled }: SettingRowProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && onPress ? { opacity: 0.6 } : null]}
      onPress={onPress}
      disabled={disabled || (!onPress && !children)}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={19} color={danger ? colors.error : colors.primary} />
      </View>
      <Text style={[styles.rowLabel, danger && { color: colors.error }]}>{label}</Text>
      {soon ? (
        <View style={styles.soonPill}>
          <Text style={styles.soonPillText}>Soon</Text>
        </View>
      ) : null}
      {children ??
        (onPress ? (
          <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceVariant} />
        ) : null)}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { mode, setMode } = useThemeMode();
  const { profile, signOut } = useAuthStore();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { mutateAsync: updateProfile, isPending: isProfileSaving } = useUpdateProfile();

  const [deleteSheetVisible, setDeleteSheetVisible] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = React.useState<'reminder' | 'alert' | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setExportError(null);
    setIsExporting(true);
    try {
      const paths = await exportUserData();
      const Sharing = require('expo-sharing');
      if (paths.length > 0) {
        await Sharing.shareAsync(paths[0], {
          mimeType: 'text/csv',
          dialogTitle: 'Export your Expensly data',
        });
      }
    } catch (err) {
      console.error('Export error:', err);
      setExportError(err instanceof Error ? err.message : 'Could not export data');
    } finally {
      setIsExporting(false);
    }
  };

  React.useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2200);
    return () => clearTimeout(timer);
  }, [feedback]);

  const togglePreference = async (
    key: 'daily_reminder_enabled' | 'budget_alert_enabled',
    next: boolean,
  ) => {
    setPendingToggle(key === 'daily_reminder_enabled' ? 'reminder' : 'alert');
    try {
      await updateProfile({ [key]: next });
      setFeedback(
        key === 'daily_reminder_enabled' ? 'Daily reminder updated' : 'Budget alert updated',
      );
    } catch (error) {
      console.error('Toggle update error:', error);
    } finally {
      setPendingToggle(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      // signOut inside deleteAccount clears the session; router resets on logout
    } catch (error) {
      console.error('Delete account error:', error);
      setDeleting(false);
      setDeleteSheetVisible(false);
      setFeedback('Could not delete account');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const reminderOn = profile?.daily_reminder_enabled ?? false;
  const alertOn = profile?.budget_alert_enabled ?? false;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.section}>
          <SettingRow icon="notifications-outline" label="Daily reminder">
            {isProfileSaving && pendingToggle === 'reminder' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Switch
                value={reminderOn}
                onValueChange={(value) => togglePreference('daily_reminder_enabled', value)}
                trackColor={{
                  false: colors.surfaceContainerHighest,
                  true: colors.primary,
                }}
                thumbColor={colors.onAccent}
              />
            )}
          </SettingRow>
          <View style={styles.divider} />
          <SettingRow icon="warning-outline" label="Budget alert">
            {isProfileSaving && pendingToggle === 'alert' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Switch
                value={alertOn}
                onValueChange={(value) => togglePreference('budget_alert_enabled', value)}
                trackColor={{
                  false: colors.surfaceContainerHighest,
                  true: colors.primary,
                }}
                thumbColor={colors.onAccent}
              />
            )}
          </SettingRow>
        </View>

        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.section}>
          <SettingRow icon="moon-outline" label="Dark mode">
            <Switch
              value={mode === 'dark'}
              onValueChange={(dark) => setMode(dark ? 'dark' : 'light')}
              trackColor={{
                false: colors.surfaceContainerHighest,
                true: colors.primary,
              }}
              thumbColor={colors.onAccent}
            />
          </SettingRow>
        </View>

        <Text style={styles.sectionLabel}>Data</Text>
        <View style={styles.section}>
          <SettingRow
            icon="download-outline"
            label="Export data"
            onPress={handleExport}
            disabled={isExporting}
          >
            {isExporting ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          </SettingRow>
          {exportError ? <Text style={styles.exportError}>{exportError}</Text> : null}
          <View style={styles.divider} />
          <SettingRow
            icon="trash-outline"
            label="Delete account"
            danger
            onPress={() => setDeleteSheetVisible(true)}
          />
        </View>

        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.section}>
          <SettingRow icon="information-circle-outline" label={`Version ${appVersion}`} />
          <View style={styles.divider} />
          <SettingRow
            icon="bug-outline"
            label="Report a bug"
            onPress={() => router.push('/support?mode=bug')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="star-outline"
            label="Send feedback"
            onPress={() => router.push('/support?mode=feedback')}
          />
        </View>

        {feedback ? <Text style={styles.toast}>{feedback}</Text> : null}

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={deleteSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteSheetVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => !deleting && setDeleteSheetVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetIconWrap}>
              <Ionicons name="trash-outline" size={24} color={colors.error} />
            </View>
            <Text style={styles.sheetTitle}>Delete account?</Text>
            <Text style={styles.sheetBody}>
              This permanently removes your account and all your transactions, budgets and goals.
              This cannot be undone.
            </Text>
            <View style={styles.sheetActions}>
              <Pressable
                style={[styles.sheetButton, styles.sheetCancel]}
                onPress={() => setDeleteSheetVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.sheetButton, styles.sheetDelete]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.onAccent} />
                ) : (
                  <Text style={styles.sheetDeleteText}>Delete</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceContainer,
      marginRight: spacing.sm,
    },
    title: {
      color: colors.onSurface,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    sectionLabel: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    section: {
      backgroundColor: colors.surfaceContainer,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      minHeight: 56,
    },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(26,107,255,0.10)',
      marginRight: spacing.md,
    },
    rowIconDanger: {
      backgroundColor: 'rgba(255,113,108,0.10)',
    },
    rowLabel: {
      flex: 1,
      color: colors.onSurface,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.medium,
    },
    divider: {
      height: 1,
      backgroundColor: colors.outlineVariant,
      marginLeft: spacing.md + 34 + spacing.md,
    },
    soonPill: {
      backgroundColor: 'rgba(26,107,255,0.12)',
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    soonPillText: {
      color: colors.primary,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semiBold,
    },
    exportError: {
      color: colors.error,
      fontSize: typography.fontSize.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    toast: {
      color: colors.secondary,
      fontSize: typography.fontSize.sm,
      marginTop: spacing.md,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.error,
      marginTop: spacing.xl,
    },
    signOutText: {
      color: colors.error,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
      marginLeft: spacing.sm,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(4,6,12,0.82)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    sheet: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surfaceContainer,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      padding: spacing.lg,
      alignItems: 'center',
    },
    sheetIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,113,108,0.10)',
      marginBottom: spacing.md,
    },
    sheetTitle: {
      color: colors.onSurface,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
    },
    sheetBody: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.sm,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: spacing.sm,
    },
    sheetActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
      alignSelf: 'stretch',
    },
    sheetButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetCancel: {
      backgroundColor: colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    sheetCancelText: {
      color: colors.onSurface,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
    sheetDelete: {
      backgroundColor: colors.error,
    },
    sheetDeleteText: {
      color: colors.onAccent,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
  });
