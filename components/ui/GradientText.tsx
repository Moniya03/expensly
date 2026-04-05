import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface GradientTextProps extends TextProps {
  colors?: [string, string];
}

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  colors = [theme.colors.primary, theme.colors.secondary],
  style,
  ...props
}) => {
  return (
    <Text
      style={[
        styles.gradientText,
        {
          color: colors[0],
          textShadowColor: colors[1],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  gradientText: {
    fontFamily: theme.typography.fontFamily.bold,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
