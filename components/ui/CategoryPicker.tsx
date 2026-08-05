import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { categoryList } from '../../constants/categories';
import { borderRadius, type Colors, spacing, typography, useColors } from '../../constants/theme';
import type { Category } from '../../types';

interface CategoryPickerProps {
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
  error?: string;
}

export function CategoryPicker({ selectedCategory, onSelectCategory, error }: CategoryPickerProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category</Text>
      <View style={styles.grid}>
        {categoryList.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonSelected,
              {
                borderColor:
                  selectedCategory === category.id ? category.color : colors.outlineVariant,
              },
            ]}
            onPress={() => onSelectCategory(category.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: category.iconBackgroundColor ?? `${category.iconColor}18`,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  category.iconName as React.ComponentProps<typeof MaterialCommunityIcons>['name']
                }
                size={22}
                color={category.iconColor}
              />
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[
                styles.categoryLabel,
                selectedCategory === category.id && { color: category.color },
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.onSurfaceVariant,
      marginBottom: spacing.sm,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    categoryButton: {
      flexBasis: '21%',
      flexGrow: 1,
      minHeight: 78,
      backgroundColor: colors.surfaceContainer,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    categoryButtonSelected: {
      backgroundColor: colors.surfaceContainerHigh,
    },
    iconContainer: {
      width: 34,
      height: 34,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    categoryLabel: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    error: {
      fontSize: typography.fontSize.xs,
      color: colors.error,
      marginTop: spacing.xs,
    },
  });
