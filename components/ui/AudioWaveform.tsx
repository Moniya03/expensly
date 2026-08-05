import type React from 'react';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { borderRadius, useColors } from '../../constants/theme';

interface AudioWaveformProps {
  isActive: boolean;
  barCount?: number;
}

const BAR_WIDTH = 4;
const BAR_MAX_HEIGHT = 24;
const BAR_MIN_HEIGHT = 4;
const BAR_SPACING = 6;

const AnimatedBar: React.FC<{
  isActive: boolean;
  delay: number;
  index: number;
}> = ({ isActive, delay, index }) => {
  const height = useSharedValue(BAR_MIN_HEIGHT);

  useEffect(() => {
    if (isActive) {
      // Start animation after delay
      const timer = setTimeout(() => {
        height.value = withRepeat(
          withSequence(
            withTiming(BAR_MAX_HEIGHT, {
              duration: 400,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(BAR_MIN_HEIGHT, {
              duration: 400,
              easing: Easing.inOut(Easing.ease),
            }),
          ),
          -1, // Infinite repeat
          false,
        );
      }, delay);

      return () => clearTimeout(timer);
    } else {
      // Shrink to minimum height when not active
      height.value = withTiming(BAR_MIN_HEIGHT, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [isActive, delay]);

  const colors = useColors();

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  // Alternate colors to create gradient effect across bars
  const barColor = index % 2 === 0 ? colors.primary : colors.secondary;

  return <Animated.View style={[styles.bar, { backgroundColor: barColor }, animatedStyle]} />;
};

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ isActive, barCount = 5 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: barCount }).map((_, index) => (
        <AnimatedBar key={index} isActive={isActive} delay={index * 100} index={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: BAR_SPACING,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: borderRadius.sm,
  },
});
