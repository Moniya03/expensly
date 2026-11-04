import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
import { formatRupees } from '../../utils/currency';
import { SoftDivider } from '../ui/SoftDivider';

interface QuickStatsProps {
  today: number;
  week: number;
}

const statCards = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
] as const;

export default function QuickStats({ today, week }: QuickStatsProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const values = {
    today: formatRupees(today),
    week: formatRupees(week),
  };

  return (
    <Surface elevation={1} style={styles.container}>
      <View style={styles.frame}>
        {statCards.map((card, index) => (
          <React.Fragment key={card.key}>
            <View style={styles.stat}>
              <Text variant="labelSmall" style={styles.label}>
                {card.label}
              </Text>
              <Text variant="titleLarge" style={styles.value}>
                {values[card.key]}
              </Text>
            </View>
            {index < statCards.length - 1 ? <SoftDivider vertical style={styles.divider} /> : null}
          </React.Fragment>
        ))}
      </View>
    </Surface>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    frame: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    stat: {
      flex: 1,
      gap: 6,
      paddingVertical: spacing.xs,
    },
    divider: {
      width: 1,
      marginHorizontal: spacing.sm,
      opacity: 0.7,
    },
    label: {
      fontWeight: typography.fontWeight.medium,
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    value: {
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.onSurface,
    },
  });
