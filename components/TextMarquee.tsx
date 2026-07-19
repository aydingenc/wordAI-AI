import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';

/**
 * Self-contained marquee for a table cell: static if the text fits its
 * column, otherwise scrolls left and back on a loop. Same measure-then-animate
 * mechanism as StoryReader's chapter title marquee (onLayout width compare +
 * Animated.loop of delay/timing/delay/timing-back). The inner text wrapper is
 * `position: absolute` exactly like StoryReader's `marqueeInner` — without it,
 * the wrapper stretches to the container's width (default flex `alignItems:
 * stretch`), which pre-clips the text to the column width before it can ever
 * be measured, so `textWidth` never exceeds `containerWidth` and the browser's
 * own ellipsis renders instead of the scroll. Absolute positioning takes the
 * text out of flow so it sizes to its true, unclipped content width, which is
 * why the container needs an explicit `height`.
 *
 * `textWidth` normally comes from the Text's own `onLayout`, but on some
 * low-end Android devices that callback never fires (or fires once with a
 * stale 0) while a custom font is still loading, leaving `textWidth` stuck
 * at 0 forever — the animation effect below bails out on `!textWidth` and
 * the marquee never starts. FALLBACK_MEASURE_DELAY ms after each text
 * change, if no real measurement has arrived yet, a rough character-count
 * estimate is used instead so the marquee can still start; a genuine
 * `onLayout` measurement (before or after the fallback fires) always wins.
 */
const FALLBACK_MEASURE_DELAY = 700;
const ESTIMATED_CHAR_WIDTH_RATIO = 0.58;
const DEFAULT_FONT_SIZE = 12;

export function TextMarquee({
  text,
  style,
  height = 20,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
  height?: number;
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTextWidth(0);

    const fontSize = StyleSheet.flatten(style)?.fontSize ?? DEFAULT_FONT_SIZE;
    const estimatedWidth = text.length * fontSize * ESTIMATED_CHAR_WIDTH_RATIO;
    const fallbackTimer = setTimeout(() => {
      setTextWidth((prev) => (prev === 0 ? estimatedWidth : prev));
    }, FALLBACK_MEASURE_DELAY);

    return () => clearTimeout(fallbackTimer);
    // `style` is intentionally excluded — call sites pass a fresh array
    // literal every render, and re-running this on every such render would
    // keep resetting textWidth to 0 and never let either the real
    // measurement or the fallback timer land.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    if (!containerWidth || !textWidth) return;
    const overflow = textWidth - containerWidth;

    if (overflow <= 3) {
      translateX.setValue(0);
      return;
    }

    translateX.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(translateX, {
          toValue: -overflow - 4,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(900),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [containerWidth, textWidth, translateX]);

  return (
    <View
      style={[styles.container, { height }]}
      onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.inner, { transform: [{ translateX }] }]}>
        <Text
          style={style}
          numberOfLines={1}
          ellipsizeMode="clip"
          onLayout={(e: LayoutChangeEvent) => setTextWidth(e.nativeEvent.layout.width)}
        >
          {text}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    minWidth: 0,
    width: '100%',
    position: 'relative',
  },
  inner: {
    position: 'absolute',
    left: 0,
    top: 0,
    flexDirection: 'row',
  },
});
