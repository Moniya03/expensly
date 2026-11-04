import type React from 'react';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle, G } from 'react-native-svg';
import { getCategoryColor } from '../../constants/categories';
import { type AppTheme, typography, useAppTheme } from '../../constants/theme';
import type { Category } from '../../types';
import { formatRupees } from '../../utils/currency';

interface SpendingRingProps {
  budget: number;
  spent: number;
  categoryBreakdown: Record<string, number>; // category -> amount in rupees
}

const RING_SIZE = 200;
const STROKE_WIDTH = 24;
const CENTER = RING_SIZE / 2;
const RADIUS = CENTER - STROKE_WIDTH / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const SpendingRing: React.FC<SpendingRingProps> = ({ budget, spent, categoryBreakdown }) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isOverBudget = spent > budget;
  const remaining = isOverBudget ? spent - budget : budget - spent;

  // Use the larger of the two to scale the ring, ensuring over-budget doesn't break the circle
  const totalScale = Math.max(budget, spent) || 1;

  const segments = useMemo(() => {
    // Sort categories from largest spending to smallest for visual appeal
    const sortedCategories = Object.entries(categoryBreakdown)
      .filter(([_, amount]) => amount > 0)
      .sort(([, amountA], [, amountB]) => amountB - amountA);

    let cumulativeOffset = 0;

    return sortedCategories.map(([category, amount]) => {
      // Calculate the segment's length based on its percentage of the total scale
      const percentage = amount / totalScale;
      const strokeLength = percentage * CIRCUMFERENCE;
      const strokeDashoffset = -cumulativeOffset;

      cumulativeOffset += strokeLength;

      return {
        key: category,
        color: getCategoryColor(category as Category),
        strokeDasharray: `${strokeLength} ${CIRCUMFERENCE}`,
        strokeDashoffset,
      };
    });
  }, [categoryBreakdown, totalScale]);

  return (
    <View style={styles.container}>
      <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
          {/* Background track */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={theme.colors.surfaceContainerHighest}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Active segments */}
          {segments.map((segment) => (
            <Circle
              key={segment.key}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke={segment.color || theme.colors.outlineVariant}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={segment.strokeDasharray}
              strokeDashoffset={segment.strokeDashoffset}
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </G>
      </Svg>

      <View style={styles.centerContent}>
        <Text style={[styles.amountText, isOverBudget && styles.overBudgetText]}>
          {formatRupees(remaining)}
        </Text>
        <Text style={[styles.labelText, isOverBudget && styles.overBudgetLabel]}>
          {isOverBudget ? 'over budget' : 'left'}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: RING_SIZE,
      height: RING_SIZE,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    centerContent: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
    },
    amountText: {
      fontSize: typography.fontSize.xxl,
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    labelText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    overBudgetText: {
      color: theme.colors.error,
    },
    overBudgetLabel: {
      color: theme.colors.error,
      opacity: 0.8,
    },
  });

export default SpendingRing;
