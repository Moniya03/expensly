import { Audio } from 'expo-av';
import { useState, useRef } from 'react';

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

export function useVoiceRecording(): UseVoiceRecordingReturn {
  // State management
  const [state, setState] = useState<RecordingState>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Refs for timers
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      // Create and start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setState('recording');
      setDuration(0);

      // Start duration tracking (update every 100ms for smooth UI)
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 100);
      }, 100);

      // Auto-stop after max duration
      maxDurationTimeoutRef.current = setTimeout(async () => {
        await stopRecording();
      }, MAX_RECORDING_DURATION);

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to start recording'
      );
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
      if (!recording) {
        console.warn('No recording to stop');
        return null;
      }

      // Clear timers
      await cleanupTimers();

      // Stop recording
      await recording.stopAndUnloadAsync();
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // Get the recording URI
      const uri = recording.getURI();
      
      // Clear recording state
      setRecording(null);

      console.log('Recording stopped, URI:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to stop recording'
      );
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

      if (recording) {
        await recording.stopAndUnloadAsync();
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
  };

  /**
   * Reset state to idle
   */
  const reset = (): void => {
    setState('idle');
    setErrorMessage(null);
    setDuration(0);
  };

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
