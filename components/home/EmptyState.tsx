import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, useColors, type Colors } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function EmptyState() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {/* Ripple Rings */}
      <View style={styles.rippleContainer}>
        <View style={[styles.ring, styles.ringOuter]} />
        <View style={[styles.ring, styles.ringMiddle]} />
        <View style={[styles.ring, styles.ringInner]} />
        
        {/* Mic Icon Core */}
        <View style={styles.iconCore}>
          <Ionicons name="mic" size={48} color={colors.primary} />
        </View>
      </View>

      {/* Text Content */}
      <Text style={styles.title}>No expenses yet</Text>
      <Text style={styles.subtitle}>Tap the mic to add your first expense</Text>
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  rippleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  ring: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: `${colors.primary}0D`,
    borderWidth: 1,
    borderColor: `${colors.primary}1A`,
  },
  ringMiddle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: `${colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  ringInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: `${colors.primary}33`,
    borderWidth: 1,
    borderColor: `${colors.primary}4D`,
  },
  iconCore: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: `${colors.primary}4D`,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
