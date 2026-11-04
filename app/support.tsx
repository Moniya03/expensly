import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Appbar,
  Button,
  HelperText,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type AppTheme, borderRadius, spacing, typography, useAppTheme } from '../constants/theme';
import { submitBugReport, submitFeedback, uploadBugAttachment } from '../services/support';

type Mode = 'bug' | 'feedback';

const RATING_LABELS = ['Terrible', 'Okay', 'Good', 'Great', 'Loved it'];

export default function SupportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [mode, setMode] = useState<Mode>(params.mode === 'feedback' ? 'feedback' : 'bug');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<{ uri: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAttachment = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Photo access is needed to attach proof');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setAttachment({ uri: result.assets[0].uri });
      setError(null);
    } catch (err) {
      console.error('Attachment pick error:', err);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (mode === 'bug' && description.trim().length < 10) {
      setError('Please describe the issue in a few words');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'bug') {
        let attachmentUrl: string | undefined;
        if (attachment) {
          attachmentUrl = await uploadBugAttachment(attachment.uri);
        }
        await submitBugReport(description.trim(), attachmentUrl);
      } else {
        await submitFeedback(rating, message);
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Could not submit, please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  return (
    <Surface style={styles.root}>
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Help & feedback" />
        </Appbar.Header>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {submitted ? (
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={32} color={theme.colors.onPrimaryContainer} />
              </View>
              <Text variant="headlineSmall" style={styles.successTitle}>
                {mode === 'bug' ? 'Report sent, thanks!' : 'Thanks for the feedback!'}
              </Text>
              <Text variant="bodyMedium" style={styles.successBody}>
                {mode === 'bug'
                  ? 'Our team will look into it. You can keep using the app in the meantime.'
                  : 'Your input helps shape Expensly for the better.'}
              </Text>
              <Button
                mode="contained"
                onPress={() => router.back()}
                style={styles.doneButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Done
              </Button>
            </View>
          ) : (
            <>
              <SegmentedButtons
                value={mode}
                onValueChange={(val) => switchMode(val as Mode)}
                buttons={[
                  { value: 'bug', label: 'Report a bug' },
                  { value: 'feedback', label: 'Feedback' },
                ]}
                style={styles.segment}
              />

              {mode === 'bug' ? (
                <Surface elevation={1} style={styles.card}>
                  <Text variant="labelLarge" style={styles.label}>
                    What went wrong?
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe the issue…"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    textColor={theme.colors.onSurface}
                    outlineColor={theme.colors.outlineVariant}
                    activeOutlineColor={theme.colors.primary}
                    multiline
                    numberOfLines={4}
                    style={styles.input}
                  />

                  <Text variant="labelLarge" style={styles.label}>
                    Add proof (optional)
                  </Text>
                  <Pressable style={styles.attachButton} onPress={pickAttachment}>
                    {attachment ? (
                      <View style={styles.attachPreview}>
                        {attachment.uri.match(/\.(png|jpe?g|webp|gif)$/i) ? (
                          <Image source={{ uri: attachment.uri }} style={styles.attachImage} />
                        ) : (
                          <View style={styles.videoIcon}>
                            <Ionicons name="videocam" size={22} color={theme.colors.onPrimary} />
                          </View>
                        )}
                        <Text variant="bodyMedium" style={styles.attachFileName}>
                          Attached
                        </Text>
                        <Pressable onPress={() => setAttachment(null)} hitSlop={8}>
                          <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                        </Pressable>
                      </View>
                    ) : (
                      <>
                        <Ionicons name="image-outline" size={20} color={theme.colors.primary} />
                        <Text variant="bodyMedium" style={styles.attachText}>
                          Photo or video
                        </Text>
                      </>
                    )}
                  </Pressable>
                </Surface>
              ) : (
                <Surface elevation={1} style={styles.card}>
                  <Text variant="labelLarge" style={styles.label}>
                    How do you like Expensly?
                  </Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Pressable key={value} onPress={() => setRating(value)} hitSlop={6}>
                        <Ionicons
                          name={value <= rating ? 'star' : 'star-outline'}
                          size={34}
                          color={
                            value <= rating ? theme.colors.primary : theme.colors.outlineVariant
                          }
                        />
                      </Pressable>
                    ))}
                  </View>
                  <Text variant="bodyMedium" style={styles.ratingLabel}>
                    {RATING_LABELS[rating - 1]}
                  </Text>

                  <Text variant="labelLarge" style={styles.label}>
                    {rating === 5 ? 'What did you love?' : 'How can we improve?'}
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={message}
                    onChangeText={setMessage}
                    placeholder={rating === 5 ? 'Optional…' : 'Optional suggestions…'}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    textColor={theme.colors.onSurface}
                    outlineColor={theme.colors.outlineVariant}
                    activeOutlineColor={theme.colors.primary}
                    multiline
                    numberOfLines={4}
                    style={styles.input}
                  />
                </Surface>
              )}

              {error ? (
                <HelperText type="error" visible={Boolean(error)} style={styles.errorText}>
                  {error}
                </HelperText>
              ) : null}

              <Button
                mode="contained"
                loading={isSubmitting}
                disabled={isSubmitting}
                onPress={handleSubmit}
                style={styles.submitButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                {mode === 'bug' ? 'Send report' : 'Send feedback'}
              </Button>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Surface>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    backButton: {
      marginRight: spacing.xs,
    },
    title: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    segment: {
      marginBottom: spacing.lg,
    },
    card: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: spacing.lg,
    },
    label: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    input: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      minHeight: 110,
    },
    attachButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      minHeight: 52,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderStyle: 'dashed',
      backgroundColor: theme.colors.surfaceContainerHigh,
    },
    attachText: {
      color: theme.colors.primary,
      fontWeight: typography.fontWeight.medium,
    },
    attachPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    attachImage: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.sm,
    },
    videoIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.sm,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    attachFileName: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.medium,
    },
    starsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    ratingLabel: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    errorText: {
      marginTop: spacing.sm,
      paddingHorizontal: 0,
    },
    submitButton: {
      borderRadius: borderRadius.md,
      marginTop: spacing.lg,
    },
    buttonContent: {
      minHeight: 50,
    },
    buttonLabel: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
    successWrap: {
      alignItems: 'center',
      paddingTop: spacing.xxl,
    },
    successIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    successTitle: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
      textAlign: 'center',
    },
    successBody: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 22,
      marginTop: spacing.sm,
      marginBottom: spacing.xl,
    },
    doneButton: {
      alignSelf: 'stretch',
      borderRadius: borderRadius.md,
    },
  });
