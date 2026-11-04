import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
import type { Goal } from '../../types';
import { formatRupees } from '../../utils/currency';
import { parseLocalDate } from '../../utils/date';

const appreciationLines = [
  'That’s a milestone worth celebrating.',
  'Quiet progress, remarkable results.',
  'You kept showing up — that matters.',
  'Consistency looks good on you.',
];

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  'briefcase-outline': 'briefcase-outline',
  'airplane-outline': 'airplane-outline',
  'car-sport-outline': 'car-sport-outline',
  'home-outline': 'home-outline',
  'school-outline': 'school-outline',
  'medkit-outline': 'medkit-outline',
  'heart-outline': 'heart-outline',
  'film-outline': 'film-outline',
};

type Props = {
  visible: boolean;
  goal: Goal | null;
  onDone: () => void;
};

export function GoalCelebrationOverlay({ visible, goal, onDone }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const screen = Dimensions.get('window');
  const fade = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.94)).current;
  const cardTranslateY = useRef(new Animated.Value(18)).current;

  const appreciation = useMemo(
    () => appreciationLines[Math.floor(Math.random() * appreciationLines.length)],
    [goal?.id],
  );

  const sparkles = useMemo(() => {
    const count = 12;
    return Array.from({ length: count }, (_, index) => ({
      id: `sparkle-${goal?.id ?? 'goal'}-${index}`,
      left: Math.random() * screen.width,
      size: 8 + Math.random() * 8,
      duration: 1800 + Math.random() * 1200,
      delay: index * 140 + Math.random() * 220,
      drift: (Math.random() - 0.5) * 36,
      startY: screen.height * (0.12 + Math.random() * 0.72),
      opacity: 0.3 + Math.random() * 0.35,
    }));
  }, [goal?.id, screen.height, screen.width]);

  const sparkleValues = useRef(sparkles.map(() => new Animated.Value(0))).current;

  const confetti = useMemo(() => {
    const festiveColors = [
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.tertiary,
      theme.colors.error,
      theme.colors.primaryContainer,
      theme.colors.secondaryContainer,
    ];
    const count = 22;
    return Array.from({ length: count }, (_, index) => ({
      id: `confetti-${goal?.id ?? 'goal'}-${index}`,
      left: Math.random() * screen.width,
      size: 6 + Math.random() * 6,
      duration: 1600 + Math.random() * 1600,
      delay: index * 60 + Math.random() * 300,
      color: festiveColors[Math.floor(Math.random() * festiveColors.length)],
      rotation: (Math.random() - 0.5) * 720,
    }));
  }, [goal?.id, screen.width, theme.colors]);

  const confettiValues = useRef(confetti.map(() => new Animated.Value(0))).current;

  const iconBounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    iconBounce.setValue(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconBounce, {
          toValue: 1.18,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(iconBounce, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
    ).start();
    return () => iconBounce.stopAnimation();
  }, [visible, iconBounce]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: visible ? 1 : 0,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: visible ? 1 : 0.94,
        friction: 9,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: visible ? 0 : 18,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardScale, cardTranslateY, fade, visible]);

  useEffect(() => {
    if (!visible) return;

    const animations = sparkleValues.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(sparkles[index]?.delay ?? 0),
          Animated.timing(value, {
            toValue: 1,
            duration: sparkles[index]?.duration ?? 2200,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    animations.forEach((animation) => {
      animation.start();
    });

    return () => {
      animations.forEach((animation) => {
        animation.stop();
      });
    };
  }, [sparkleValues, sparkles, visible]);

  useEffect(() => {
    if (!visible) return;

    const animations = confettiValues.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(confetti[index]?.delay ?? 0),
          Animated.timing(value, {
            toValue: 1,
            duration: confetti[index]?.duration ?? 2400,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    animations.forEach((animation) => {
      animation.start();
    });

    return () => {
      animations.forEach((animation) => {
        animation.stop();
      });
    };
  }, [confettiValues, confetti, visible]);

  if (!goal) return null;

  const Icon = iconMap[goal.icon] || 'briefcase-outline';
  const deadline = goal.target_date
    ? parseLocalDate(goal.target_date).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No deadline';

  const remaining = Math.max(goal.target_amount - goal.saved_amount, 0);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDone}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: fade }]} />

        <View style={styles.sparkleLayer} pointerEvents="none">
          {sparkles.map((sparkle, index) => {
            const value = sparkleValues[index] ?? new Animated.Value(0);
            return (
              <Animated.Text
                key={sparkle.id}
                style={[
                  styles.sparkle,
                  {
                    left: sparkle.left,
                    top: sparkle.startY,
                    opacity: value.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [0, sparkle.opacity, 0],
                    }),
                    transform: [
                      {
                        translateY: value.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -screen.height * 0.55],
                        }),
                      },
                      {
                        translateX: value.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, sparkle.drift],
                        }),
                      },
                      {
                        scale: value.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.7, 1, 0.9],
                        }),
                      },
                    ],
                  },
                ]}
              >
                ✦
              </Animated.Text>
            );
          })}
        </View>

        <View style={styles.confettiLayer} pointerEvents="none">
          {confetti.map((piece, index) => {
            const value = confettiValues[index] ?? new Animated.Value(0);
            return (
              <Animated.View
                key={piece.id}
                style={[
                  styles.confetti,
                  {
                    left: piece.left,
                    width: piece.size,
                    height: piece.size * 0.55,
                    backgroundColor: piece.color,
                    opacity: value.interpolate({
                      inputRange: [0, 0.12, 0.9, 1],
                      outputRange: [0, 1, 1, 0],
                    }),
                    transform: [
                      {
                        translateY: value.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-screen.height * 0.15, screen.height * 0.85],
                        }),
                      },
                      {
                        rotate: value.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', `${piece.rotation}deg`],
                        }),
                      },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>

        <Pressable style={styles.dismissArea} onPress={onDone}>
          <Animated.View
            style={[
              styles.cardWrap,
              {
                opacity: fade,
                transform: [{ scale: cardScale }, { translateY: cardTranslateY }],
              },
            ]}
          >
            <View style={styles.glow} />
            <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Ionicons name="sparkles" size={14} color={theme.colors.secondary} />
                  <Text variant="labelSmall" style={styles.badgeText}>
                    Goal achieved
                  </Text>
                </View>
              </View>

              <View style={styles.goalRow}>
                <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconBounce }] }]}>
                  <Ionicons name={Icon} size={26} color={theme.colors.onSurface} />
                </Animated.View>
                <View style={styles.goalMeta}>
                  <Text variant="titleLarge" style={styles.goalName} numberOfLines={1}>
                    {goal.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.goalDeadline}>
                    {deadline}
                  </Text>
                </View>
                <Text variant="titleLarge" style={styles.goalPercent}>
                  100%
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text variant="labelSmall" style={styles.statLabel}>
                    Saved
                  </Text>
                  <Text variant="bodyMedium" style={styles.statValue}>
                    {formatRupees(goal.saved_amount)}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text variant="labelSmall" style={styles.statLabel}>
                    Target
                  </Text>
                  <Text variant="bodyMedium" style={styles.statValue}>
                    {formatRupees(goal.target_amount)}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text variant="labelSmall" style={styles.statLabel}>
                    Remaining
                  </Text>
                  <Text variant="bodyMedium" style={styles.statValue}>
                    {formatRupees(remaining)}
                  </Text>
                </View>
              </View>

              <View style={styles.appreciationCard}>
                <Text variant="labelSmall" style={styles.appreciationLabel}>
                  A note for you
                </Text>
                <Text variant="bodyMedium" style={styles.appreciationText}>
                  {appreciation}
                </Text>
              </View>

              <Button
                mode="contained"
                onPress={onDone}
                style={styles.doneButton}
                contentStyle={styles.doneButtonContent}
                labelStyle={styles.doneButtonLabel}
              >
                Done
              </Button>
            </Pressable>
          </Animated.View>
        </Pressable>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.md,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(6, 8, 14, 0.86)',
    },
    sparkleLayer: {
      ...StyleSheet.absoluteFillObject,
    },
    confettiLayer: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },
    confetti: {
      position: 'absolute',
      top: 0,
      borderRadius: 2,
    },
    sparkle: {
      position: 'absolute',
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: 18,
      textShadowColor: `${theme.colors.tertiary}40`,
      textShadowRadius: 10,
    },
    dismissArea: {
      width: '100%',
      alignItems: 'center',
    },
    cardWrap: {
      width: '100%',
      maxWidth: 420,
    },
    glow: {
      position: 'absolute',
      top: 18,
      left: 18,
      right: 18,
      bottom: 18,
      borderRadius: borderRadius.xl + 8,
      backgroundColor: `${theme.colors.primary}2E`,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.4,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: 0 },
    },
    card: {
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: spacing.md,
      gap: spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.3,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
    badgeRow: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.secondaryContainer,
      borderWidth: 1,
      borderColor: `${theme.colors.secondary}33`,
    },
    badgeText: {
      color: theme.colors.onSecondaryContainer,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semiBold,
    },
    goalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    goalMeta: {
      flex: 1,
      gap: 3,
    },
    goalName: {
      color: theme.colors.onSurface,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
    },
    goalDeadline: {
      color: theme.colors.onSurfaceVariant,
      fontSize: typography.fontSize.sm,
    },
    goalPercent: {
      color: theme.colors.secondary,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
    },
    progressTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceContainerHighest,
      overflow: 'hidden',
    },
    progressFill: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.secondary,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      padding: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      gap: 4,
    },
    statLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: typography.fontSize.xs,
    },
    statValue: {
      color: theme.colors.onSurface,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semiBold,
    },
    appreciationCard: {
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      gap: 6,
    },
    appreciationLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: typography.fontSize.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
    },
    appreciationText: {
      color: theme.colors.onSurface,
      fontSize: typography.fontSize.md,
      lineHeight: 22,
      fontWeight: typography.fontWeight.medium,
    },
    doneButton: {
      borderRadius: borderRadius.lg,
    },
    doneButtonContent: {
      minHeight: 48,
    },
    doneButtonLabel: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
  });
