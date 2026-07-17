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
 */
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
        Animated.delay(1200),
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
