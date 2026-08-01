import { BlurView } from 'expo-blur';
import { StyleSheet, ViewProps } from 'react-native';
import { borderRadius, spacing } from '../../constants/theme';

interface GlassmorphicCardProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
}

export function GlassmorphicCard({
  children,
  intensity = 10,
  style,
  ...props
}: GlassmorphicCardProps) {
  return (
    <BlurView
      intensity={intensity}
      tint="dark"
      style={[styles.container, style]}
      {...props}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
});
