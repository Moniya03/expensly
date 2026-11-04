import type React from 'react';
import { StyleSheet, type ViewProps } from 'react-native';
import { Surface } from 'react-native-paper';
import { borderRadius, spacing, useAppTheme } from '../../constants/theme';

export interface GlassmorphicCardProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
}

export function GlassmorphicCard({
  children,
  intensity: _intensity,
  style,
  ...props
}: GlassmorphicCardProps) {
  const theme = useAppTheme();

  return (
    <Surface
      mode="elevated"
      elevation={2}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceContainer,
          borderColor: theme.colors.outlineVariant,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
});
