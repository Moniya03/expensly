import React, { useImperativeHandle, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { borderRadius, type Colors, spacing, typography, useColors } from '../../constants/theme';

const SWIPE_THRESHOLD = 90;
const FLY_OFF_DURATION = 300;
const RETRACT_DURATION = 220;
const SPRING_BACK_DURATION = 250;
const MAX_VERTICAL = 20;
const ROTATE_DIVISOR = 20;
const ACCEPT_OVERLAY = 'rgba(52,199,89,0.25)';
const REJECT_OVERLAY = 'rgba(255,71,87,0.25)';

export type SwipeDeckCardHandle = {
  /** Animate the card back to center (used when user cancels the reject-confirm). */
  retract: () => void;
};

type SwipeDeckCardProps = {
  children: React.ReactNode;
  onSwipedRight: () => Promise<boolean>;
  onSwipedLeft: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export const SwipeDeckCard = React.forwardRef<SwipeDeckCardHandle, SwipeDeckCardProps>(
  ({ children, onSwipedRight, onSwipedLeft, disabled, style }, ref) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
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

    // JS-thread handler: awaits the save, then chooses fly-off vs retract.
    const handleRightDecision = async () => {
      let ok = false;
      try {
        ok = await onSwipedRight();
      } catch {
        ok = false;
      }
      if (ok) {
        flyOffRight();
      } else {
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
      .onEnd(() => {
        'worklet';
        if (disabled) {
          return;
        }
        const tx = translateX.value;
        if (tx >= SWIPE_THRESHOLD) {
          // Defer fly-off vs retract until the save resolves.
          runOnJS(handleRightDecision)();
        } else if (tx <= -SWIPE_THRESHOLD) {
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
              <Text style={styles.pillAcceptText}>Accept</Text>
            </View>
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.rejectOverlay, rejectOverlayStyle]}
          >
            <View style={styles.pillTopLeft}>
              <Text style={styles.pillRejectText}>Reject</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    );
  },
);

SwipeDeckCard.displayName = 'SwipeDeckCard';

const createStyles = (_colors: Colors) =>
  StyleSheet.create({
    card: {
      // Frame styling (bg/border/shadow) is the parent's responsibility.
    },
    body: {
      // Lets taps reach the underlying editable fields.
    },
    acceptOverlay: {
      backgroundColor: ACCEPT_OVERLAY,
      borderRadius: borderRadius.lg,
    },
    rejectOverlay: {
      backgroundColor: REJECT_OVERLAY,
      borderRadius: borderRadius.lg,
    },
    pillTopRight: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: 2,
      borderColor: 'rgba(52,199,89,0.9)',
      backgroundColor: 'rgba(52,199,89,0.18)',
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
      borderColor: 'rgba(255,71,87,0.9)',
      backgroundColor: 'rgba(255,71,87,0.18)',
      transform: [{ rotate: '-12deg' }],
    },
    pillAcceptText: {
      color: '#0E5A2A',
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      letterSpacing: 1,
    },
    pillRejectText: {
      color: '#7A1418',
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      letterSpacing: 1,
    },
  });
