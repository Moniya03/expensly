import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { formatRupees } from '../../utils/currency';

interface HeroBudgetCardProps {
  spent: number;
  budget: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}

const DONUT_SIZE = 108;
const STROKE_WIDTH = 10;
const RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function HeroBudgetCard({
  spent,
  budget,
  remaining,
  percentUsed,
  isOverBudget,
}: HeroBudgetCardProps) {
  const progress = Math.max(0, Math.min(percentUsed, 100));
  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <LinearGradient colors={['#10367B', '#0D2D6B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.overlay} />
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
            <Defs>
              <SvgLinearGradient id="budgetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={colors.primary} />
                <Stop offset="100%" stopColor={colors.secondary} />
              </SvgLinearGradient>
            </Defs>
            <Circle
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={RADIUS}
              stroke="rgba(255,255,255,0.10)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={RADIUS}
              stroke="url(#budgetGradient)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              originX={DONUT_SIZE / 2}
              originY={DONUT_SIZE / 2}
              rotation={-90}
            />
          </Svg>

          <View style={styles.chartCenter}>
            <Text style={styles.percent}>{Math.round(percentUsed)}%</Text>
            <Text style={styles.percentLabel}>used</Text>
          </View>
        </View>
      </View>
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
  percent: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
  percentLabel: {
    fontSize: typography.fontSize.xs,
    color: '#8B9CC7',
  },
});
