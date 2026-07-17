import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import { EmptySession } from './story';

export default function FlashcardsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentSession, addLearnedWords } = useProgress();

  const words = currentSession?.targetWords ?? [];
  const [index, setIndex] = useState(0);
  const [known, setKnown] = useState(0);
  const flip = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }],
    opacity: flip.value < 0.5 ? 1 : 0,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }],
    opacity: flip.value >= 0.5 ? 1 : 0,
  }));

  if (!currentSession || words.length === 0) return <EmptySession />;

  const word = words[index];

  const doFlip = () => {
    const to = flipped ? 0 : 1;
    flip.value = withTiming(to, { duration: 400 });
    setFlipped(!flipped);
  };

  const advance = (didKnow: boolean) => {
    if (didKnow) setKnown((k) => k + 1);
    if (index + 1 >= words.length) {
      addLearnedWords(words);
      router.push({
        pathname: '/learn/summary',
        params: {
          fromCards: '1',
          known: String(known + (didKnow ? 1 : 0)),
          total: String(words.length),
        },
      });
      return;
    }
    flip.value = 0;
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  return (
    <GradientBackground>
      <ScreenHeader title="Kelime Kartları" subtitle={`${index + 1} / ${words.length}`} />

      <View style={styles.body}>
        <Pressable style={styles.cardArea} onPress={doFlip}>
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.primary, borderRadius: colors.radius, shadowColor: colors.primaryGlow },
              frontStyle,
            ]}
          >
            <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>
              Anlamı için dokun
            </Text>
            <Text style={[styles.front, { color: colors.foreground }]}>{word.en}</Text>
            {word.phonetic ? (
              <Text style={[styles.phonetic, { color: colors.accent }]}>
                {word.phonetic}
              </Text>
            ) : null}
            <Feather name="rotate-cw" size={20} color={colors.mutedForeground} />
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              { backgroundColor: colors.cardAlt, borderColor: colors.accent, borderRadius: colors.radius, shadowColor: colors.primaryGlow },
              backStyle,
            ]}
          >
            <Text style={[styles.back, { color: colors.foreground }]}>{word.tr}</Text>
            <View style={[styles.exampleBox, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.exampleEn, { color: colors.foreground }]}>
                {word.example}
              </Text>
              <Text style={[styles.exampleTr, { color: colors.mutedForeground }]}>
                {word.exampleTr}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/word-network')}
              style={styles.dnaLink}
            >
              <Feather name="activity" size={15} color={colors.accent} />
              <Text style={[styles.dnaText, { color: colors.accent }]}>
                Word DNA'yı gör
              </Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => advance(false)}
          style={[styles.judgeBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
        >
          <Feather name="rotate-ccw" size={20} color={colors.warning} />
          <Text style={[styles.judgeText, { color: colors.foreground }]}>Tekrar</Text>
        </Pressable>
        <Pressable
          onPress={() => advance(true)}
          style={[styles.judgeBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
        >
          <Feather name="check" size={20} color={colors.primaryForeground} />
          <Text style={[styles.judgeText, { color: colors.primaryForeground }]}>
            Biliyorum
          </Text>
        </Pressable>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  cardArea: {
    height: 420,
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 28,
    backfaceVisibility: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  cardBack: {},
  tapHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  front: {
    fontFamily: 'Inter_700Bold',
    fontSize: 42,
    textAlign: 'center',
  },
  phonetic: {
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
  },
  back: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    textAlign: 'center',
  },
  exampleBox: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
    width: '100%',
  },
  exampleEn: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 22,
  },
  exampleTr: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  dnaLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dnaText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  judgeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
  },
  judgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});
