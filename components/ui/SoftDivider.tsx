import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SoftDividerProps extends ViewProps {
  vertical?: boolean;
}

export function SoftDivider({ vertical = false, style, ...props }: SoftDividerProps) {
  return (
    <View
      style={[vertical ? styles.verticalContainer : styles.horizontalContainer, style]}
      {...props}
    >
      <LinearGradient
        colors={['rgba(26,107,255,0.00)', 'rgba(26,107,255,0.18)', 'rgba(26,107,255,0.00)']}
        start={vertical ? { x: 0, y: 0 } : { x: 0, y: 0 }}
        end={vertical ? { x: 0, y: 1 } : { x: 1, y: 0 }}
        style={vertical ? styles.verticalLine : styles.horizontalLine}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalContainer: {
    justifyContent: 'center',
  },
  verticalContainer: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalLine: {
    height: 1,
    width: '100%',
  },
  verticalLine: {
    width: 1,
    flex: 1,
    minHeight: 18,
  },
});
