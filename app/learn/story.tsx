import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import { getWordTier, isNewWord, mockStoryCountForIndex, TIER_COLORS } from '@/data/mock';

export default function StoryLearnScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentSession } = useProgress();
  const [showTr, setShowTr] = useState(true);

  if (!currentSession) {
    return <EmptySession />;
  }

  const { title, levelName, paragraphs, targetWords } = currentSession;

  // storyCount is mocked per target word (no real per-user story history yet) —
  // same generator/tier rules as the legacy StoryReader, so the "NEW" badge and
  // tier color can never contradict each other (both derive from storyCount).
  const wordTierByKey = new Map(
    targetWords.map((w, i) => {
      const storyCount = mockStoryCountForIndex(i);
      return [w.en.toLowerCase(), { storyCount, tier: getWordTier(storyCount) }] as const;
    }),
  );
  // Tracks which storyCount===0 words have already claimed their NEW badge in
  // this render pass, so only the word's first occurrence in the story gets it.
  const seenNewWords = new Set<string>();
  const claimNewWordBadge = (word: string): boolean => {
    const key = word.toLowerCase();
    if (seenNewWords.has(key)) return false;
    seenNewWords.add(key);
    return true;
  };

  return (
    <GradientBackground>
      <ScreenHeader title="Hikaye" subtitle={`${title} · ${levelName}`} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepBar}>
          <StepDot label="Hikaye" active icon="book-open" />
          <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
          <StepDot label="Quiz" icon="help-circle" />
          <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
          <StepDot label="Kartlar" icon="layers" />
        </View>

        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: colors.mutedForeground }]}>
            Türkçe çeviri
          </Text>
          <Pressable
            onPress={() => setShowTr((v) => !v)}
            style={[
              styles.toggle,
              {
                backgroundColor: showTr ? colors.primary : colors.secondary,
              },
            ]}
          >
            <View
              style={[
                styles.knob,
                {
                  backgroundColor: '#fff',
                  alignSelf: showTr ? 'flex-end' : 'flex-start',
                },
              ]}
            />
          </Pressable>
        </View>

        {paragraphs.map((p, i) => (
          <GlowCard key={i} style={styles.para}>
            <Text style={[styles.enText, { color: colors.foreground }]}>
              {highlight(p.en, wordTierByKey, claimNewWordBadge)}
            </Text>
            {showTr ? (
              <Text style={[styles.trText, { color: colors.mutedForeground }]}>
                {p.tr}
              </Text>
            ) : null}
          </GlowCard>
        ))}

        <GlowCard style={styles.wordsCard}>
          <Text style={[styles.wordsTitle, { color: colors.foreground }]}>
            Bu hikayedeki kelimeler
          </Text>
          <View style={styles.wordsWrap}>
            {targetWords.map((w) => (
              <View
                key={w.id}
                style={[styles.wordPill, { backgroundColor: colors.secondary }]}
              >
                <Text style={[styles.wordEn, { color: colors.accent }]}>{w.en}</Text>
                <Text style={[styles.wordTr, { color: colors.mutedForeground }]}>
                  {w.tr}
                </Text>
              </View>
            ))}
          </View>
        </GlowCard>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label="Quiz'e Geç"
          icon="arrow-right"
          onPress={() => router.push('/learn/quiz')}
          testID="story-to-quiz"
        />
      </View>
    </GradientBackground>
  );
}

function highlight(
  text: string,
  wordTierByKey: Map<string, { storyCount: number; tier: ReturnType<typeof getWordTier> }>,
  claimNewWordBadge: (word: string) => boolean,
) {
  const parts = text.split(/(\b)/);
  return parts.map((part, i) => {
    const meta = wordTierByKey.get(part.toLowerCase());
    if (meta) {
      return <WordPill key={i} word={part} storyCount={meta.storyCount} tier={meta.tier} claimNewWordBadge={claimNewWordBadge} />;
    }
    return part;
  });
}

function WordPill({
  word,
  storyCount,
  tier,
  claimNewWordBadge,
}: {
  word: string;
  storyCount: number;
  tier: ReturnType<typeof getWordTier>;
  claimNewWordBadge: (word: string) => boolean;
}) {
  const starOpacity = useRef(new Animated.Value(0.65)).current;
  // Decided once per mount (lazy initializer) so a re-render (e.g. TR toggle)
  // never re-queries the seen-set and hides an already-shown badge.
  const [showBadge] = useState(() => isNewWord(storyCount) && claimNewWordBadge(word));

  useEffect(() => {
    if (!showBadge) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(starOpacity, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(starOpacity, { toValue: 0.65, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [showBadge, starOpacity]);

  const tierColors = TIER_COLORS[tier];

  return (
    <Text
      style={[
        styles.pill,
        { backgroundColor: tierColors.background, borderColor: tierColors.borderColor, color: tierColors.color },
      ]}
    >
      {word}
      {showBadge ? (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
          <Animated.Text style={[styles.newBadgeStar, { opacity: starOpacity }]}>★</Animated.Text>
        </View>
      ) : null}
    </Text>
  );
}

function StepDot({
  label,
  icon,
  active,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  active?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.stepDot}>
      <View
        style={[
          styles.stepIcon,
          {
            backgroundColor: active ? colors.primary : colors.secondary,
            borderColor: active ? colors.primaryGlow : colors.border,
          },
        ]}
      >
        <Feather
          name={icon}
          size={14}
          color={active ? colors.primaryForeground : colors.mutedForeground}
        />
      </View>
      <Text
        style={[
          styles.stepLabel,
          { color: active ? colors.foreground : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function EmptySession() {
  const colors = useColors();
  const router = useRouter();
  return (
    <GradientBackground>
      <ScreenHeader title="Ders" />
      <View style={styles.emptyWrap}>
        <Feather name="inbox" size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.foreground }]}>
          Aktif bir ders bulunamadı
        </Text>
        <PrimaryButton
          label="Ana Sayfaya Dön"
          icon="home"
          variant="secondary"
          onPress={() => router.replace('/home')}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  stepDot: {
    alignItems: 'center',
    gap: 4,
  },
  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginBottom: 18,
    marginHorizontal: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  toggleLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  para: {
    gap: 10,
  },
  enText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 17,
    lineHeight: 27,
  },
  trText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  pill: {
    paddingHorizontal: 5,
    borderRadius: 6,
    borderWidth: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    position: 'relative',
  },
  newBadge: {
    position: 'absolute',
    top: -8,
    right: -7,
    height: 10,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fde047',
    borderRadius: 3,
    gap: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 2,
  },
  newBadgeText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#5c3d00',
    lineHeight: 8,
  },
  newBadgeStar: {
    fontSize: 6,
    color: '#1e3a8a',
    lineHeight: 7,
  },
  wordsCard: {
    gap: 12,
  },
  wordsTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  wordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordPill: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  wordEn: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  wordTr: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    textAlign: 'center',
  },
});
