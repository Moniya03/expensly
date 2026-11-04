import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type React from 'react';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Dialog,
  Divider,
  Portal,
  Snackbar,
  Surface,
  Switch,
  Text,
  TouchableRipple,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
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
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableRipple
      style={styles.row}
      onPress={onPress}
      disabled={disabled || (!onPress && !children)}
      rippleColor={danger ? theme.colors.errorContainer : undefined}
    >
      <View style={styles.rowContent}>
        <View
          style={[
            styles.rowIcon,
            {
              backgroundColor: danger ? theme.colors.errorContainer : theme.colors.primaryContainer,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={19}
            color={danger ? theme.colors.error : theme.colors.primary}
          />
        </View>
        <Text
          variant="bodyLarge"
          style={[styles.rowLabel, { color: danger ? theme.colors.error : theme.colors.onSurface }]}
        >
          {label}
        </Text>
        {soon ? (
          <View style={[styles.soonPill, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Text
              variant="labelSmall"
              style={[styles.soonPillText, { color: theme.colors.primary }]}
            >
              Soon
            </Text>
          </View>
        ) : null}
        {children ??
          (onPress ? (
            <Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceVariant} />
          ) : null)}
      </View>
    </TouchableRipple>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { mode, setMode } = useThemeMode();
  const { profile, signOut } = useAuthStore();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { mutateAsync: updateProfile, isPending: isProfileSaving } = useUpdateProfile();

  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<'reminder' | 'alert' | null>(null);
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
    <Surface style={[styles.root, { backgroundColor: theme.colors.surface }]}>
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Settings" />
        </Appbar.Header>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text
            variant="labelLarge"
            style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}
          >
            Notifications
          </Text>
          <Surface
            elevation={1}
            style={[
              styles.section,
              {
                backgroundColor: theme.colors.surfaceContainer,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <SettingRow icon="notifications-outline" label="Daily reminder">
              {isProfileSaving && pendingToggle === 'reminder' ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Switch
                  value={reminderOn}
                  onValueChange={(value) => togglePreference('daily_reminder_enabled', value)}
                  color={theme.colors.primary}
                />
              )}
            </SettingRow>
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
            <SettingRow icon="warning-outline" label="Budget alert">
              {isProfileSaving && pendingToggle === 'alert' ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Switch
                  value={alertOn}
                  onValueChange={(value) => togglePreference('budget_alert_enabled', value)}
                  color={theme.colors.primary}
                />
              )}
            </SettingRow>
          </Surface>

          <Text
            variant="labelLarge"
            style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}
          >
            Appearance
          </Text>
          <Surface
            elevation={1}
            style={[
              styles.section,
              {
                backgroundColor: theme.colors.surfaceContainer,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <SettingRow icon="moon-outline" label="Dark mode">
              <Switch
                value={mode === 'dark'}
                onValueChange={(dark) => setMode(dark ? 'dark' : 'light')}
                color={theme.colors.primary}
              />
            </SettingRow>
          </Surface>

          <Text
            variant="labelLarge"
            style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}
          >
            Data
          </Text>
          <Surface
            elevation={1}
            style={[
              styles.section,
              {
                backgroundColor: theme.colors.surfaceContainer,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <SettingRow
              icon="download-outline"
              label="Export data"
              onPress={handleExport}
              disabled={isExporting}
            >
              {isExporting ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
            </SettingRow>
            {exportError ? (
              <Text variant="bodySmall" style={[styles.exportError, { color: theme.colors.error }]}>
                {exportError}
              </Text>
            ) : null}
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
            <SettingRow
              icon="trash-outline"
              label="Delete account"
              danger
              onPress={() => setDeleteSheetVisible(true)}
            />
          </Surface>

          <Text
            variant="labelLarge"
            style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}
          >
            About
          </Text>
          <Surface
            elevation={1}
            style={[
              styles.section,
              {
                backgroundColor: theme.colors.surfaceContainer,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <SettingRow icon="information-circle-outline" label={`Version ${appVersion}`} />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
            <SettingRow
              icon="bug-outline"
              label="Report a bug"
              onPress={() => router.push('/support?mode=bug')}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
            <SettingRow
              icon="star-outline"
              label="Send feedback"
              onPress={() => router.push('/support?mode=feedback')}
            />
          </Surface>

          <Button
            mode="outlined"
            icon="logout"
            textColor={theme.colors.error}
            style={[styles.signOutButton, { borderColor: theme.colors.error }]}
            contentStyle={styles.signOutButtonContent}
            onPress={handleSignOut}
          >
            Sign out
          </Button>
        </ScrollView>

        <Snackbar visible={Boolean(feedback)} onDismiss={() => setFeedback(null)} duration={2500}>
          {feedback}
        </Snackbar>

        <Portal>
          <Dialog
            visible={deleteSheetVisible}
            onDismiss={() => {
              if (!deleting) setDeleteSheetVisible(false);
            }}
          >
            <Dialog.Icon icon="trash-can-outline" color={theme.colors.error} />
            <Dialog.Title style={styles.dialogTitle}>Delete Account</Dialog.Title>
            <Dialog.Content>
              <Text
                variant="bodyMedium"
                style={[styles.dialogBody, { color: theme.colors.onSurfaceVariant }]}
              >
                This permanently removes your account and all your transactions, budgets and goals.
                This cannot be undone.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => setDeleteSheetVisible(false)}
                disabled={deleting}
                textColor={theme.colors.onSurface}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                buttonColor={theme.colors.error}
                textColor={theme.colors.onError}
                loading={deleting}
                disabled={deleting}
                onPress={handleDelete}
              >
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </Surface>
  );
}

const createStyles = (_theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    backButton: {
      marginRight: spacing.xs,
    },
    title: {
      fontWeight: typography.fontWeight.bold,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    sectionLabel: {
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    section: {
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      overflow: 'hidden',
    },
    row: {
      minHeight: 56,
      justifyContent: 'center',
    },
    rowContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      minHeight: 56,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    rowLabel: {
      flex: 1,
      fontWeight: typography.fontWeight.medium,
    },
    divider: {
      marginLeft: spacing.md + 36 + spacing.md,
    },
    soonPill: {
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      marginRight: spacing.xs,
    },
    soonPillText: {
      fontWeight: typography.fontWeight.semiBold,
    },
    exportError: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    signOutButton: {
      marginTop: spacing.xl,
      borderRadius: borderRadius.md,
    },
    signOutButtonContent: {
      minHeight: 48,
    },
    dialogTitle: {
      textAlign: 'center',
    },
    dialogBody: {
      textAlign: 'center',
      lineHeight: 20,
    },
  });
