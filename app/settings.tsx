import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
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
  RadioButton,
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
import {
  exportBackupJson,
  type ParsedBackupFile,
  pickAndValidateBackupFile,
  restoreBackupData,
} from '../services/backup';
import { exportUserData } from '../services/export';
import { useAuthStore } from '../stores/authStore';

const appVersion = (require('../package.json') as { version?: string }).version ?? '1.0.0';

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  children?: React.ReactNode;
  danger?: boolean;
  onPress?: () => void;
  soon?: boolean;
  disabled?: boolean;
};

function SettingRow({
  icon,
  label,
  description,
  children,
  danger,
  onPress,
  soon,
  disabled,
}: SettingRowProps) {
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
        <View style={styles.rowLabelContainer}>
          <Text
            variant="bodyLarge"
            style={[
              styles.rowLabel,
              { color: danger ? theme.colors.error : theme.colors.onSurface },
            ]}
          >
            {label}
          </Text>
          {description ? (
            <Text
              variant="bodySmall"
              style={[styles.rowDescription, { color: theme.colors.onSurfaceVariant }]}
            >
              {description}
            </Text>
          ) : null}
        </View>
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
  const queryClient = useQueryClient();
  const theme = useAppTheme();
  const { mode, setMode } = useThemeMode();
  const { profile, signOut } = useAuthStore();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { mutateAsync: updateProfile, isPending: isProfileSaving } = useUpdateProfile();

  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<'reminder' | 'alert' | null>(null);

  // Backup & Restore states
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Restore dialog state
  const [restoreConfirmVisible, setRestoreConfirmVisible] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<ParsedBackupFile | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');

  const handleBackupJson = async () => {
    setDataError(null);
    setIsBackingUp(true);
    try {
      const res = await exportBackupJson();
      setFeedback(
        `Backup created! Exported ${res.counts.transactions} expenses, ${res.counts.budgets} budgets, and ${res.counts.goals} goals.`,
      );
    } catch (err) {
      console.error('Backup error:', err);
      setDataError(err instanceof Error ? err.message : 'Could not create backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestorePick = async () => {
    setDataError(null);
    setIsPickingFile(true);
    try {
      const parsedFile = await pickAndValidateBackupFile();
      if (!parsedFile) {
        return; // User cancelled picker
      }
      setSelectedBackup(parsedFile);
      setRestoreMode('merge');
      setRestoreConfirmVisible(true);
    } catch (err) {
      console.error('Restore pick error:', err);
      setDataError(err instanceof Error ? err.message : 'Invalid backup file');
    } finally {
      setIsPickingFile(false);
    }
  };

  const handleExecuteRestore = async () => {
    const userId = useAuthStore.getState().session?.user?.id;
    if (!userId || !selectedBackup) return;

    setDataError(null);
    setIsRestoring(true);
    try {
      const summary = await restoreBackupData(userId, selectedBackup.backup, restoreMode);

      // Invalidate all related query caches across the application
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['budgets'] }),
        queryClient.invalidateQueries({ queryKey: ['goals'] }),
        queryClient.invalidateQueries({ queryKey: ['goal-icons'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);

      setRestoreConfirmVisible(false);
      setSelectedBackup(null);

      if (restoreMode === 'merge') {
        const skippedMsg =
          summary.transactionsSkipped > 0
            ? ` (${summary.transactionsSkipped} duplicates skipped)`
            : '';
        setFeedback(`Restore complete! Added ${summary.totalImported} items${skippedMsg}.`);
      } else {
        setFeedback(`Data replaced! Successfully restored ${summary.totalImported} items.`);
      }
    } catch (err) {
      console.error('Restore execution error:', err);
      setDataError(err instanceof Error ? err.message : 'Failed to restore backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExportCsv = async () => {
    setDataError(null);
    setIsExportingCsv(true);
    try {
      const paths = await exportUserData();
      if (paths.length > 0) {
        await Sharing.shareAsync(paths[0], {
          mimeType: 'text/csv',
          dialogTitle: 'Export your Expensly data',
        });
      }
    } catch (err) {
      console.error('Export CSV error:', err);
      setDataError(err instanceof Error ? err.message : 'Could not export data');
    } finally {
      setIsExportingCsv(false);
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
            Data & Backup
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
              icon="cloud-upload-outline"
              label="Backup data (JSON)"
              description="Export expenses, budgets & goals into a JSON file"
              onPress={handleBackupJson}
              disabled={isBackingUp || isRestoring || isExportingCsv || isPickingFile}
            >
              {isBackingUp ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
            </SettingRow>

            <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

            <SettingRow
              icon="cloud-download-outline"
              label="Restore data (JSON)"
              description="Import and recover from an Expensly backup"
              onPress={handleRestorePick}
              disabled={isBackingUp || isRestoring || isExportingCsv || isPickingFile}
            >
              {isPickingFile || isRestoring ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : null}
            </SettingRow>

            <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

            <SettingRow
              icon="document-text-outline"
              label="Export as CSV"
              description="Spreadsheet files for Excel or Google Sheets"
              onPress={handleExportCsv}
              disabled={isBackingUp || isRestoring || isExportingCsv || isPickingFile}
            >
              {isExportingCsv ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : null}
            </SettingRow>

            {dataError ? (
              <Text variant="bodySmall" style={[styles.dataError, { color: theme.colors.error }]}>
                {dataError}
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
            visible={restoreConfirmVisible}
            onDismiss={() => {
              if (!isRestoring) {
                setRestoreConfirmVisible(false);
                setSelectedBackup(null);
              }
            }}
            style={{
              backgroundColor: theme.colors.surfaceContainerHigh,
              borderRadius: borderRadius.xl,
            }}
          >
            <Dialog.Icon icon="cloud-download-outline" color={theme.colors.primary} />
            <Dialog.Title style={styles.dialogTitle}>Restore Data</Dialog.Title>
            <Dialog.Content>
              {selectedBackup ? (
                <View>
                  <Surface
                    elevation={0}
                    style={[
                      styles.backupInfoBox,
                      {
                        backgroundColor: theme.colors.surfaceContainer,
                        borderColor: theme.colors.outlineVariant,
                      },
                    ]}
                  >
                    <View style={styles.backupFileInfoRow}>
                      <Ionicons
                        name="document-text-outline"
                        size={18}
                        color={theme.colors.primary}
                        style={{ marginRight: spacing.xs }}
                      />
                      <Text
                        variant="bodyMedium"
                        numberOfLines={1}
                        style={[styles.backupFileName, { color: theme.colors.onSurface }]}
                      >
                        {selectedBackup.fileName}
                      </Text>
                    </View>

                    <View style={styles.countPillsContainer}>
                      <View
                        style={[
                          styles.countPill,
                          { backgroundColor: theme.colors.primaryContainer },
                        ]}
                      >
                        <Text
                          variant="labelSmall"
                          style={{ color: theme.colors.onPrimaryContainer, fontWeight: '600' }}
                        >
                          {selectedBackup.counts.transactions} Expenses
                        </Text>
                      </View>

                      {selectedBackup.counts.budgets > 0 ? (
                        <View
                          style={[
                            styles.countPill,
                            { backgroundColor: theme.colors.secondaryContainer },
                          ]}
                        >
                          <Text
                            variant="labelSmall"
                            style={{ color: theme.colors.onSecondaryContainer, fontWeight: '600' }}
                          >
                            {selectedBackup.counts.budgets} Budgets
                          </Text>
                        </View>
                      ) : null}

                      {selectedBackup.counts.goals > 0 ? (
                        <View
                          style={[
                            styles.countPill,
                            { backgroundColor: theme.colors.tertiaryContainer },
                          ]}
                        >
                          <Text
                            variant="labelSmall"
                            style={{ color: theme.colors.onTertiaryContainer, fontWeight: '600' }}
                          >
                            {selectedBackup.counts.goals} Goals
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </Surface>

                  <Text
                    variant="labelMedium"
                    style={[styles.restoreModeTitle, { color: theme.colors.onSurfaceVariant }]}
                  >
                    HOW WOULD YOU LIKE TO RESTORE?
                  </Text>

                  {/* Smart Merge */}
                  <TouchableRipple
                    onPress={() => setRestoreMode('merge')}
                    disabled={isRestoring}
                    style={[
                      styles.modeOptionCard,
                      {
                        backgroundColor:
                          restoreMode === 'merge'
                            ? theme.colors.primaryContainer
                            : theme.colors.surfaceContainer,
                        borderColor:
                          restoreMode === 'merge'
                            ? theme.colors.primary
                            : theme.colors.outlineVariant,
                      },
                    ]}
                  >
                    <View style={styles.modeOptionInner}>
                      <RadioButton.Android
                        value="merge"
                        status={restoreMode === 'merge' ? 'checked' : 'unchecked'}
                        onPress={() => setRestoreMode('merge')}
                        color={theme.colors.primary}
                        disabled={isRestoring}
                      />
                      <View style={{ flex: 1, marginLeft: spacing.xs }}>
                        <Text
                          variant="bodyMedium"
                          style={{
                            fontWeight: typography.fontWeight.semiBold,
                            color:
                              restoreMode === 'merge'
                                ? theme.colors.onPrimaryContainer
                                : theme.colors.onSurface,
                          }}
                        >
                          Smart Merge (Recommended)
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={{
                            color:
                              restoreMode === 'merge'
                                ? theme.colors.onPrimaryContainer
                                : theme.colors.onSurfaceVariant,
                            marginTop: 2,
                          }}
                        >
                          Keeps existing data and only adds new items. Duplicates are safely
                          skipped.
                        </Text>
                      </View>
                    </View>
                  </TouchableRipple>

                  {/* Replace */}
                  <TouchableRipple
                    onPress={() => setRestoreMode('replace')}
                    disabled={isRestoring}
                    style={[
                      styles.modeOptionCard,
                      {
                        backgroundColor:
                          restoreMode === 'replace'
                            ? theme.colors.errorContainer
                            : theme.colors.surfaceContainer,
                        borderColor:
                          restoreMode === 'replace'
                            ? theme.colors.error
                            : theme.colors.outlineVariant,
                        marginTop: spacing.sm,
                      },
                    ]}
                  >
                    <View style={styles.modeOptionInner}>
                      <RadioButton.Android
                        value="replace"
                        status={restoreMode === 'replace' ? 'checked' : 'unchecked'}
                        onPress={() => setRestoreMode('replace')}
                        color={theme.colors.error}
                        disabled={isRestoring}
                      />
                      <View style={{ flex: 1, marginLeft: spacing.xs }}>
                        <Text
                          variant="bodyMedium"
                          style={{
                            fontWeight: typography.fontWeight.semiBold,
                            color:
                              restoreMode === 'replace'
                                ? theme.colors.onErrorContainer
                                : theme.colors.onSurface,
                          }}
                        >
                          Replace All Existing Data
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={{
                            color:
                              restoreMode === 'replace'
                                ? theme.colors.onErrorContainer
                                : theme.colors.onSurfaceVariant,
                            marginTop: 2,
                          }}
                        >
                          ⚠️ Wipes all current expenses, budgets, and goals, and replaces them with
                          this backup.
                        </Text>
                      </View>
                    </View>
                  </TouchableRipple>
                </View>
              ) : null}
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setRestoreConfirmVisible(false);
                  setSelectedBackup(null);
                }}
                disabled={isRestoring}
                textColor={theme.colors.onSurface}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                buttonColor={restoreMode === 'replace' ? theme.colors.error : theme.colors.primary}
                textColor={
                  restoreMode === 'replace' ? theme.colors.onError : theme.colors.onPrimary
                }
                loading={isRestoring}
                disabled={isRestoring || !selectedBackup}
                onPress={handleExecuteRestore}
              >
                {restoreMode === 'replace' ? 'Replace & Restore' : 'Restore'}
              </Button>
            </Dialog.Actions>
          </Dialog>

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
    rowLabelContainer: {
      flex: 1,
    },
    rowDescription: {
      marginTop: 2,
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
    dataError: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    backupInfoBox: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    backupFileInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    backupFileName: {
      fontWeight: typography.fontWeight.semiBold,
      flex: 1,
    },
    countPillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    countPill: {
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    restoreModeTitle: {
      fontWeight: typography.fontWeight.bold,
      letterSpacing: 0.8,
      marginBottom: spacing.xs,
      marginTop: spacing.xs,
    },
    modeOptionCard: {
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      padding: spacing.sm,
      overflow: 'hidden',
    },
    modeOptionInner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
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
