import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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

  // Show error alerts
  useEffect(() => {
    if (errorMessage) {
      Alert.alert('Recording Error', errorMessage, [
        { text: 'OK', onPress: () => setErrorMessage(null) },
      ]);
    }
  }, [errorMessage]);

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
          console.log('Voice expense created:', response.transaction);
        } else {
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
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        disabled={state === 'processing' || state === 'success' || state === 'error'}
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
      </TouchableOpacity>
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
