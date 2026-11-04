import React, { useImperativeHandle, useMemo } from 'react';
import {
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Text } from 'react-native-paper';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';

const SWIPE_THRESHOLD = 60;
const VELOCITY_THRESHOLD = 800;
const FLY_OFF_DURATION = 200;
const RETRACT_DURATION = 220;
const SPRING_BACK_DURATION = 250;
const MAX_VERTICAL = 20;
const ROTATE_DIVISOR = 20;

function hexToRgba(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const raw = color.slice(1);
    if (raw.length === 6) {
      const r = Number.parseInt(raw.slice(0, 2), 16);
      const g = Number.parseInt(raw.slice(2, 4), 16);
      const b = Number.parseInt(raw.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return color;
}

export type SwipeDeckCardHandle = {
  /** Animate the card back to center (used when user cancels the reject-confirm). */
  retract: () => void;
};

type SwipeDeckCardProps = {
  children: React.ReactNode;
  onSwipedRight: () => Promise<boolean>;
  onSwipedLeft: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const SwipeDeckCard = React.forwardRef<SwipeDeckCardHandle, SwipeDeckCardProps>(
  ({ children, onSwipedRight, onSwipedLeft, disabled, style }, ref) => {
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { width: screenW } = useWindowDimensions();
    const flyTarget = screenW + 100;

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const rotate = useSharedValue(0);

    const springBack = () => {
      'worklet';
      translateX.value = withTiming(0, {
        duration: SPRING_BACK_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(0, {
        duration: SPRING_BACK_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      rotate.value = withTiming(0, {
        duration: SPRING_BACK_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    };

    const flyOffRight = () => {
      'worklet';
      translateX.value = withTiming(flyTarget, {
        duration: FLY_OFF_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(0, {
        duration: FLY_OFF_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      rotate.value = withTiming(0, {
        duration: FLY_OFF_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    };

    const flyOffLeft = () => {
      'worklet';
      translateX.value = withTiming(-flyTarget, {
        duration: FLY_OFF_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(0, {
        duration: FLY_OFF_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      rotate.value = withTiming(0, {
        duration: FLY_OFF_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    };

    // JS-thread handler: the card is already flying off; on save failure
    // pull it back so the user can retry or reject.
    const handleRightDecision = async () => {
      let ok = false;
      try {
        ok = await onSwipedRight();
      } catch {
        ok = false;
      }
      if (!ok) {
        springBack();
      }
    };

    const pan = Gesture.Pan()
      .enabled(!disabled)
      .onUpdate((e) => {
        'worklet';
        if (disabled) {
          return;
        }
        translateX.value = e.translationX;
        translateY.value = Math.max(Math.min(e.translationY, MAX_VERTICAL), -MAX_VERTICAL);
        rotate.value = e.translationX / ROTATE_DIVISOR;
      })
      .onEnd((e) => {
        'worklet';
        if (disabled) {
          return;
        }
        const tx = translateX.value;
        const vx = e.velocityX;
        if (tx >= SWIPE_THRESHOLD || vx > VELOCITY_THRESHOLD) {
          // Fly off immediately, save runs in parallel; retract on failure.
          flyOffRight();
          runOnJS(handleRightDecision)();
        } else if (tx <= -SWIPE_THRESHOLD || vx < -VELOCITY_THRESHOLD) {
          // Fire-and-forget left fly-off; notify parent.
          flyOffLeft();
          runOnJS(onSwipedLeft)();
        } else {
          springBack();
        }
      });

    const cardStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
      ],
    }));

    const acceptOverlayStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        translateX.value,
        [0, SWIPE_THRESHOLD],
        [0, 1],
        Extrapolation.CLAMP,
      );
      return { opacity };
    });

    const rejectOverlayStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        translateX.value,
        [0, -SWIPE_THRESHOLD],
        [0, 1],
        Extrapolation.CLAMP,
      );
      return { opacity };
    });

    useImperativeHandle(
      ref,
      () => ({
        retract: () => {
          translateX.value = withTiming(0, {
            duration: RETRACT_DURATION,
            easing: Easing.out(Easing.cubic),
          });
          translateY.value = withTiming(0, {
            duration: RETRACT_DURATION,
            easing: Easing.out(Easing.cubic),
          });
          rotate.value = withTiming(0, {
            duration: RETRACT_DURATION,
            easing: Easing.out(Easing.cubic),
          });
        },
      }),
      [translateX, translateY, rotate],
    );

    return (
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, style, cardStyle]}>
          <View style={styles.body} pointerEvents="box-none">
            {children}
          </View>

          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.acceptOverlay, acceptOverlayStyle]}
          >
            <View style={styles.pillTopRight}>
              <Text variant="labelLarge" style={styles.pillAcceptText}>
                Accept
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.rejectOverlay, rejectOverlayStyle]}
          >
            <View style={styles.pillTopLeft}>
              <Text variant="labelLarge" style={styles.pillRejectText}>
                Reject
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    );
  },
);

SwipeDeckCard.displayName = 'SwipeDeckCard';

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surfaceContainer,
      borderColor: theme.colors.outlineVariant,
      borderRadius: borderRadius.xl,
    },
    body: {
      // Lets taps reach the underlying editable fields.
    },
    acceptOverlay: {
      backgroundColor: hexToRgba(theme.colors.primaryContainer, 0.45),
      borderRadius: borderRadius.xl,
    },
    rejectOverlay: {
      backgroundColor: hexToRgba(theme.colors.errorContainer, 0.45),
      borderRadius: borderRadius.xl,
    },
    pillTopRight: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
      transform: [{ rotate: '12deg' }],
    },
    pillTopLeft: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: 2,
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.errorContainer,
      transform: [{ rotate: '-12deg' }],
    },
    pillAcceptText: {
      color: theme.colors.onPrimaryContainer,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      letterSpacing: 1,
    },
    pillRejectText: {
      color: theme.colors.onErrorContainer,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      letterSpacing: 1,
    },
  });
