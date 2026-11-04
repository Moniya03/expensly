import { useMemo } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { type AppTheme, useAppTheme } from '../../constants/md3-theme';
import { spacing } from '../../constants/theme';

export interface AmountInputProps {
  value: string;
  onChangeValue: (value: string) => void;
  error?: string;
  integerOnly?: boolean;
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function AmountInput({
  value,
  onChangeValue,
  error,
  integerOnly = false,
  label = 'Amount',
  containerStyle,
}: AmountInputProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        mode="outlined"
        label={label}
        placeholder="0"
        value={value}
        onChangeText={handleChange}
        keyboardType={integerOnly ? 'number-pad' : 'decimal-pad'}
        left={<TextInput.Affix text="₹" />}
        error={Boolean(error)}
        outlineColor={theme.colors.outlineVariant}
        activeOutlineColor={theme.colors.primary}
        textColor={theme.colors.onSurface}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        style={styles.input}
        maxLength={10}
      />
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
    input: {
      backgroundColor: theme.colors.surfaceContainer,
    },
  });
