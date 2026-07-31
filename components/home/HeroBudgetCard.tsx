import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Pattern, Path, Rect } from 'react-native-svg';
import { typography } from '../../constants/theme';
import { formatRupees } from '../../utils/currency';

interface HeroBudgetCardProps {
  spent: number;
  budget: number;
  remaining: number;
  todaySpent: number;
  weekSpent: number;
  onPress?: () => void;
}

const DONUT_SIZE = 116;
const STROKE_WIDTH = 11;
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
  const progress = budget > 0 ? Math.min(spent / budget, 1) : 0;
  const remainingPercent = budget > 0 ? Math.max((remaining / budget) * 100, 0) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const glowAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    glow.start();
    return () => {
      glow.stop();
    };
  }, [glowAnim]);

  const content = (
    <View style={styles.content}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowLayer,
          {
            opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.12] }),
          },
        ]}
      />
      <Svg pointerEvents="none" style={styles.gridOverlay} width="100%" height="100%">
        <Defs>
          <Pattern id="grid" width={30} height={30} patternUnits="userSpaceOnUse">
            <Path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(90,140,255,0.06)" strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />
      </Svg>
      <View style={styles.topRow}>
        <View style={styles.leftColumn}>
          <Text style={styles.eyebrow}>SPENT THIS MONTH</Text>
          <Text style={styles.spentAmount}>{formatRupees(spent)}</Text>
          <View style={styles.remainingRow}>
            <View style={styles.greenDot} />
            <Text style={styles.remainingText}>{formatRupees(Math.abs(remaining))} {remaining >= 0 ? 'left' : 'over'}</Text>
            <Text style={styles.ofText}>of {formatRupees(budget)}</Text>
          </View>
        </View>

        <View style={styles.chartWrap}>
          <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
            <Circle
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={RADIUS}
              stroke="rgba(245,166,35,0.16)"
              strokeWidth={STROKE_WIDTH + 8}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={dashOffset}
              originX={DONUT_SIZE / 2}
              originY={DONUT_SIZE / 2}
              rotation={-90}
            />
            <Circle
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={RADIUS}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={RADIUS}
              stroke="#F5A623"
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
            <Text style={styles.centerAmount}>{formatRupees(spent)}</Text>
            <Text style={styles.centerLabel}>SPENT</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomStats}>
        <Stat label="TODAY" value={formatRupees(todaySpent)} />
        <Hairline />
        <Stat label="THIS WEEK" value={formatRupees(weekSpent)} />
        <Hairline />
        <Stat label="SAVINGS %" value={`${remainingPercent.toFixed(0)}%`} valueColor="#1DC496" />
      </View>
    </View>
  );

  return onPress ? (
    <Pressable onPress={onPress} style={styles.pressable}>
      <LinearGradient
        colors={['#123C86', '#0F2F63', '#0B223F', '#0A191D']}
        start={{ x: 0.08, y: 0.02 }}
        end={{ x: 0.94, y: 0.98 }}
        style={styles.gradient}
      >
        {content}
      </LinearGradient>
    </Pressable>
  ) : (
    <View style={styles.pressable}>
      <LinearGradient
        colors={['#123C86', '#0F2F63', '#0B223F', '#0A191D']}
        start={{ x: 0.08, y: 0.02 }}
        end={{ x: 0.94, y: 0.98 }}
        style={styles.gradient}
      >
        {content}
      </LinearGradient>
    </View>
  );
}

function Stat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

function Hairline() {
  return <View style={styles.hairline} />;
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(90,140,255,0.18)',
    shadowColor: '#1A6BFF',
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
  },
  gradient: {
    borderRadius: 24,
  },
  content: {
    position: 'relative',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    gap: 20,
    backgroundColor: '#0A0F1A',
    overflow: 'hidden',
    minHeight: 250,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,107,255,0.05)',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  leftColumn: {
    flex: 1,
    gap: 10,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: 'rgba(120,170,255,0.7)',
    fontWeight: typography.fontWeight.bold,
  },
  spentAmount: {
    fontSize: 30,
    lineHeight: 34,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.4,
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4FD2FF',
  },
  remainingText: {
    color: '#8ADFFF',
    fontSize: 13,
    fontWeight: typography.fontWeight.semiBold,
  },
  ofText: {
    color: 'rgba(173,186,214,0.75)',
    fontSize: 13,
  },
  chartWrap: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A6BFF',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  chartCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAmount: {
    color: '#4FD2FF',
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
  },
  centerLabel: {
    marginTop: 2,
    color: 'rgba(181,228,255,0.72)',
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: typography.fontWeight.bold,
  },
  bottomStats: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(120,170,255,0.12)',
    paddingTop: 12,
  },
  stat: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    color: 'rgba(154,199,255,0.74)',
    fontSize: 10,
    letterSpacing: 0.9,
    fontWeight: typography.fontWeight.bold,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: typography.fontWeight.semiBold,
  },
  hairline: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(120,170,255,0.12)',
    marginHorizontal: 10,
  },
});
