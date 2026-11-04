import { StyleSheet, type ViewProps } from 'react-native';
import { Divider } from 'react-native-paper';
import { useAppTheme } from '../../constants/theme';

export interface SoftDividerProps extends ViewProps {
  vertical?: boolean;
}

export function SoftDivider({ vertical = false, style, ...props }: SoftDividerProps) {
  const theme = useAppTheme();

  return (
    <Divider
      style={[
        vertical ? styles.vertical : styles.horizontal,
        { backgroundColor: theme.colors.outlineVariant },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
    alignSelf: 'stretch',
  },
});
