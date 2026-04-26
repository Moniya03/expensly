import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getCategoryColor } from '../../constants/categories';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { Category } from '../../types';
import { formatRupees } from '../../utils/currency';
import { GlassmorphicCard } from '../ui/GlassmorphicCard';
import { LinearGradient } from 'expo-linear-gradient';

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
    <GlassmorphicCard intensity={18} style={styles.card}>
      <LinearGradient
        colors={['rgba(26,107,255,0.16)', 'rgba(0,212,170,0.10)', 'rgba(255,255,255,0.02)']}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={styles.overlay}
      />
      <View style={styles.cardSheen} />
      <View style={styles.cardEdgeHighlight} />
      <View style={styles.glowOrbPrimary} />
      <View style={styles.glowOrbSecondary} />
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
    </GlassmorphicCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    shadowColor: colors.primary,
    shadowOpacity: 0.16,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  cardSheen: {
    position: 'absolute',
    left: -42,
    top: -62,
    width: 186,
    height: 186,
    borderRadius: 93,
    backgroundColor: 'rgba(255,255,255,0.028)',
  },
  cardEdgeHighlight: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  glowOrbPrimary: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    top: -64,
    left: -36,
    backgroundColor: 'rgba(26,107,255,0.11)',
  },
  glowOrbSecondary: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -40,
    bottom: -38,
    backgroundColor: 'rgba(0,212,170,0.085)',
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
    color: '#9AA8D0',
    letterSpacing: 1.15,
  },
  amount: {
    fontSize: 35,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
    letterSpacing: -0.6,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  metaRow: {
    gap: 2,
  },
  remaining: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
    letterSpacing: -0.2,
  },
  overBudget: {
    color: colors.error,
  },
  context: {
    fontSize: typography.fontSize.xs,
    color: '#A5B1CF',
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
    letterSpacing: -0.3,
  },
  centerLabel: {
    fontSize: typography.fontSize.xs,
    color: '#AAB6DB',
    letterSpacing: 0.5,
  },
});
