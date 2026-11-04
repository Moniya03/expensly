import { useMemo } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { HelperText, TextInput, type TextInputProps } from 'react-native-paper';
import { type AppTheme, useAppTheme } from '../../constants/md3-theme';
import { spacing } from '../../constants/theme';

export interface InputProps extends Omit<TextInputProps, 'error'> {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({ label, error, containerStyle, style, multiline, ...rest }: InputProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        mode="outlined"
        label={label}
        error={Boolean(error)}
        multiline={multiline}
        style={[styles.input, multiline && styles.multilineInput, style]}
        outlineColor={theme.colors.outlineVariant}
        activeOutlineColor={theme.colors.primary}
        textColor={theme.colors.onSurface}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        {...rest}
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
    multilineInput: {
      minHeight: 80,
    },
  });
