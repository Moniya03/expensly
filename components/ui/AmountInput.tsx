import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';

interface AmountInputProps {
  value: string;
  onChangeValue: (value: string) => void;
  error?: string;
  integerOnly?: boolean;
}

export function AmountInput({ value, onChangeValue, error, integerOnly = false }: AmountInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (text: string) => {
    if (integerOnly) {
      onChangeValue(text.replace(/[^0-9]/g, ''));
      return;
    }

    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    onChangeValue(cleaned);
  };

  const getBorderColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.primary;
    return colors.outlineVariant;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Amount</Text>
      <View style={[styles.inputContainer, { borderColor: getBorderColor() }]}>
        <Text style={styles.currency}>₹</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={colors.onSurfaceVariant}
          value={value}
          onChangeText={handleChange}
          keyboardType={integerOnly ? 'number-pad' : 'decimal-pad'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={colors.primary}
          maxLength={10}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  currency: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.secondary,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.onSurface,
    fontFamily: typography.fontFamily.regular,
    padding: 0,
  },
  error: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
