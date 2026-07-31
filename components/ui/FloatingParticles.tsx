import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FloatingParticlesProps {
  count?: number;
}

interface ParticleConfig {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  opacity: number;
  range: number;
}

const MAX_PARTICLES = Platform.OS === 'android' ? 6 : 10;

const Particle: React.FC<{ config: ParticleConfig }> = ({ config }) => {
  const translateY = useSharedValue(config.range);

  React.useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-config.range, {
        duration: config.duration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    );
  }, [config.duration, config.range, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: config.x,
          top: config.y,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: config.color,
          opacity: config.opacity,
        },
        animatedStyle,
      ]}
    />
  );
};

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = MAX_PARTICLES,
}) => {
  const particles = useMemo<ParticleConfig[]>(() => {
    const palette = ['#2E86FF', '#6FB4FF'];
    const actualCount = Math.min(count, MAX_PARTICLES);

    return Array.from({ length: actualCount }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: SCREEN_HEIGHT * (0.12 + Math.random() * 0.76),
      size: 4 + Math.random() * 4,
      color: palette[Math.floor(Math.random() * palette.length)],
      duration: 8000 + Math.random() * 2000,
      opacity: 0.35 + Math.random() * 0.3,
      range: 40 + Math.random() * 70,
    }));
  }, [count]);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <Particle key={particle.id} config={particle} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  particle: {
    position: 'absolute',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});
