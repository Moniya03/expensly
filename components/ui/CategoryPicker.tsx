import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, HelperText, Text } from 'react-native-paper';
import { categoryList } from '../../constants/categories';
import { type AppTheme, spacing, typography, useAppTheme } from '../../constants/theme';
import type { Category } from '../../types';

export interface CategoryPickerProps {
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
  error?: string;
}

export function CategoryPicker({ selectedCategory, onSelectCategory, error }: CategoryPickerProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category</Text>
      <View style={styles.chipsContainer}>
        {categoryList.map((category) => {
          const isSelected = selectedCategory === category.id;

          return (
            <Chip
              key={category.id}
              mode={isSelected ? 'flat' : 'outlined'}
              selected={isSelected}
              showSelectedCheck={false}
              onPress={() => onSelectCategory(category.id)}
              accessibilityLabel={category.label}
              icon={({ size }) => (
                <MaterialCommunityIcons
                  name={
                    category.iconName as React.ComponentProps<typeof MaterialCommunityIcons>['name']
                  }
                  size={size}
                  color={isSelected ? category.color : theme.colors.onSurfaceVariant}
                />
              )}
              style={[
                styles.chip,
                isSelected
                  ? {
                      backgroundColor: theme.colors.secondaryContainer,
                      borderColor: category.color,
                    }
                  : styles.chipUnselected,
              ]}
              textStyle={[
                styles.chipText,
                isSelected
                  ? { color: category.color, fontWeight: '600' }
                  : { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {category.label}
            </Chip>
          );
        })}
      </View>
      {Boolean(error) && (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.sm,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      borderWidth: 1,
    },
    chipUnselected: {
      backgroundColor: theme.colors.surfaceContainer,
      borderColor: theme.colors.outlineVariant,
    },
    chipText: {
      fontSize: typography.fontSize.sm,
    },
  });
