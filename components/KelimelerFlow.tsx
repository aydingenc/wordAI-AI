import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

// Category colors — green (nouns/feelings), orange (verbs), blue (places).
const GREEN = '#34D399';
const ORANGE = '#FB923C';
const BLUE = '#60A5FA';

// Each word streams down its own lane (fraction of the card width) so all of
// them are clearly visible, not stacked on the same center line.
const FALL_WORDS: { w: string; c: string; lane: number }[] = [
  { w: 'love', c: GREEN, lane: 0.2 },
  { w: 'travel', c: ORANGE, lane: 0.66 },
  { w: 'airport', c: BLUE, lane: 0.3 },
  { w: 'beautiful', c: GREEN, lane: 0.62 },
];

const FALL_DURATION = 3000;

function withAlpha(hex: string, alpha: string) {
  return hex + alpha;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** A single word chip streaming from the top of the card to the bottom. */
function FallingWord({
  word,
  color,
  lane,
  index,
  count,
  height,
  containerWidth,
  flow,
}: {
  word: string;
  color: string;
  lane: number;
  index: number;
  count: number;
  height: number;
  containerWidth: number;
  flow: SharedValue<number>;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      (index * FALL_DURATION) / count,
      withRepeat(withTiming(1, { duration: FALL_DURATION, easing: Easing.linear }), -1, false),
    );
    return () => cancelAnimation(p);
  }, [index, count, p]);

  // Center the chip in its lane, then clamp so it never overflows the card.
  const approxW = word.length * 9 + 26;
  const maxShift = Math.max(0, containerWidth / 2 - approxW / 2 - 2);
  const tx = clamp(containerWidth * lane - containerWidth / 2, -maxShift, maxShift);

  const style = useAnimatedStyle(() => ({
    opacity: flow.value * interpolate(p.value, [0, 0.14, 0.8, 1], [0, 1, 1, 0]),
    transform: [
      { translateX: tx },
      { translateY: interpolate(p.value, [0, 1], [-12, height - 20]) },
      { scale: interpolate(p.value, [0, 0.2, 1], [0.82, 1, 0.9]) },
    ],
  }));

  return (
    <Animated.View style={[styles.fallItem, style]}>
      <View
        style={[
          styles.chip,
          { backgroundColor: withAlpha(color, '22'), borderColor: withAlpha(color, '66') },
        ]}
      >
        <Text style={[styles.chipText, { color }]}>{word}</Text>
      </View>
    </Animated.View>
  );
}

/** Highlighted inline word inside the assembled paragraph. */
function HL({ children, color }: { children: string; color: string }) {
  return (
    <Text style={[styles.hl, { color, backgroundColor: withAlpha(color, '24') }]}>
      {children}
    </Text>
  );
}

/**
 * Animated "Kelimelerden" preview: colored words stream downward, then gather
 * and cross-fade into a highlighted example paragraph. Loops forever.
 */
export function KelimelerFlow({
  height = 130,
  textColor,
}: {
  height?: number;
  textColor: string;
}) {
  const flow = useSharedValue(1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  useEffect(() => {
    let alive = true;
    const clear = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // Schedule a timeout, tracking its id and pruning it once it fires so the
    // ref never grows unbounded during the infinite loop.
    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        timers.current = timers.current.filter((t) => t !== id);
        fn();
      }, ms);
      timers.current.push(id);
    };
    const cycle = () => {
      if (!alive) return;
      flow.value = withTiming(1, { duration: 500 });
      schedule(() => {
        if (!alive) return;
        flow.value = withTiming(0, { duration: 650 });
        schedule(cycle, 2800);
      }, 3400);
    };
    cycle();
    return () => {
      alive = false;
      clear();
      cancelAnimation(flow);
    };
  }, [flow]);

  const textStyle = useAnimatedStyle(() => ({ opacity: 1 - flow.value }));

  return (
    <View style={[styles.region, { height }]} onLayout={onLayout}>
      {/* Streaming words — each in its own lane */}
      {width > 0 &&
        FALL_WORDS.map((it, i) => (
          <FallingWord
            key={it.w}
            word={it.w}
            color={it.c}
            lane={it.lane}
            index={i}
            count={FALL_WORDS.length}
            height={height}
            containerWidth={width}
            flow={flow}
          />
        ))}

      {/* Assembled paragraph */}
      <Animated.View style={[styles.paragraphWrap, textStyle]} pointerEvents="none">
        <Text style={[styles.paragraph, { color: textColor }]}>
          Sara <HL color={GREEN}>loves</HL> <HL color={ORANGE}>travel</HL>. She is
          at the <HL color={BLUE}>airport</HL>, ready for a new adventure. The{' '}
          <HL color={BLUE}>airport</HL> is very busy. Sara <HL color={GREEN}>loves</HL>{' '}
          discovering <HL color={GREEN}>beautiful</HL> new places.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  region: {
    alignSelf: 'stretch',
    position: 'relative',
    overflow: 'hidden',
  },
  fallItem: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  chip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 4.5,
  },
  chipText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  paragraphWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  paragraph: {
    fontFamily: 'Inter_500Medium',
    fontSize: 9,
    lineHeight: 13.5,
    textAlign: 'left',
  },
  hl: {
    fontFamily: 'Inter_700Bold',
    borderRadius: 3,
  },
});
