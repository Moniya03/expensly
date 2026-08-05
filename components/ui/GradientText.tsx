import type React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { typography, useColors } from '../../constants/theme';

interface GradientTextProps extends TextProps {
  colors?: [string, string];
}

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  colors,
  style,
  ...props
}) => {
  const palette = useColors();
  const [start, end] = colors ?? [palette.primary, palette.secondary];

  return (
    <Text
      style={[
        styles.gradientText,
        {
          color: start,
          textShadowColor: end,
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
    fontFamily: typography.fontFamily.bold,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
