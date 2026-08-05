import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { borderRadius, type Colors, spacing, typography, useColors } from '../constants/theme';
import { submitBugReport, submitFeedback, uploadBugAttachment } from '../services/support';

type Mode = 'bug' | 'feedback';

const RATING_LABELS = ['Terrible', 'Okay', 'Good', 'Great', 'Loved it'];

export default function SupportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Help & feedback</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {submitted ? (
          <View style={styles.successWrap}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={32} color={colors.onAccent} />
            </View>
            <Text style={styles.successTitle}>
              {mode === 'bug' ? 'Report sent, thanks!' : 'Thanks for the feedback!'}
            </Text>
            <Text style={styles.successBody}>
              {mode === 'bug'
                ? 'Our team will look into it. You can keep using the app in the meantime.'
                : 'Your input helps shape Expensly for the better.'}
            </Text>
            <Pressable style={styles.doneButton} onPress={() => router.back()}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.segment}>
              <Pressable
                style={[styles.segmentButton, mode === 'bug' && styles.segmentActive]}
                onPress={() => switchMode('bug')}
              >
                <Text style={[styles.segmentText, mode === 'bug' && styles.segmentTextActive]}>
                  Report a bug
                </Text>
              </Pressable>
              <Pressable
                style={[styles.segmentButton, mode === 'feedback' && styles.segmentActive]}
                onPress={() => switchMode('feedback')}
              >
                <Text style={[styles.segmentText, mode === 'feedback' && styles.segmentTextActive]}>
                  Feedback
                </Text>
              </Pressable>
            </View>

            {mode === 'bug' ? (
              <View style={styles.card}>
                <Text style={styles.label}>What went wrong?</Text>
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the issue…"
                  placeholderTextColor={colors.onSurfaceVariant}
                  selectionColor={colors.primary}
                  multiline
                  textAlignVertical="top"
                />

                <Text style={styles.label}>Add proof (optional)</Text>
                <Pressable style={styles.attachButton} onPress={pickAttachment}>
                  {attachment ? (
                    <View style={styles.attachPreview}>
                      {attachment.uri.match(/\.(png|jpe?g|webp|gif)$/i) ? (
                        <Image source={{ uri: attachment.uri }} style={styles.attachImage} />
                      ) : (
                        <View style={styles.videoIcon}>
                          <Ionicons name="videocam" size={22} color={colors.onAccent} />
                        </View>
                      )}
                      <Text style={styles.attachFileName}>Attached</Text>
                      <Pressable onPress={() => setAttachment(null)} hitSlop={8}>
                        <Ionicons name="close-circle" size={20} color={colors.error} />
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={20} color={colors.primary} />
                      <Text style={styles.attachText}>Photo or video</Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.label}>How do you like Expensly?</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Pressable key={value} onPress={() => setRating(value)} hitSlop={6}>
                      <Ionicons
                        name={value <= rating ? 'star' : 'star-outline'}
                        size={34}
                        color={value <= rating ? '#F5A623' : colors.outlineVariant}
                      />
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.ratingLabel}>{RATING_LABELS[rating - 1]}</Text>

                <Text style={styles.label}>
                  {rating === 5 ? 'What did you love?' : 'How can we improve?'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={message}
                  onChangeText={setMessage}
                  placeholder={rating === 5 ? 'Optional…' : 'Optional suggestions…'}
                  placeholderTextColor={colors.onSurfaceVariant}
                  selectionColor={colors.primary}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.onAccent} />
              ) : (
                <Text style={styles.submitText}>
                  {mode === 'bug' ? 'Send report' : 'Send feedback'}
                </Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
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
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceContainer,
      borderRadius: borderRadius.md,
      padding: 4,
      marginBottom: spacing.lg,
    },
    segmentButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentActive: {
      backgroundColor: colors.surfaceContainerHigh,
    },
    segmentText: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
    },
    segmentTextActive: {
      color: colors.onSurface,
      fontWeight: typography.fontWeight.semiBold,
    },
    card: {
      backgroundColor: colors.surfaceContainer,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      padding: spacing.lg,
    },
    label: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    input: {
      minHeight: 110,
      backgroundColor: colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      color: colors.onSurface,
      fontSize: typography.fontSize.md,
    },
    attachButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      minHeight: 52,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderStyle: 'dashed',
      backgroundColor: colors.surfaceContainerHigh,
    },
    attachText: {
      color: colors.primary,
      fontSize: typography.fontSize.md,
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
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    attachFileName: {
      color: colors.onSurface,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
    },
    starsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    ratingLabel: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.sm,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    errorText: {
      color: colors.error,
      fontSize: typography.fontSize.sm,
      marginTop: spacing.md,
    },
    submitButton: {
      minHeight: 52,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.lg,
    },
    submitText: {
      color: colors.onAccent,
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
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    successTitle: {
      color: colors.onSurface,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      textAlign: 'center',
    },
    successBody: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.md,
      textAlign: 'center',
      lineHeight: 22,
      marginTop: spacing.sm,
      marginBottom: spacing.xl,
    },
    doneButton: {
      alignSelf: 'stretch',
      minHeight: 52,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    doneButtonText: {
      color: colors.onAccent,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
  });
