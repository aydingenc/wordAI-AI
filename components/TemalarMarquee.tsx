import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { THEMES } from '@/data/mock';

// Accent dots cycle the same palette as the two flow cards.
const ACCENTS = ['#34D399', '#60A5FA', '#FB923C', '#C084FC', '#F472B6'];

function withAlpha(hex: string, alpha: string) {
  return hex + alpha;
}

const ITEMS = THEMES.slice(0, 5).map((t, i) => ({
  key: t.id,
  name: t.name,
  image: t.image,
  color: ACCENTS[i % ACCENTS.length],
}));

function Chip({
  name,
  image,
  color,
}: {
  name: string;
  image: (typeof ITEMS)[number]['image'];
  color: string;
}) {
  return (
    <View style={[styles.chip, { borderColor: withAlpha(color, '55') }]}>
      <Image source={image} style={styles.thumb} resizeMode="cover" />
      <View style={[styles.dot, { backgroundColor: color, shadowColor: color }]} />
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

/**
 * A seamless horizontal marquee of the ready-made theme sets. Two identical
 * copies scroll left forever, giving the themes card the same "living" feel as
 * the two flow cards above.
 */
export function TemalarMarquee() {
  const tx = useSharedValue(0);
  const [setWidth, setSetWidth] = useState(0);

  useEffect(() => {
    if (setWidth <= 0) return;
    tx.value = 0;
    tx.value = withRepeat(
      withTiming(-setWidth, { duration: setWidth * 26, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(tx);
  }, [setWidth, tx]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  return (
    <View style={styles.viewport} pointerEvents="none">
      <Animated.View style={[styles.track, style]}>
        <View
          style={styles.set}
          onLayout={(e) => setSetWidth(e.nativeEvent.layout.width)}
        >
          {ITEMS.map((it) => (
            <Chip key={it.key} name={it.name} image={it.image} color={it.color} />
          ))}
        </View>
        {/* Duplicate copy for a seamless loop */}
        <View style={styles.set}>
          {ITEMS.map((it) => (
            <Chip key={it.key + '-dup'} name={it.name} image={it.image} color={it.color} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
  },
  set: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginRight: 9,
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12.5,
    color: 'rgba(233, 224, 255, 0.92)',
    letterSpacing: 0.2,
  },
});
