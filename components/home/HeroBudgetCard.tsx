import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { getCategoryColor } from '../../constants/categories';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { Category } from '../../types';
import { formatRupees } from '../../utils/currency';

interface HeroBudgetCardProps {
  spent: number;
  budget: number;
  remaining: number;
  isOverBudget: boolean;
  byCategory: Record<string, number>;
  onPress?: () => void;
}

const DONUT_SIZE = 108;
const STROKE_WIDTH = 10;
const RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function HeroBudgetCard({
  spent,
  budget,
  remaining,
  isOverBudget,
  byCategory,
  onPress,
}: HeroBudgetCardProps) {
  const categorySegments = React.useMemo(() => {
    const entries = Object.entries(byCategory)
      .filter(([, amount]) => amount > 0)
      .sort(([, a], [, b]) => b - a);

    const total = entries.reduce((sum, [, amount]) => sum + amount, 0);

    if (total <= 0) {
      return [];
    }

    const gap = 4;
    let offset = 0;

    return entries.map(([category, amount]) => {
      const rawLength = (amount / total) * CIRCUMFERENCE;
      const segmentLength = Math.max(rawLength - gap, 0);
      const segment = {
        key: category,
        color: getCategoryColor(category as Category),
        length: segmentLength,
        offset: -offset,
      };

      offset += rawLength;
      return segment;
    });
  }, [byCategory]);

  return (
    <LinearGradient colors={['#10367B', '#0D2D6B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.overlay} />
      {onPress ? (
        <Pressable onPress={onPress} android_ripple={{ color: 'rgba(255,255,255,0.08)' }} style={styles.content}>
          <View style={styles.leftColumn}>
            <View style={styles.titleBlock}>
              <Text style={styles.eyebrow}>SPENT THIS MONTH</Text>
              <Text style={styles.amount}>{formatRupees(spent)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.metaRow}>
              <Text style={[styles.remaining, isOverBudget && styles.overBudget]}>
                {formatRupees(Math.abs(remaining))} {isOverBudget ? 'over' : 'left'}
              </Text>
              <Text style={styles.context}>of {formatRupees(budget)} budget</Text>
            </View>
          </View>

          <View style={styles.chartWrap}>
            <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
              <Circle
                cx={DONUT_SIZE / 2}
                cy={DONUT_SIZE / 2}
                r={RADIUS}
                stroke="rgba(255,255,255,0.10)"
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              {categorySegments.map((segment) => (
                <Circle
                  key={segment.key}
                  cx={DONUT_SIZE / 2}
                  cy={DONUT_SIZE / 2}
                  r={RADIUS}
                  stroke={segment.color}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeLinecap="butt"
                  strokeDasharray={`${segment.length} ${CIRCUMFERENCE}`}
                  strokeDashoffset={segment.offset}
                  originX={DONUT_SIZE / 2}
                  originY={DONUT_SIZE / 2}
                  rotation={-90}
                />
              ))}
            </Svg>

            <View style={styles.chartCenter}>
              <Text style={styles.centerAmount}>{formatRupees(spent)}</Text>
              <Text style={styles.centerLabel}>Spent</Text>
            </View>
          </View>
        </Pressable>
      ) : (
        <View style={styles.content}>
          <View style={styles.leftColumn}>
            <View style={styles.titleBlock}>
              <Text style={styles.eyebrow}>SPENT THIS MONTH</Text>
              <Text style={styles.amount}>{formatRupees(spent)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.metaRow}>
              <Text style={[styles.remaining, isOverBudget && styles.overBudget]}>
                {formatRupees(Math.abs(remaining))} {isOverBudget ? 'over' : 'left'}
              </Text>
              <Text style={styles.context}>of {formatRupees(budget)} budget</Text>
            </View>
          </View>

          <View style={styles.chartWrap}>
            <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
              <Circle
                cx={DONUT_SIZE / 2}
                cy={DONUT_SIZE / 2}
                r={RADIUS}
                stroke="rgba(255,255,255,0.10)"
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              {categorySegments.map((segment) => (
                <Circle
                  key={segment.key}
                  cx={DONUT_SIZE / 2}
                  cy={DONUT_SIZE / 2}
                  r={RADIUS}
                  stroke={segment.color}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeLinecap="butt"
                  strokeDasharray={`${segment.length} ${CIRCUMFERENCE}`}
                  strokeDashoffset={segment.offset}
                  originX={DONUT_SIZE / 2}
                  originY={DONUT_SIZE / 2}
                  rotation={-90}
                />
              ))}
            </Svg>

            <View style={styles.chartCenter}>
              <Text style={styles.centerAmount}>{formatRupees(spent)}</Text>
              <Text style={styles.centerLabel}>Spent</Text>
            </View>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 107, 255, 0.24)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  leftColumn: {
    flex: 1,
    gap: spacing.md,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: '#8B9CC7',
    letterSpacing: 1,
  },
  amount: {
    fontSize: 34,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
  divider: {
    width: 56,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  metaRow: {
    gap: 2,
  },
  remaining: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
  overBudget: {
    color: colors.error,
  },
  context: {
    fontSize: typography.fontSize.xs,
    color: colors.onSurfaceVariant,
  },
  chartWrap: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
    textAlign: 'center',
  },
  centerLabel: {
    fontSize: typography.fontSize.xs,
    color: '#8B9CC7',
  },
});
