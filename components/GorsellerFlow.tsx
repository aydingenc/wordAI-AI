import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

// Category colors — mirrors the words card: green (nouns/feelings),
// orange (verbs), blue (places).
const GREEN = '#34D399';
const ORANGE = '#FB923C';
const BLUE = '#60A5FA';

const IMG = {
  love: require('@/assets/images/flow-love.jpg') as ImageSourcePropType,
  travel: require('@/assets/images/flow-travel.jpg') as ImageSourcePropType,
  business: require('@/assets/images/flow-business.jpg') as ImageSourcePropType,
  daily: require('@/assets/images/flow-daily.jpg') as ImageSourcePropType,
  hero: require('@/assets/images/flow-hero.jpg') as ImageSourcePropType,
};

// Each themed image streams down its own lane so all four are clearly visible.
const FALL_IMAGES: { key: string; src: ImageSourcePropType; label: string; lane: number }[] = [
  { key: 'love', src: IMG.love, label: 'love', lane: 0.22 },
  { key: 'travel', src: IMG.travel, label: 'travel', lane: 0.7 },
  { key: 'business', src: IMG.business, label: 'business', lane: 0.3 },
  { key: 'daily', src: IMG.daily, label: 'daily life', lane: 0.64 },
];

const FALL_DURATION = 3600;
const THUMB_W = 64;
const THUMB_H = 46;

function withAlpha(hex: string, alpha: string) {
  return hex + alpha;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** A single image thumbnail streaming from the top of the card to the bottom. */
function FallingImage({
  src,
  label,
  lane,
  index,
  count,
  height,
  containerWidth,
  flow,
}: {
  src: ImageSourcePropType;
  label: string;
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

  // Center the thumbnail in its lane, then clamp so it never overflows the card.
  const maxShift = Math.max(0, containerWidth / 2 - THUMB_W / 2 - 2);
  const tx = clamp(containerWidth * lane - containerWidth / 2, -maxShift, maxShift);

  // Travel the full card height (enter from fully above, exit off the bottom)
  // so photos stream continuously top→bottom instead of piling at the bottom.
  const style = useAnimatedStyle(() => ({
    opacity: flow.value * interpolate(p.value, [0, 0.14, 0.82, 1], [0, 1, 1, 0]),
    transform: [
      { translateX: tx },
      { translateY: interpolate(p.value, [0, 1], [-THUMB_H - 8, height - 6]) },
      { scale: interpolate(p.value, [0, 0.2, 1], [0.82, 1, 0.92]) },
    ],
  }));

  return (
    <Animated.View style={[styles.fallItem, style]}>
      <View style={styles.thumbWrap}>
        <Image source={src} style={styles.thumb} resizeMode="cover" />
      </View>
      <Text style={styles.thumbLabel} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

/** Highlighted inline word inside the assembled story. */
function HL({ children, color }: { children: string; color: string }) {
  return (
    <Text style={[styles.hl, { color, backgroundColor: withAlpha(color, '24') }]}>
      {children}
    </Text>
  );
}

/**
 * Animated "Görsellerden" preview: themed photos stream downward, then a hero
 * photo settles at the top and a short story with colored target words appears
 * beneath it. Loops forever.
 */
export function GorsellerFlow({
  height = 168,
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
        schedule(cycle, 3000);
      }, 5200);
    };
    cycle();
    return () => {
      alive = false;
      clear();
      cancelAnimation(flow);
    };
  }, [flow]);

  const settledStyle = useAnimatedStyle(() => ({ opacity: 1 - flow.value }));

  return (
    <View style={[styles.region, { height }]} onLayout={onLayout}>
      {/* Streaming photos — each in its own lane */}
      {width > 0 &&
        FALL_IMAGES.map((it, i) => (
          <FallingImage
            key={it.key}
            src={it.src}
            label={it.label}
            lane={it.lane}
            index={i}
            count={FALL_IMAGES.length}
            height={height}
            containerWidth={width}
            flow={flow}
          />
        ))}

      {/* Settled hero photo + story */}
      <Animated.View style={[styles.settled, settledStyle]} pointerEvents="none">
        <View style={styles.heroWrap}>
          <Image source={IMG.hero} style={styles.hero} resizeMode="cover" />
        </View>
        <Text style={[styles.story, { color: textColor }]}>
          Mia enjoys a warm <HL color={GREEN}>coffee</HL> and reads a good{' '}
          <HL color={GREEN}>book</HL>. Later she will <HL color={ORANGE}>travel</HL>{' '}
          to meet a <HL color={GREEN}>friend</HL> in the <HL color={BLUE}>city</HL>.
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
    gap: 3,
  },
  thumbWrap: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9.5,
    color: 'rgba(226, 214, 255, 0.72)',
    letterSpacing: 0.2,
  },
  settled: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    gap: 9,
  },
  heroWrap: {
    width: '100%',
    height: 66,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  story: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10.5,
    lineHeight: 15.5,
    textAlign: 'left',
  },
  hl: {
    fontFamily: 'Inter_700Bold',
    borderRadius: 3,
  },
});
