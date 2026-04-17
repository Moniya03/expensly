import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';

export function GoalEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconShell}>
        <Ionicons name="sparkles-outline" size={32} color={colors.primary} />
      </View>
      <Text style={styles.title}>Build the next milestone</Text>
      <Text style={styles.subtitle}>Add a savings goal and keep the momentum calm and visible.</Text>
      <Pressable style={styles.cta} onPress={onCreate}>
        <Text style={styles.ctaText}>Create goal</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant },
  iconShell: { width: 64, height: 64, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.onSurface, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, textAlign: 'center' },
  subtitle: { color: colors.onSurfaceVariant, fontSize: typography.fontSize.sm, lineHeight: typography.fontSize.sm * 1.5, textAlign: 'center' },
  cta: { marginTop: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.full, backgroundColor: colors.primary },
  ctaText: { color: colors.surface, fontWeight: typography.fontWeight.semiBold },
});
