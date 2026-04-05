import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';

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

const Particle: React.FC<{ config: ParticleConfig }> = ({ config }) => {
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withRepeat(
      withTiming(config.range, {
        duration: config.duration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

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
  count = 20,
}) => {
  const particles = useMemo<ParticleConfig[]>(() => {
    const colors = [theme.colors.primary, theme.colors.secondary, theme.colors.tertiary];
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      size: Math.random() * 4 + 2, // 2-6
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 3000 + 2000, // 2000-5000ms
      opacity: Math.random() * 0.2 + 0.1, // 0.1-0.3
      range: Math.random() * 100 + 50, // floating range 50-150px
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
  },
});
