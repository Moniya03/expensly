import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { borderRadius, type Colors, spacing, typography, useColors } from '../../constants/theme';
import { useGoalIcons } from '../../hooks/useGoalIcons';
import type { UserGoalIcon } from '../../types';
import { GoalIconBuilder } from './GoalIconBuilder';
import { goalMeta } from './goalMeta';

export function GoalIconPickerRow({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: customIcons } = useGoalIcons();

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<UserGoalIcon | null>(null);

  const openCreate = () => {
    setEditing(null);
    setBuilderOpen(true);
  };

  const openEdit = (icon: UserGoalIcon) => {
    setEditing(icon);
    setBuilderOpen(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Icon</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {Object.values(goalMeta).map((option) => {
          const selected = option.icon === value;
          return (
            <Pressable
              key={option.icon}
              onPress={() => onChange(option.icon)}
              style={[styles.pill, selected && styles.selectedPill]}
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={selected ? colors.onAccent : colors.onSurfaceVariant}
              />
              <Text style={[styles.text, selected && styles.selectedText]}>{option.label}</Text>
            </Pressable>
          );
        })}

        {(customIcons ?? []).map((icon) => {
          const selected = icon.id === value;
          return (
            <Pressable
              key={icon.id}
              onPress={() => onChange(icon.id)}
              onLongPress={() => openEdit(icon)}
              style={[
                styles.pill,
                selected && {
                  backgroundColor: icon.color,
                  borderColor: icon.color,
                },
              ]}
            >
              <Ionicons
                name={icon.icon_name as keyof typeof Ionicons.glyphMap}
                size={18}
                color={selected ? colors.onAccent : icon.color}
              />
              <Text style={[styles.text, selected && styles.selectedText]}>
                {icon.label ?? 'Custom'}
              </Text>
            </Pressable>
          );
        })}

        <Pressable onPress={openCreate} style={styles.addPill}>
          <Ionicons name="add" size={18} color={colors.primary} />
        </Pressable>
      </ScrollView>

      <GoalIconBuilder
        visible={builderOpen}
        editing={editing}
        onClose={() => setBuilderOpen(false)}
      />
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: { marginBottom: spacing.md },
    headerRow: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
    label: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.onSurfaceVariant,
    },
    row: { gap: spacing.sm, paddingHorizontal: spacing.md },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceContainer,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    selectedPill: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    addPill: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceContainer,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderStyle: 'dashed',
    },
    text: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
    },
    selectedText: { color: colors.onAccent },
  });
