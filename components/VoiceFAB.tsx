import React, { useEffect } from 'react';
import { StyleSheet, Pressable, View, ActivityIndicator, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '../constants/theme';
import { AudioWaveform } from './ui/AudioWaveform';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { useAuthStore } from '../stores/authStore';
import { processVoiceExpense, audioUriToBase64 } from '../services/voiceExpense';

export default function VoiceFAB() {
  const {
    state,
    setState,
    errorMessage,
    setErrorMessage,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
  } = useVoiceRecording();

  const { session } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Pulsing animation for recording state
  useEffect(() => {
    if (state === 'recording') {
      Animated.loop(
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
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  // Auto-reset after success or error
  useEffect(() => {
    if (state === 'success' || state === 'error') {
      const timer = setTimeout(() => {
        reset();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  /**
   * Handle button press based on current state
   */
  const handlePress = async () => {
    try {
      if (state === 'idle') {
        // Start recording
        await startRecording();
      } else if (state === 'recording') {
        // Stop recording and process
        setState('processing');
        const audioUri = await stopRecording();

        if (!audioUri) {
          setErrorMessage('Failed to get recording');
          setState('error');
          return;
        }

        // Get user ID
        const userId = session?.user?.id;
        if (!userId) {
          setErrorMessage('You must be logged in to record expenses');
          setState('error');
          return;
        }

        // Convert to base64
        const audioBase64 = await audioUriToBase64(audioUri);

        // Send to backend
        const response = await processVoiceExpense(audioBase64, userId);

        if (response.success) {
          setState('success');
          await queryClient.invalidateQueries({ queryKey: ['transactions'] });
          console.log('Voice expense created:', response.transaction);
        } else {
          console.error('Voice expense processing failed:', response.error);
          setErrorMessage(response.error || 'Failed to process voice expense');
          setState('error');
        }
      }
      // Ignore presses during processing, success, or error states
    } catch (error) {
      console.error('Error handling voice recording:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
      setState('error');
    }
  };

  const inlineErrorMessage =
    state === 'error' && errorMessage
      ? "Couldn't understand that. Please re-record."
      : null;

  /**
   * Handle long press to navigate to manual expense form
   */
  const handleLongPress = () => {
    // Only allow long-press when idle (not recording/processing)
    if (state === 'idle') {
      router.push('/transaction/add' as any);
    }
  };

  /**
   * Get button colors based on state
   */
  const getButtonColors = (): [string, string] => {
    switch (state) {
      case 'success':
        return ['#00D4AA', '#00D4AA']; // Green
      case 'error':
        return [colors.error, colors.error]; // Red
      default:
        return [colors.primary, colors.secondary]; // Default gradient
    }
  };

  /**
   * Get icon based on state
   */
  const getIcon = () => {
    switch (state) {
      case 'processing':
        return <ActivityIndicator size="large" color="#FFFFFF" />;
      case 'success':
        return <Ionicons name="checkmark" size={32} color="#FFFFFF" />;
      case 'error':
        return <Ionicons name="close" size={32} color="#FFFFFF" />;
      default:
        return <Ionicons name="mic" size={32} color="#FFFFFF" />;
    }
  };

  return (
    <View style={styles.container}>
      {inlineErrorMessage ? (
        <View style={styles.errorBanner}>
          <Text numberOfLines={1} style={styles.errorText}>
            {inlineErrorMessage}
          </Text>
        </View>
      ) : null}
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        disabled={state === 'processing' || state === 'success' || state === 'error'}
        style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
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
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    zIndex: 1000,
    // Shadow for iOS
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 10,
    borderRadius: 32,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    alignItems: 'center',
    gap: 4,
  },
});
