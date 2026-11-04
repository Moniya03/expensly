import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, Surface, Text, TouchableRipple } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';
import { type AppTheme, typography, useAppTheme } from '../../constants/theme';
import { formatRupees } from '../../utils/currency';

interface HeroBudgetCardProps {
  spent: number;
  budget: number;
  remaining: number;
  todaySpent: number;
  weekSpent: number;
  onPress?: () => void;
}

const DONUT_SIZE = 112;
const STROKE_WIDTH = 10;
const RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function HeroBudgetCard({
  spent,
  budget,
  remaining,
  todaySpent,
  weekSpent,
  onPress,
}: HeroBudgetCardProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const progress = budget > 0 ? Math.min(spent / budget, 1) : 0;
  const remainingPercent = budget > 0 ? Math.max((remaining / budget) * 100, 0) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const isOverBudget = remaining < 0;

  const progressColor = isOverBudget ? theme.colors.error : theme.colors.primary;

  const cardContent = (
    <View style={styles.content}>
      <View style={styles.topRow}>
        <View style={styles.leftColumn}>
          <Text variant="labelSmall" style={styles.eyebrow}>
            SPENT THIS MONTH
          </Text>
          <Text variant="headlineMedium" style={styles.spentAmount}>
            {formatRupees(spent)}
          </Text>
          <View style={styles.remainingRow}>
            <View style={[styles.statusDot, { backgroundColor: progressColor }]} />
            <Text
              variant="bodySmall"
              style={[
                styles.remainingText,
                { color: isOverBudget ? theme.colors.error : theme.colors.onSurfaceVariant },
              ]}
            >
              {formatRupees(Math.abs(remaining))} {remaining >= 0 ? 'left' : 'over'}
            </Text>
            <Text variant="bodySmall" style={styles.ofText}>
              of {formatRupees(budget)}
            </Text>
          </View>
        </View>

        <View style={styles.chartWrap}>
          <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
            <Circle
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={RADIUS}
              stroke={theme.colors.surfaceContainerHighest}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={RADIUS}
              stroke={progressColor}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={dashOffset}
              originX={DONUT_SIZE / 2}
              originY={DONUT_SIZE / 2}
              rotation={-90}
            />
          </Svg>
          <View style={styles.chartCenter}>
            <Text variant="titleMedium" style={styles.centerAmount}>
              {formatRupees(spent)}
            </Text>
            <Text variant="labelSmall" style={styles.centerLabel}>
              SPENT
            </Text>
          </View>
        </View>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.bottomStats}>
        <Stat label="TODAY" value={formatRupees(todaySpent)} styles={styles} />
        <View style={styles.statSeparator} />
        <Stat label="THIS WEEK" value={formatRupees(weekSpent)} styles={styles} />
        <View style={styles.statSeparator} />
        <Stat
          label="SAVINGS %"
          value={`${remainingPercent.toFixed(0)}%`}
          valueColor={theme.colors.primary}
          styles={styles}
        />
      </View>
    </View>
  );

  return (
    <Surface elevation={2} style={styles.surface}>
      {onPress ? (
        <TouchableRipple onPress={onPress} style={styles.ripple} borderless>
          {cardContent}
        </TouchableRipple>
      ) : (
        cardContent
      )}
    </Surface>
  );
}

function Stat({
  label,
  value,
  valueColor,
  styles,
}: {
  label: string;
  value: string;
  valueColor?: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.stat}>
      <Text variant="labelSmall" style={styles.statLabel}>
        {label}
      </Text>
      <Text
        variant="titleSmall"
        style={[styles.statValue, valueColor ? { color: valueColor } : null]}
      >
        {value}
      </Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    surface: {
      borderRadius: 24,
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      overflow: 'hidden',
    },
    ripple: {
      borderRadius: 24,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 18,
      gap: 16,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },
    leftColumn: {
      flex: 1,
      gap: 8,
    },
    eyebrow: {
      color: theme.colors.primary,
      fontWeight: typography.fontWeight.bold,
      letterSpacing: 0.8,
    },
    spentAmount: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
      letterSpacing: -0.5,
    },
    remainingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    remainingText: {
      fontWeight: typography.fontWeight.semiBold,
    },
    ofText: {
      color: theme.colors.onSurfaceVariant,
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
      justifyContent: 'center',
    },
    centerAmount: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
      fontSize: 16,
    },
    centerLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 10,
      letterSpacing: 0.6,
      fontWeight: typography.fontWeight.semiBold,
    },
    divider: {
      backgroundColor: theme.colors.outlineVariant,
    },
    bottomStats: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stat: {
      flex: 1,
      gap: 2,
    },
    statLabel: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: typography.fontWeight.semiBold,
      letterSpacing: 0.5,
      fontSize: 10,
    },
    statValue: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.semiBold,
    },
    statSeparator: {
      width: 1,
      height: 24,
      backgroundColor: theme.colors.outlineVariant,
      marginHorizontal: 8,
    },
  });
