import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { type AppTheme, useAppTheme } from '../constants/theme';
import { useCreateTransaction } from '../hooks/useTransactions';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { audioUriToBase64, processVoiceExpense } from '../services/voiceExpense';
import { useAuthStore } from '../stores/authStore';
import type { CreateTransactionInput, VoiceExpenseDraft, VoiceExpenseResponse } from '../types';
import { AudioWaveform } from './ui/AudioWaveform';
import { VoiceExpenseConfirmationSheet } from './voice/VoiceExpenseConfirmationSheet';

function hexToRgba(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const raw = color.slice(1);
    if (raw.length === 6) {
      const r = Number.parseInt(raw.slice(0, 2), 16);
      const g = Number.parseInt(raw.slice(2, 4), 16);
      const b = Number.parseInt(raw.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return color;
}

function normalizeDraft(response: VoiceExpenseResponse): {
  drafts: VoiceExpenseDraft[];
  transcription: string;
} {
  return {
    drafts: response.drafts ?? [],
    transcription: response.transcription?.text ?? '',
  };
}

export default function VoiceFAB() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {
    state,
    setState,
    errorMessage,
    setErrorMessage,
    startRecording,
    stopRecording,
    reset,
    cancelRecording,
  } = useVoiceRecording(() => {
    // Auto-stopped by 5s of silence: parse and show the add-expense sheet
    handleStopAndParse();
  });

  const { session } = useAuthStore();
  const router = useRouter();
  const { mutateAsync: createTransaction } = useCreateTransaction();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const idlePulse = useRef(new Animated.Value(0.3)).current;
  const longPressTriggered = useRef(false);

  const [drafts, setDrafts] = useState<VoiceExpenseDraft[]>([]);
  const [transcription, setTranscription] = useState('');
  const [showSheet, setShowSheet] = useState(false);

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let idleLoop: Animated.CompositeAnimation | undefined;

    idleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(idlePulse, {
          toValue: 0.48,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(idlePulse, {
          toValue: 0.3,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    );
    idleLoop.start();

    if (state === 'recording') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      loop?.stop();
      idleLoop?.stop();
    };
  }, [idlePulse, pulseAnim, state]);

  const inlineErrorMessage = useMemo(
    () =>
      state === 'error' && errorMessage ? "Couldn't understand that. Please re-record." : null,
    [errorMessage, state],
  );

  const handleLongPress = () => {
    if (state === 'idle') {
      longPressTriggered.current = true;
      router.push('/transaction/add' as never);
    }
  };

  const handleRecordPress = async () => {
    try {
      if (state !== 'idle') return;
      await startRecording();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start recording');
      setState('error');
    }
  };

  const handleStopAndParse = async () => {
    try {
      setState('processing');
      const audioUri = await stopRecording();

      if (!audioUri) {
        setErrorMessage('Failed to get recording');
        setState('error');
        return;
      }

      const userId = session?.user?.id;
      if (!userId) {
        setErrorMessage('You must be logged in to record expenses');
        setState('error');
        return;
      }

      const audioBase64 = await audioUriToBase64(audioUri);
      const response = await processVoiceExpense(audioBase64, userId);

      if (!response.success || !response.drafts?.length) {
        setErrorMessage(response.error || 'Failed to process voice expense');
        setState('error');
        return;
      }

      const normalized = normalizeDraft(response);
      setDrafts(normalized.drafts);
      setTranscription(normalized.transcription);
      setShowSheet(true);
      setErrorMessage(null);
      setState('idle');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      setState('error');
    }
  };

  const handlePress = async () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }

    if (state === 'idle') {
      await handleRecordPress();
      return;
    }

    if (state === 'error') {
      reset();
      await handleRecordPress();
      return;
    }

    if (state === 'recording') {
      await handleStopAndParse();
    }
  };

  const handleSaveSingle = useCallback(
    async (transaction: CreateTransactionInput) => {
      await createTransaction(transaction);
    },
    [createTransaction],
  );

  const handleCancel = useCallback(async () => {
    setShowSheet(false);
    setDrafts([]);
    setTranscription('');
    await cancelRecording();
    reset();
  }, [cancelRecording, reset]);

  const getButtonBackgroundColor = () => {
    switch (state) {
      case 'recording':
        return theme.colors.error;
      case 'error':
        return theme.colors.errorContainer;
      default:
        return theme.colors.primary;
    }
  };

  const getIcon = () => {
    const iconColor = state === 'error' ? theme.colors.onErrorContainer : theme.colors.onPrimary;

    switch (state) {
      case 'processing':
        return <Text style={[styles.processingText, { color: iconColor }]}>...</Text>;
      case 'error':
        return <Ionicons name="close" size={24} color={iconColor} />;
      default:
        return <Ionicons name="mic" size={24} color={iconColor} />;
    }
  };

  return (
    <>
      <View style={styles.container} pointerEvents="box-none">
        {inlineErrorMessage ? (
          <View style={styles.errorBanner}>
            <Text variant="bodySmall" numberOfLines={1} style={styles.errorText}>
              {inlineErrorMessage}
            </Text>
          </View>
        ) : null}

        <Text variant="labelSmall" style={styles.hint}>
          Long press for manual
        </Text>

        <Pressable
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={500}
          disabled={state === 'processing'}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.idleAura,
              {
                opacity: idlePulse,
                transform: [
                  {
                    scale: idlePulse.interpolate({
                      inputRange: [0.3, 0.55],
                      outputRange: [0.96, 1.06],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={[styles.button, { backgroundColor: getButtonBackgroundColor() }]}>
              <View style={styles.contentWrapper}>
                {getIcon()}
                {state === 'recording' && <AudioWaveform isActive={true} barCount={5} />}
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </View>

      <VoiceExpenseConfirmationSheet
        visible={showSheet}
        drafts={drafts}
        transcription={transcription}
        onSaveSingle={handleSaveSingle}
        onCancel={handleCancel}
      />
    </>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 12,
      alignItems: 'center',
      zIndex: 1000,
    },
    hint: {
      marginBottom: 8,
      color: theme.colors.onSurfaceVariant,
    },
    errorBanner: {
      marginBottom: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.colors.errorContainer,
      maxWidth: 260,
      alignSelf: 'center',
    },
    errorText: {
      color: theme.colors.onErrorContainer,
      textAlign: 'center',
    },
    button: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 6,
    },
    idleAura: {
      position: 'absolute',
      width: 64,
      height: 64,
      borderRadius: 32,
      alignSelf: 'center',
      top: -8,
      backgroundColor: hexToRgba(theme.colors.primary, 0.12),
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.primary, 0.24),
    },
    contentWrapper: {
      alignItems: 'center',
      gap: 0,
    },
    processingText: {
      fontSize: 28,
      lineHeight: 28,
    },
  });
