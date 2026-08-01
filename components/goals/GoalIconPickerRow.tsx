import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography, useColors, type Colors } from '../../constants/theme';

const OPTIONS = [
  { name: 'briefcase-outline', label: 'Work' },
  { name: 'airplane-outline', label: 'Travel' },
  { name: 'home-outline', label: 'Home' },
  { name: 'car-sport-outline', label: 'Car' },
  { name: 'school-outline', label: 'Study' },
  { name: 'medkit-outline', label: 'Health' },
  { name: 'heart-outline', label: 'Love' },
];

export function GoalIconPickerRow({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Icon</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {OPTIONS.map((option) => {
          const selected = option.name === value;
          return (
            <Pressable key={option.name} onPress={() => onChange(option.name)} style={[styles.pill, selected && styles.selectedPill]}>
              <Ionicons name={option.name as keyof typeof Ionicons.glyphMap} size={18} color={selected ? colors.surface : colors.onSurfaceVariant} />
              <Text style={[styles.text, selected && styles.selectedText]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: { marginBottom: spacing.md },
  headerRow: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  label: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.onSurfaceVariant },
  row: { gap: spacing.sm, paddingHorizontal: spacing.md },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.outlineVariant },
  selectedPill: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { color: colors.onSurfaceVariant, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
  selectedText: { color: colors.surface },
});
