import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
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
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
        <Text variant="bodyMedium" style={styles.label}>
          Icon
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {Object.values(goalMeta).map((option) => {
          const isSelected = option.icon === value;
          return (
            <Chip
              key={option.icon}
              mode={isSelected ? 'flat' : 'outlined'}
              selected={isSelected}
              showSelectedCheck={false}
              onPress={() => onChange(option.icon)}
              icon={({ size }) => (
                <Ionicons
                  name={option.icon}
                  size={size}
                  color={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
              )}
              style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
              textStyle={[
                styles.chipText,
                isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
              ]}
            >
              {option.label}
            </Chip>
          );
        })}

        {(customIcons ?? []).map((icon) => {
          const isSelected = icon.id === value;
          return (
            <Chip
              key={icon.id}
              mode={isSelected ? 'flat' : 'outlined'}
              selected={isSelected}
              showSelectedCheck={false}
              onPress={() => onChange(icon.id)}
              onLongPress={() => openEdit(icon)}
              icon={({ size }) => (
                <Ionicons
                  name={icon.icon_name as keyof typeof Ionicons.glyphMap}
                  size={size}
                  color={isSelected ? icon.color : theme.colors.onSurfaceVariant}
                />
              )}
              style={[
                styles.chip,
                isSelected
                  ? [styles.chipSelected, { borderColor: icon.color }]
                  : styles.chipUnselected,
              ]}
              textStyle={[
                styles.chipText,
                isSelected
                  ? [styles.chipTextSelected, { color: icon.color }]
                  : styles.chipTextUnselected,
              ]}
            >
              {icon.label ?? 'Custom'}
            </Chip>
          );
        })}

        <Pressable
          onPress={openCreate}
          style={styles.addPill}
          accessibilityRole="button"
          accessibilityLabel="Add custom icon"
        >
          <Ionicons name="add" size={18} color={theme.colors.primary} />
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

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.sm,
    },
    headerRow: {
      marginBottom: spacing.xs,
    },
    label: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: theme.colors.onSurfaceVariant,
    },
    row: {
      gap: spacing.sm,
      alignItems: 'center',
      paddingVertical: 2,
    },
    chip: {
      borderWidth: 1,
      borderRadius: borderRadius.full,
    },
    chipSelected: {
      backgroundColor: theme.colors.secondaryContainer,
      borderColor: theme.colors.primary,
    },
    chipUnselected: {
      backgroundColor: theme.colors.surfaceContainer,
      borderColor: theme.colors.outlineVariant,
    },
    chipText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
    },
    chipTextSelected: {
      color: theme.colors.onSecondaryContainer,
      fontWeight: typography.fontWeight.semiBold,
    },
    chipTextUnselected: {
      color: theme.colors.onSurfaceVariant,
    },
    addPill: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderStyle: 'dashed',
    },
  });
