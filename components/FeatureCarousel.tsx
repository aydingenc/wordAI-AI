import React, { useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlowCard } from '@/components/GlowCard';
import { useColors } from '@/hooks/useColors';

const BOOK = require('@/assets/images/home-book.jpg');

interface Slide {
  title: string;
  sub: string;
  image?: ReturnType<typeof require>;
  icon?: keyof typeof Feather.glyphMap;
  play?: boolean;
}

const SLIDES: Slide[] = [
  {
    title: 'bigFather ile kelimeleri hikâyeler, görseller ve tekrar sistemiyle öğren',
    sub: 'En iyi nasıl faydalanırsın?',
    image: BOOK,
    play: true,
  },
  {
    title: 'Kelimelerini yaz, sana özel yapay zekâ hikâyesi anında oluşsun',
    sub: 'Kelimelerden Öğren',
    icon: 'edit-3',
  },
  {
    title: 'Bir fotoğraf seç, içindeki İngilizce kelimeler ortaya çıksın',
    sub: 'Görsellerden Öğren',
    icon: 'camera',
  },
];

export function FeatureCarousel({ onPress }: { onPress?: () => void }) {
  const colors = useColors();
  const [w, setW] = useState(0);
  const [index, setIndex] = useState(0);
  const ref = useRef<ScrollView>(null);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!w) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / w);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (!w) return;
    const i = (index + 1) % SLIDES.length;
    ref.current?.scrollTo({ x: i * w, animated: true });
    setIndex(i);
  };

  return (
    <GlowCard padded={false} style={styles.card}>
      <View
        style={styles.inner}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
      >
        {w > 0 ? (
          <ScrollView
            ref={ref}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumEnd}
            onScrollEndDrag={onMomentumEnd}
            scrollEventThrottle={16}
          >
            {SLIDES.map((s, i) => (
              <Pressable
                key={i}
                onPress={onPress}
                style={[styles.slide, { width: w }]}
              >
                <View style={styles.textCol}>
                  <Text style={[styles.title, { color: colors.foreground }]}>
                    {s.title}
                  </Text>
                  <Text style={[styles.sub, { color: colors.accent }]}>
                    {s.sub}
                  </Text>
                </View>
                <View style={styles.visual}>
                  {s.image ? (
                    <Image source={s.image} style={styles.img} />
                  ) : (
                    <LinearGradient
                      colors={[colors.primary, colors.glowMagenta]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconTile}
                    >
                      <Feather name={s.icon!} size={26} color="#FFFFFF" />
                    </LinearGradient>
                  )}
                  {s.play ? (
                    <View style={styles.play}>
                      <Feather name="play" size={15} color="#FFFFFF" />
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <Pressable
          onPress={next}
          style={[styles.chevron, { backgroundColor: colors.secondary }]}
          hitSlop={8}
        >
          <Feather name="chevron-right" size={20} color={colors.foreground} />
        </Pressable>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? colors.primary : colors.border,
                  width: i === index ? 16 : 6,
                },
              ]}
            />
          ))}
          <Text style={[styles.count, { color: colors.mutedForeground }]}>
            {index + 1} / {SLIDES.length}
          </Text>
        </View>
      </View>
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  inner: {
    minHeight: 112,
    position: 'relative',
  },
  slide: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 16,
    paddingRight: 48,
    paddingTop: 12,
    paddingBottom: 22,
  },
  textCol: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13.5,
    lineHeight: 18,
  },
  sub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12.5,
  },
  visual: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    width: 70,
    height: 70,
    borderRadius: 14,
  },
  iconTile: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.92)',
  },
  chevron: {
    position: 'absolute',
    right: 12,
    top: 40,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    left: 16,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  count: {
    marginLeft: 8,
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
});
