import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PracticeCompleteScreen } from '@/components/PracticeCompleteScreen';
import { makeWord } from '@/data/mock';

export interface FlashcardsPracticeProps {
  words: string[];
  onBack: () => void;
  onClose: () => void;
  onComplete: () => void;
}

const TOKENS = {
  bg: '#08070D',
  violet300: '#C4B5FD',
  violet400: '#A78BFA',
  violet600: '#7C3AED',
  green: '#4ADE80',
  red: '#F87171',
  textHi: '#F5F3FF',
  textMid: '#B9B3D1',
  textLow: '#6F6A8A',
};

const LEVELS = ['Basit (A1/A2)', 'Orta (B1/B2)'];

function highlight(sentence: string, word: string) {
  const re = new RegExp(`\\b${word}\\b`, 'i');
  const match = sentence.match(re);
  if (!match) return { before: sentence, hit: '', after: '' };
  const idx = match.index ?? 0;
  return { before: sentence.slice(0, idx), hit: match[0], after: sentence.slice(idx + match[0].length) };
}

export function FlashcardsPractice({ words, onBack, onClose, onComplete }: FlashcardsPracticeProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<(boolean | null)[]>(words.map(() => null));
  const [showInfoFront, setShowInfoFront] = useState(false);
  const [showInfoBack, setShowInfoBack] = useState(false);
  const [done, setDone] = useState(false);

  const flip = useRef(new Animated.Value(0)).current;
  const cardX = useRef(new Animated.Value(0)).current;
  const cardRotate = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const word = words[index];
  const w = makeWord(word);
  const level = LEVELS[index % LEVELS.length];
  const sentEn = highlight(w.example, w.en);
  const sentTr = highlight(w.exampleTr, w.tr.split(' ')[0]);

  const frontStyle = {
    opacity: flip.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [1, 1, 0, 0] }),
    transform: [
      { perspective: 1400 },
      { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) },
    ],
  };
  const backStyle = {
    opacity: flip.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [0, 0, 1, 1] }),
    transform: [
      { perspective: 1400 },
      { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }) },
    ],
  };

  const doFlip = () => {
    Animated.timing(flip, { toValue: flipped ? 0 : 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
    setFlipped((v) => !v);
    setShowInfoFront(false);
    setShowInfoBack(false);
  };

  const goToDNA = () => {
    router.push({
      pathname: '/explore/word-dna',
      params: { word, returnTo: 'flashcards-practice', returnWords: words.join(',') },
    });
  };

  const judge = (known: boolean) => {
    setResults((prev) => {
      const next = [...prev];
      next[index] = known;
      return next;
    });

    Animated.parallel([
      Animated.timing(cardX, { toValue: known ? 420 : -420, duration: 380, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(cardRotate, { toValue: known ? 14 : -14, duration: 380, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start(() => {
      if (index + 1 >= words.length) {
        setDone(true);
        return;
      }
      cardX.setValue(0);
      cardRotate.setValue(0);
      cardOpacity.setValue(1);
      flip.setValue(0);
      setFlipped(false);
      setShowInfoFront(false);
      setShowInfoBack(false);
      setIndex((i) => i + 1);
    });
  };

  if (done) {
    const knownCount = results.filter((r) => r === true).length;
    const hardCount = results.filter((r) => r === false).length;
    return (
      <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>
        <PracticeCompleteScreen
          title={`${words.length} Kart Tamamlandı!`}
          stats={[
            { n: knownCount, label: 'Biliyorum', color: TOKENS.green },
            { n: hardCount, label: 'Zorlandım', color: TOKENS.red },
          ]}
          onCta={onComplete}
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.topbar}>
        <Pressable style={styles.iconBtn} onPress={onBack}>
          <Feather name="chevron-left" size={16} color={TOKENS.violet300} />
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(index / words.length) * 100}%` }]} />
        </View>
        <Text style={styles.counter}>{index + 1}/{words.length}</Text>
        <Pressable style={styles.iconBtn} onPress={onClose}>
          <Feather name="x" size={15} color="#A3A0B8" />
        </Pressable>
      </View>

      <View style={styles.stage}>
        <View style={styles.glow} pointerEvents="none" />
        <Pressable onPress={doFlip}>
          <Animated.View style={[styles.card, { transform: [{ translateX: cardX }, { rotate: cardRotate.interpolate({ inputRange: [-14, 14], outputRange: ['-14deg', '14deg'] }) }], opacity: cardOpacity }]}>
            <Animated.View style={[styles.cardFace, styles.cardFront, frontStyle]}>
              <Text style={[styles.cardTag, { color: TOKENS.violet400 }]}>İNGİLİZCE</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaChipTheme}><Text style={styles.metaChipThemeText}>✈ Travel</Text></View>
                <View style={styles.metaChipLevel}><Text style={styles.metaChipLevelText}>{level}</Text></View>
              </View>
              <Text style={styles.cardWord}>{w.en}</Text>
              <Text style={styles.cardExample}>
                {sentEn.before}
                <Text style={styles.cardExampleHl}>{sentEn.hit}</Text>
                {sentEn.after}
              </Text>
              <Text style={styles.wordTypeLine}>noun</Text>
              <DnaRow onDna={goToDNA} showInfo={showInfoFront} onToggleInfo={() => setShowInfoFront((v) => !v)} />
              {showInfoFront ? (
                <View style={styles.infoPanel}>
                  <Text style={styles.infoPanelText}>Bu kelime hakkında daha fazla bilgiye ve örneğe ihtiyacım var.</Text>
                </View>
              ) : null}
              <View style={styles.cardHint}>
                <Feather name="arrow-right" size={13} color={TOKENS.textLow} />
                <Text style={styles.cardHintText}>Anlamı görmek için dokun</Text>
              </View>
            </Animated.View>

            <Animated.View style={[styles.cardFace, styles.cardBack, backStyle]}>
              <Text style={[styles.cardTag, { color: TOKENS.green }]}>TÜRKÇE</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaChipTheme}><Text style={styles.metaChipThemeText}>✈ Travel</Text></View>
                <View style={styles.metaChipLevel}><Text style={styles.metaChipLevelText}>{level}</Text></View>
              </View>
              <Text style={styles.cardMeaning}>{w.tr}</Text>
              <Text style={styles.cardExampleTr}>
                {sentTr.before}
                <Text style={styles.cardExampleTrHl}>{sentTr.hit || w.tr}</Text>
                {sentTr.after}
              </Text>
              <Text style={styles.wordTypeLine}>isim</Text>
              <DnaRow onDna={goToDNA} showInfo={showInfoBack} onToggleInfo={() => setShowInfoBack((v) => !v)} />
              {showInfoBack ? (
                <View style={styles.infoPanel}>
                  <Text style={styles.infoPanelText}>Bu kelime hakkında daha fazla bilgiye ve örneğe ihtiyacım var.</Text>
                </View>
              ) : null}
            </Animated.View>
          </Animated.View>
        </Pressable>
      </View>

      <View style={styles.dots}>
        {words.map((_, i) => {
          const result = results[i];
          const style = i === index ? styles.dotCurrent : result === true ? styles.dotKnown : result === false ? styles.dotHard : styles.dot;
          return <View key={i} style={[styles.dot, style]} />;
        })}
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.hardBtn} onPress={() => judge(false)}>
          <Feather name="x" size={16} color={TOKENS.red} />
          <Text style={[styles.actionText, { color: TOKENS.red }]}>Zorlandım</Text>
        </Pressable>
        <Pressable style={styles.knownBtn} onPress={() => judge(true)}>
          <Feather name="check" size={16} color={TOKENS.green} />
          <Text style={[styles.actionText, { color: TOKENS.green }]}>Biliyorum</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DnaRow({ onDna, showInfo, onToggleInfo }: { onDna: () => void; showInfo: boolean; onToggleInfo: () => void }) {
  return (
    <View style={styles.dnaRow}>
      <Pressable style={styles.dnaBtn} onPress={onDna}>
        <MaterialCommunityIcons name="dna" size={17} color={TOKENS.violet300} />
        <Text style={styles.dnaText}>SentenceLab + WordDNA</Text>
        <Feather name="chevron-right" size={14} color={TOKENS.violet300} />
      </Pressable>
      <Pressable style={styles.infoIconBtn} onPress={onToggleInfo}>
        <Feather name="info" size={15} color={TOKENS.violet300} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: TOKENS.bg, paddingHorizontal: 20 },

  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', alignItems: 'center', justifyContent: 'center' },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: TOKENS.violet400 },
  counter: { fontFamily: 'Inter_700Bold', fontSize: 12, color: TOKENS.textMid },

  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(139,92,246,0.28)', opacity: 0.6 },

  card: { width: 280, height: 440 },
  cardFace: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 26,
    padding: 26,
    paddingTop: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  cardFront: { backgroundColor: '#1A1230', borderColor: 'rgba(139,92,246,0.3)' },
  cardBack: { backgroundColor: '#0E1411', borderColor: 'rgba(74,222,128,0.3)' },
  cardTag: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.4, marginBottom: 16 },
  metaRow: { flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' },
  metaChipTheme: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(96,165,250,0.14)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)' },
  metaChipThemeText: { fontFamily: 'Inter_700Bold', fontSize: 9.5, color: '#60A5FA' },
  metaChipLevel: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(139,92,246,0.14)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  metaChipLevelText: { fontFamily: 'Inter_700Bold', fontSize: 9.5, color: TOKENS.violet400 },
  cardWord: { fontFamily: 'Inter_700Bold', fontSize: 32, color: TOKENS.textHi, marginBottom: 14, textAlign: 'center' },
  cardExample: { fontFamily: 'Inter_400Regular', fontSize: 12.5, color: TOKENS.textMid, lineHeight: 19, textAlign: 'center', marginBottom: 14, paddingHorizontal: 4 },
  cardExampleHl: { color: TOKENS.violet300, fontFamily: 'Inter_700Bold' },
  cardMeaning: { fontFamily: 'Inter_700Bold', fontSize: 26, color: TOKENS.green, marginBottom: 14, textAlign: 'center' },
  cardExampleTr: { fontFamily: 'Inter_400Regular', fontSize: 12.5, color: TOKENS.textMid, lineHeight: 19, textAlign: 'center', marginBottom: 14, paddingHorizontal: 4 },
  cardExampleTrHl: { color: '#86EFAC', fontFamily: 'Inter_700Bold' },
  wordTypeLine: { fontFamily: 'Inter_400Regular', fontSize: 10.5, color: TOKENS.textLow, fontStyle: 'italic', marginBottom: 16 },

  dnaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  dnaBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.5)' },
  dnaText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 11.5, color: '#E9E0FF' },
  infoIconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(139,92,246,0.1)', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.45)', alignItems: 'center', justifyContent: 'center' },
  infoPanel: { width: '100%', marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(167,139,250,0.4)' },
  infoPanelText: { fontFamily: 'Inter_400Regular', fontSize: 10.5, color: TOKENS.violet300, lineHeight: 15 },
  cardHint: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 16 },
  cardHintText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: TOKENS.textLow },

  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginVertical: 16 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotCurrent: { backgroundColor: TOKENS.violet400, width: 20, borderRadius: 4 },
  dotKnown: { backgroundColor: TOKENS.green },
  dotHard: { backgroundColor: TOKENS.red },

  actionRow: { flexDirection: 'row', gap: 12 },
  hardBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 15, borderRadius: 16, backgroundColor: 'rgba(248,113,113,0.14)', borderWidth: 1.5, borderColor: 'rgba(248,113,113,0.35)' },
  knownBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 15, borderRadius: 16, backgroundColor: 'rgba(34,197,94,0.14)', borderWidth: 1.5, borderColor: 'rgba(74,222,128,0.35)' },
  actionText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
});
