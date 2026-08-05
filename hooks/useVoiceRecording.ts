import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'success' | 'error';

export interface UseVoiceRecordingReturn {
  state: RecordingState;
  setState: (state: RecordingState) => void;
  duration: number;
  errorMessage: string | null;
  setErrorMessage: (message: string | null) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => Promise<void>;
  reset: () => void;
}

const MAX_RECORDING_DURATION = 30000; // 30 seconds in milliseconds

// Silence detection: dBFS ranges -160 (min) to 0 (max). Speech peaks around
// -20..-40; a quiet room sits below -60. -50 cleanly separates the two.
const SILENCE_THRESHOLD_DB = -50;
const SILENCE_TIMEOUT_MS = 5000; // auto-stop after 5s of no speech
const METERING_POLL_MS = 250;

export function useVoiceRecording(onAutoStop?: () => void): UseVoiceRecordingReturn {
  // State management
  const [state, setState] = useState<RecordingState>('idle');
  const [, setRecording] = useState<Audio.Recording | null>(null);
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // The current Recording, in a ref so timers and cleanup always see the
  // live object instead of a stale render closure.
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Refs for timers
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep the latest auto-stop callback without re-creating the interval
  const onAutoStopRef = useRef(onAutoStop);
  onAutoStopRef.current = onAutoStop;
  const silenceStartRef = useRef<number | null>(null);
  const hasSpeechRef = useRef(false);

  /**
   * Request microphone permissions
   */
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Microphone permission is required to record audio');
        setState('error');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setErrorMessage('Failed to request microphone permission');
      setState('error');
      return false;
    }
  };

  /**
   * Start recording audio
   */
  const startRecording = async (): Promise<void> => {
    try {
      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return;
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create and start recording with metering enabled (needed for
      // silence detection)
      const { recording: newRecording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });

      recordingRef.current = newRecording;
      setRecording(newRecording);
      setState('recording');
      setDuration(0);
      silenceStartRef.current = null;
      hasSpeechRef.current = false;

      // Start duration tracking (update every 100ms for smooth UI)
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 100);
      }, 100);

      // Poll audio level; auto-stop after 5s of silence once speech is heard
      meteringIntervalRef.current = setInterval(async () => {
        try {
          const status = await newRecording.getStatusAsync();
          const metering = status.metering;
          if (typeof metering !== 'number') return;

          if (metering > SILENCE_THRESHOLD_DB) {
            hasSpeechRef.current = true;
            silenceStartRef.current = null;
          } else if (hasSpeechRef.current) {
            if (silenceStartRef.current === null) {
              silenceStartRef.current = Date.now();
            } else if (Date.now() - silenceStartRef.current >= SILENCE_TIMEOUT_MS) {
              silenceStartRef.current = null;
              await cleanupTimers();
              onAutoStopRef.current?.();
            }
          }
        } catch {
          // Ignore metering read errors; manual stop still works
        }
      }, METERING_POLL_MS);

      // Auto-stop after max duration
      maxDurationTimeoutRef.current = setTimeout(async () => {
        await cancelRecording();
        setErrorMessage('Recording timed out. Please tap to record again.');
        setState('error');
      }, MAX_RECORDING_DURATION);

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start recording');
      setState('error');

      // Clean up on error
      await cleanupTimers();
    }
  };

  /**
   * Stop recording and return audio URI
   */
  const stopRecording = async (): Promise<string | null> => {
    try {
      const activeRecording = recordingRef.current;
      if (!activeRecording) {
        console.warn('No recording to stop');
        return null;
      }

      // Clear timers
      await cleanupTimers();

      // Stop recording
      await activeRecording.stopAndUnloadAsync();

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // Get the recording URI
      const uri = activeRecording.getURI();

      // Clear recording state
      recordingRef.current = null;
      setRecording(null);

      console.log('Recording stopped, URI:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to stop recording');
      setState('error');

      // Clean up on error
      await cleanupTimers();
      setRecording(null);

      return null;
    }
  };

  /**
   * Cancel recording without saving
   */
  const cancelRecording = async (): Promise<void> => {
    try {
      // Clear timers
      await cleanupTimers();

      const activeRecording = recordingRef.current;
      if (activeRecording) {
        await activeRecording.stopAndUnloadAsync();
        recordingRef.current = null;
        setRecording(null);
      }

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // Reset state
      setState('idle');
      setDuration(0);
      setErrorMessage(null);

      console.log('Recording cancelled');
    } catch (error) {
      console.error('Failed to cancel recording:', error);
      // Still reset state even if cleanup fails
      setState('idle');
      setDuration(0);
      setRecording(null);
    }
  };

  /**
   * Clean up timers
   */
  const cleanupTimers = async (): Promise<void> => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }
    if (meteringIntervalRef.current) {
      clearInterval(meteringIntervalRef.current);
      meteringIntervalRef.current = null;
    }
    silenceStartRef.current = null;
  };

  /**
   * Reset state to idle
   */
  const reset = (): void => {
    setState('idle');
    setErrorMessage(null);
    setDuration(0);
  };

  // Unload the recorder when the component unmounts (tab switch, Fast
  // Refresh). Without this the Recording object is orphaned and expo-av's
  // module-level "only one recording at a time" flag stays set, so the next
  // start fails until a full app reload.
  useEffect(() => {
    return () => {
      const activeRecording = recordingRef.current;
      if (activeRecording) {
        activeRecording.stopAndUnloadAsync().catch(() => {});
      }
      cleanupTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    setState,
    duration,
    errorMessage,
    setErrorMessage,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
  };
}
