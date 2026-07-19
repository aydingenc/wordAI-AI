import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface TargetWord {
  word: string;
  /** How many times this word has appeared as a target word for this user; 0 means brand new. */
  storyCount: number;
}

type WordTier = 'red' | 'green' | 'amber' | 'blue';

/** Single source of truth: tier and "is new" are both derived from storyCount, so they can never contradict each other. */
function getWordTier(storyCount: number): WordTier {
  if (storyCount === 0) return 'red';
  if (storyCount >= 1 && storyCount <= 3) return 'green';
  if (storyCount >= 4 && storyCount <= 8) return 'amber';
  return 'blue';
}

function isNewWord(storyCount: number): boolean {
  return storyCount === 0;
}

export interface StoryPage {
  chapterIndex: 0 | 1 | 2;
  paragraphs: [string, string];
  paragraphsTR: [string, string];
}

export interface StoryChapter {
  title: string;
}

export interface StoryReaderProps {
  storyTitle: string;
  targetWords: TargetWord[];
  chapters: [StoryChapter, StoryChapter, StoryChapter];
  pages: StoryPage[];
  stats: { newWords: number; learning: number; mastered: number };
  onFinish: () => void;
  onBack: () => void;
}

const TOKENS = {
  bg: '#08070D',
  violet300: '#C4B5FD',
  violet400: '#A78BFA',
  violet500: '#8B5CF6',
  violet600: '#7C3AED',
  violet700: '#5B21B6',
  textHi: '#F5F3FF',
  textMid: '#B9B3D1',
  textLow: '#6F6A8A',
};

const PAGES_PER_CHAPTER = 4;

const TIER_COLORS: Record<WordTier, { background: string; borderColor: string; color: string }> = {
  red: { background: 'rgba(248,113,113,0.16)', color: '#f87171', borderColor: 'rgba(248,113,113,0.4)' },
  green: { background: 'rgba(34,197,94,0.16)', color: '#4ade80', borderColor: 'rgba(74,222,128,0.4)' },
  amber: { background: 'rgba(240,180,41,0.16)', color: '#facc15', borderColor: 'rgba(250,204,21,0.4)' },
  blue: { background: 'rgba(56,146,255,0.16)', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.4)' },
};

const CHAPTER_VISUALS: { gradient: readonly [string, string]; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { gradient: ['#7C3AED', '#4C1D95'], icon: 'airplane-takeoff' },
  { gradient: ['#2563EB', '#1E3A8A'], icon: 'weather-partly-cloudy' },
  { gradient: ['#F59E0B', '#B45309'], icon: 'white-balance-sunny' },
];

type TextSegment = { type: 'text'; value: string } | { type: 'word'; value: string; target: TargetWord };

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitWithTargets(text: string, targetWords: TargetWord[]): TextSegment[] {
  if (!targetWords.length) return [{ type: 'text', value: text }];

  const byLength = [...targetWords].sort((a, b) => b.word.length - a.word.length);
  const pattern = byLength.map((w) => escapeRegExp(w.word)).join('|');
  const re = new RegExp(`\\b(${pattern})\\b`, 'gi');

  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text))) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const matched = match[0];
    const target = targetWords.find((w) => w.word.toLowerCase() === matched.toLowerCase());
    if (target) {
      segments.push({ type: 'word', value: matched, target });
    } else {
      segments.push({ type: 'text', value: matched });
    }
    lastIndex = match.index + matched.length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return segments;
}

export function StoryReader({ storyTitle, targetWords, chapters, pages, stats, onFinish, onBack }: StoryReaderProps) {
  const insets = useSafeAreaInsets();
  const [pageIndex, setPageIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);

  const textOpacity = useRef(new Animated.Value(1)).current;
  const textTranslateY = useRef(new Animated.Value(0)).current;

  // Tracks which storyCount===0 words have already had their NEW badge shown,
  // by word text (not by page/paragraph position) — across the whole read session.
  const seenNewWordsRef = useRef<Set<string>>(new Set());
  const claimNewWordBadge = (word: string): boolean => {
    const key = word.toLowerCase();
    if (seenNewWordsRef.current.has(key)) return false;
    seenNewWordsRef.current.add(key);
    return true;
  };

  const page = pages[pageIndex];
  const chapterIndex = page?.chapterIndex ?? 0;
  const pageIndexInChapter = pageIndex % PAGES_PER_CHAPTER;
  const isLastPage = pageIndex === pages.length - 1;

  useEffect(() => {
    setShowTranslation(false);
    textOpacity.setValue(0);
    textTranslateY.setValue(10);
    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(textTranslateY, { toValue: 0, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [pageIndex, textOpacity, textTranslateY]);

  const visual = CHAPTER_VISUALS[chapterIndex];

  const goToPrevPage = () => {
    if (pageIndex === 0) return;
    setPageIndex((p) => p - 1);
  };

  const goToNextPage = () => {
    if (isLastPage) {
      onFinish();
      return;
    }
    setPageIndex((p) => p + 1);
  };

  if (!page) return null;

  return (
    <View style={styles.root}>
      <View style={[styles.page, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topBar}>
          <Pressable onPress={onBack} style={styles.topBarButton}>
            <Feather name="arrow-left" size={19} color={TOKENS.textHi} />
          </Pressable>
          <View style={styles.topBarActions}>
            <Pressable style={styles.topBarButton}>
              <Feather name="volume-2" size={17} color={TOKENS.violet300} />
            </Pressable>
            <Pressable
              style={[styles.topBarButton, showTranslation && styles.topBarButtonActive]}
              onPress={() => setShowTranslation((v) => !v)}
            >
              <MaterialCommunityIcons name="translate" size={18} color={showTranslation ? '#FFFFFF' : TOKENS.violet300} />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <ChapterNav chapterIndex={chapterIndex} />
          <ChapterTitleMarquee title={chapters[chapterIndex].title} />
          <PageDots activeIndex={pageIndexInChapter} />

          <View style={styles.headBlock}>
            <Text style={styles.eyebrow}>✦ Senin Kelimelerin · {targetWords.length} Hedef Kelime</Text>
            <Text style={styles.storyTitle}>{storyTitle}</Text>
            <Text style={styles.pageCounter}>Sayfa {pageIndex + 1} / {pages.length}</Text>
          </View>

          <LinearGradient colors={visual.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pageImage}>
            <MaterialCommunityIcons name={visual.icon} size={44} color="rgba(255,255,255,0.85)" />
          </LinearGradient>

          <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslateY }] }}>
            <ParagraphBlock key={`p${pageIndex}-en-0`} text={page.paragraphs[0]} targetWords={targetWords} claimNewWordBadge={claimNewWordBadge} />
            <ParagraphBlock key={`p${pageIndex}-en-1`} text={page.paragraphs[1]} targetWords={targetWords} claimNewWordBadge={claimNewWordBadge} />
          </Animated.View>

          {showTranslation ? (
            <View style={styles.translationPanel}>
              <View style={styles.translationHeader}>
                <Feather name="globe" size={13} color={TOKENS.violet300} />
                <Text style={styles.translationHeaderText}>Türkçe Çeviri</Text>
              </View>
              <ParagraphBlock key={`p${pageIndex}-tr-0`} text={page.paragraphsTR[0]} targetWords={targetWords} small claimNewWordBadge={claimNewWordBadge} />
              <ParagraphBlock key={`p${pageIndex}-tr-1`} text={page.paragraphsTR[1]} targetWords={targetWords} small claimNewWordBadge={claimNewWordBadge} />
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <StatItem icon="sprout" label="Yeni Kelime" value={stats.newWords} color="#4ade80" />
            <StatItem icon="book-open-variant" label="Öğreniliyor" value={stats.learning} color="#facc15" />
            <StatItem icon="star" label="Mastered" value={stats.mastered} color="#60a5fa" />
          </View>
        </ScrollView>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={goToPrevPage}
          disabled={pageIndex === 0}
          style={[styles.backPageButton, pageIndex === 0 && styles.backPageButtonDisabled]}
        >
          <Feather name="chevron-left" size={20} color={pageIndex === 0 ? TOKENS.textLow : TOKENS.textHi} />
        </Pressable>
        <Pressable style={styles.nextButtonWrap} onPress={goToNextPage}>
          <LinearGradient
            colors={isLastPage ? ['#22C55E', '#15803D'] : [TOKENS.violet400, TOKENS.violet600]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>{isLastPage ? 'Quize Devam Et' : 'Sonraki Sayfa'}</Text>
            <Feather name={isLastPage ? 'check' : 'arrow-right'} size={17} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function ChapterNav({ chapterIndex }: { chapterIndex: number }) {
  return (
    <View style={styles.chapterNavRow}>
      {[0, 1, 2].map((i) => {
        if (i === chapterIndex) {
          return (
            <LinearGradient
              key={i}
              colors={[TOKENS.violet500, TOKENS.violet700]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.chapterDot, styles.chapterDotActive]}
            >
              <Text style={[styles.chapterDotText, styles.chapterDotTextActive]}>{i + 1}</Text>
            </LinearGradient>
          );
        }
        const done = i < chapterIndex;
        return (
          <View key={i} style={[styles.chapterDot, done ? styles.chapterDotDone : styles.chapterDotFuture]}>
            <Text style={[styles.chapterDotText, done ? styles.chapterDotTextDone : styles.chapterDotTextFuture]}>{i + 1}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ChapterTitleMarquee({ title }: { title: string }) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTextWidth(0);
  }, [title]);

  useEffect(() => {
    if (!containerWidth || !textWidth) return;
    const overflow = textWidth - containerWidth;

    if (overflow <= 0) {
      translateX.setValue(0);
      return;
    }

    translateX.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(translateX, { toValue: -overflow, duration: 3400, easing: Easing.linear, useNativeDriver: true }),
        Animated.delay(800),
        Animated.timing(translateX, { toValue: 0, duration: 1000, easing: Easing.linear, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [containerWidth, textWidth, translateX]);

  const fits = textWidth > 0 && containerWidth > 0 && textWidth <= containerWidth;
  const centeredOffset = fits ? (containerWidth - textWidth) / 2 : 0;

  const onContainerLayout = (e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width);
  const onTextLayout = (e: LayoutChangeEvent) => setTextWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.marqueeContainer} onLayout={onContainerLayout}>
      <Animated.View
        style={[
          styles.marqueeInner,
          { transform: [{ translateX: fits ? centeredOffset : translateX }] },
        ]}
      >
        <Text style={styles.chapterTitleText} onLayout={onTextLayout} numberOfLines={1}>
          {title}
        </Text>
      </Animated.View>
      <LinearGradient colors={[TOKENS.bg, 'rgba(8,7,13,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.marqueeFadeLeft} pointerEvents="none" />
      <LinearGradient colors={['rgba(8,7,13,0)', TOKENS.bg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.marqueeFadeRight} pointerEvents="none" />
    </View>
  );
}

function PageDots({ activeIndex }: { activeIndex: number }) {
  return (
    <View style={styles.pageDotsRow}>
      {Array.from({ length: PAGES_PER_CHAPTER }, (_, i) => (
        <View key={i} style={[styles.pageDot, i === activeIndex && styles.pageDotActive]} />
      ))}
    </View>
  );
}

function ParagraphBlock({
  text,
  targetWords,
  small,
  claimNewWordBadge,
}: {
  text: string;
  targetWords: TargetWord[];
  small?: boolean;
  claimNewWordBadge: (word: string) => boolean;
}) {
  const segments = useMemo(() => splitWithTargets(text, targetWords), [text, targetWords]);
  return (
    <Text style={small ? styles.trParagraphText : styles.paragraphText}>
      <View style={small ? styles.indentSpacerSmall : styles.indentSpacer} />
      {segments.map((seg, i) =>
        seg.type === 'word' ? (
          <WordHighlight key={i} target={seg.target} small={small} claimNewWordBadge={claimNewWordBadge} />
        ) : (
          <Text key={i}>{seg.value}</Text>
        ),
      )}
    </Text>
  );
}

function WordHighlight({
  target,
  small,
  claimNewWordBadge,
}: {
  target: TargetWord;
  small?: boolean;
  claimNewWordBadge: (word: string) => boolean;
}) {
  const starOpacity = useRef(new Animated.Value(0.65)).current;
  const tier = getWordTier(target.storyCount);

  // Decided once per mount (lazy initializer), not recomputed on every re-render —
  // otherwise a re-render of an already-shown badge would re-query the seen-set and hide it.
  // isNewWord(storyCount) and tier==='red' are equivalent (both derive from the same storyCount),
  // so claimNewWordBadge is only ever invoked — and the badge only ever rendered — for the red tier.
  const [showBadge] = useState(() => isNewWord(target.storyCount) && claimNewWordBadge(target.word));

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
        small ? styles.pillSmall : styles.pill,
        { backgroundColor: tierColors.background, borderColor: tierColors.borderColor, color: tierColors.color },
      ]}
    >
      {target.word}
      {showBadge ? (
        <View style={[styles.newBadge, small && styles.newBadgeSmall]}>
          <Text style={styles.newBadgeText}>NEW</Text>
          <Animated.Text style={[styles.newBadgeStar, { opacity: starOpacity }]}>★</Animated.Text>
        </View>
      ) : null}
    </Text>
  );
}

function StatItem({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.statItem}>
      <MaterialCommunityIcons name={icon} size={16} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: TOKENS.bg },
  page: { flex: 1, paddingHorizontal: 20 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  topBarActions: { flexDirection: 'row', gap: 8 },
  topBarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  topBarButtonActive: { backgroundColor: TOKENS.violet600, borderColor: 'transparent' },

  scrollContent: { paddingBottom: 24, gap: 14 },

  chapterNavRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 4 },
  chapterDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  chapterDotActive: {
    shadowColor: TOKENS.violet600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  chapterDotDone: { backgroundColor: 'rgba(139,92,246,0.22)' },
  chapterDotFuture: { backgroundColor: 'rgba(255,255,255,0.06)' },
  chapterDotText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  chapterDotTextActive: { color: '#FFFFFF' },
  chapterDotTextDone: { color: '#FFFFFF' },
  chapterDotTextFuture: { color: TOKENS.textMid },

  marqueeContainer: { height: 22, width: '100%', overflow: 'hidden', position: 'relative' },
  marqueeInner: { position: 'absolute', left: 0, top: 0, flexDirection: 'row' },
  chapterTitleText: { color: TOKENS.textMid, fontFamily: 'Inter_600SemiBold', fontSize: 12.5, letterSpacing: 0.2 },
  marqueeFadeLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 24 },
  marqueeFadeRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 24 },

  pageDotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  pageDot: { width: 16, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
  pageDotActive: { backgroundColor: TOKENS.violet400 },

  headBlock: { alignItems: 'center', gap: 4 },
  eyebrow: { color: TOKENS.violet300, fontFamily: 'Inter_600SemiBold', fontSize: 11.5 },
  storyTitle: { color: TOKENS.textHi, fontFamily: 'Inter_700Bold', fontSize: 22, textAlign: 'center' },
  pageCounter: { color: TOKENS.textLow, fontFamily: 'Inter_500Medium', fontSize: 11.5 },

  pageImage: { width: '100%', height: 170, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  paragraphText: { color: TOKENS.textHi, fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 26.25, marginBottom: 19 },
  trParagraphText: { color: TOKENS.textMid, fontFamily: 'Inter_400Regular', fontSize: 13.5, lineHeight: 23.6, marginBottom: 14 },
  indentSpacer: { width: 20, height: 1 },
  indentSpacerSmall: { width: 16, height: 1 },

  translationPanel: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.18)',
  },
  translationHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  translationHeaderText: { color: TOKENS.violet300, fontFamily: 'Inter_600SemiBold', fontSize: 11.5 },

  pill: { paddingHorizontal: 5, borderRadius: 6, borderWidth: 1, fontFamily: 'Inter_700Bold', fontSize: 14, position: 'relative' },
  pillSmall: { paddingHorizontal: 4, borderRadius: 5, borderWidth: 1, fontFamily: 'Inter_700Bold', fontSize: 12.5, position: 'relative' },

  newBadge: {
    position: 'absolute',
    top: -7,
    right: -6,
    height: 9,
    paddingHorizontal: 1,
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
  newBadgeSmall: { top: -6, right: -5, height: 8 },
  newBadgeText: { fontSize: 6, fontWeight: '800', color: '#5c3d00', lineHeight: 7 },
  newBadgeStar: { fontSize: 5, color: '#1e3a8a', lineHeight: 6 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 10,
    marginHorizontal: 3,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  statLabel: { color: TOKENS.textLow, fontFamily: 'Inter_500Medium', fontSize: 10 },

  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: 'rgba(8,7,13,0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  backPageButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  backPageButtonDisabled: { opacity: 0.4 },
  nextButtonWrap: { flex: 1 },
  nextButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.4)',
  },
  nextButtonText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 15 },
});
