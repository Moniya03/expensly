import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Pressable, View, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../constants/theme';
import { AudioWaveform } from './ui/AudioWaveform';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { useAuthStore } from '../stores/authStore';
import { processVoiceExpense, audioUriToBase64 } from '../services/voiceExpense';
import { useCreateTransaction } from '../hooks/useTransactions';
import { VoiceExpenseConfirmationSheet } from './voice/VoiceExpenseConfirmationSheet';
import type { CreateTransactionInput, VoiceExpenseDraft, VoiceExpenseResponse } from '../types';

function normalizeDraft(response: VoiceExpenseResponse): {
  draft: VoiceExpenseDraft | null;
  transcription: string;
  parseMeta: VoiceExpenseResponse['parse_meta'];
} {
  return {
    draft: response.draft ?? null,
    transcription: response.transcription?.text ?? '',
    parseMeta: response.parse_meta ?? null,
  };
}

export default function VoiceFAB() {
  const {
    state,
    setState,
    errorMessage,
    setErrorMessage,
    startRecording,
    stopRecording,
    reset,
    cancelRecording,
  } = useVoiceRecording();

  const { session } = useAuthStore();
  const router = useRouter();
  const { mutateAsync: createTransaction } = useCreateTransaction();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const longPressTriggered = useRef(false);

  const [draft, setDraft] = useState<VoiceExpenseDraft | null>(null);
  const [transcription, setTranscription] = useState('');
  const [parseMeta, setParseMeta] = useState<VoiceExpenseResponse['parse_meta']>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;

    if (state === 'recording') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => loop?.stop();
  }, [pulseAnim, state]);

  const inlineErrorMessage = useMemo(
    () => (state === 'error' && errorMessage ? "Couldn't understand that. Please re-record." : null),
    [errorMessage, state]
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

      if (!response.success || !response.draft) {
        setErrorMessage(response.error || 'Failed to process voice expense');
        setState('error');
        return;
      }

      const normalized = normalizeDraft(response);
      setDraft(normalized.draft);
      setTranscription(normalized.transcription);
      setParseMeta(normalized.parseMeta);
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

  const handleSave = async (transaction: CreateTransactionInput) => {
    try {
      setIsSaving(true);
      await createTransaction(transaction);
      setShowSheet(false);
      setDraft(null);
      setTranscription('');
      setParseMeta(null);
      setErrorMessage(null);
      reset();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save expense');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReRecord = async () => {
    setShowSheet(false);
    setDraft(null);
    setTranscription('');
    setParseMeta(null);
    await cancelRecording();
    reset();
  };

  const handleCancel = async () => {
    setShowSheet(false);
    setDraft(null);
    setTranscription('');
    setParseMeta(null);
    await cancelRecording();
    reset();
  };

  const getButtonColors = (): [string, string] => {
    switch (state) {
      case 'error':
        return [colors.error, colors.error];
      default:
        return [colors.primary, colors.secondary];
    }
  };

  const getIcon = () => {
    switch (state) {
      case 'processing':
        return <Text style={styles.processingText}>...</Text>;
      case 'error':
        return <Ionicons name="close" size={32} color="#FFFFFF" />;
      default:
        return <Ionicons name="mic" size={32} color="#FFFFFF" />;
    }
  };

  return (
    <>
      <View style={styles.container} pointerEvents="box-none">
        {inlineErrorMessage ? (
          <View style={styles.errorBanner}>
            <Text numberOfLines={1} style={styles.errorText}>
              {inlineErrorMessage}
            </Text>
          </View>
        ) : null}

        <Text style={styles.hint}>Long press for manual</Text>

        <Pressable
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={500}
          disabled={state === 'processing'}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <LinearGradient
              colors={getButtonColors()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <View style={styles.contentWrapper}>
                {getIcon()}
                {state === 'recording' && <AudioWaveform isActive={true} barCount={5} />}
              </View>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </View>

      <VoiceExpenseConfirmationSheet
        visible={showSheet}
        draft={draft}
        transcription={transcription}
        parseMeta={parseMeta}
        isSaving={isSaving}
        errorMessage={errorMessage}
        onSave={handleSave}
        onReRecord={handleReRecord}
        onCancel={handleCancel}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  errorBanner: {
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxWidth: 260,
    alignSelf: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  button: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
  contentWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 28,
  },
});
