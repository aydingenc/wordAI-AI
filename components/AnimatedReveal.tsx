import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

/**
 * Fades + slides its children in once `visible` becomes true.
 * Used to drive the staged onboarding animation.
 */
export function AnimatedReveal({
  visible,
  children,
  style,
  from = 24,
  duration = 550,
  delay = 0,
}: {
  visible: boolean;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  from?: number;
  duration?: number;
  delay?: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, progress, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * from }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/**
 * Scale + glow reveal used for the central AI engine circle.
 */
export function AnimatedPop({
  visible,
  children,
  style,
}: {
  visible: boolean;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: 650,
      easing: Easing.out(Easing.back(1.6)),
    });
  }, [visible, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
