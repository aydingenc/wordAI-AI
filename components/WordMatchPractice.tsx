import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfettiBurst } from '@/components/Confetti';
import { PracticeCompleteScreen } from '@/components/PracticeCompleteScreen';
import { makeWord } from '@/data/mock';

export interface WordMatchPracticeProps {
  words: string[];
  onBack: () => void;
  onClose: () => void;
  onComplete: () => void;
}

const TOKENS = {
  bg: '#08070D',
  violet300: '#C4B5FD',
  violet400: '#A78BFA',
  green: '#4ADE80',
  red: '#F87171',
  textHi: '#F5F3FF',
  textMid: '#B9B3D1',
  textLow: '#6F6A8A',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Tile {
  key: string;
  word: string;
  label: string;
  matched: boolean;
  wrong: boolean;
}

export function WordMatchPractice({ words, onBack, onClose, onComplete }: WordMatchPracticeProps) {
  const insets = useSafeAreaInsets();
  const pairs = useMemo(() => words.map((word) => ({ word, tr: makeWord(word).tr })), [words]);

  const [enTiles, setEnTiles] = useState<Tile[]>(() => shuffle(pairs).map((p) => ({ key: `en-${p.word}`, word: p.word, label: p.word, matched: false, wrong: false })));
  const [trTiles, setTrTiles] = useState<Tile[]>(() => shuffle(pairs).map((p) => ({ key: `tr-${p.word}`, word: p.word, label: p.tr, matched: false, wrong: false })));
  const [selectedEn, setSelectedEn] = useState<string | null>(null);
  const [selectedTr, setSelectedTr] = useState<string | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [attempted, setAttempted] = useState<Record<string, boolean>>({});
  const [confettiKey, setConfettiKey] = useState(0);
  const [done, setDone] = useState(false);

  const selectTile = (side: 'en' | 'tr', word: string) => {
    if (side === 'en') {
      if (enTiles.find((t) => t.word === word)?.matched) return;
      setSelectedEn(word);
    } else {
      if (trTiles.find((t) => t.word === word)?.matched) return;
      setSelectedTr(word);
    }
  };

  useEffect(() => {
    if (!selectedEn || !selectedTr) return;
    if (selectedEn === selectedTr) {
      const word = selectedEn;
      setEnTiles((prev) => prev.map((t) => (t.word === word ? { ...t, matched: true } : t)));
      setTrTiles((prev) => prev.map((t) => (t.word === word ? { ...t, matched: true } : t)));
      setMatchedCount((c) => c + 1);
      setFirstTryCorrect((c) => (attempted[word] ? c : c + 1));
      setConfettiKey((k) => k + 1);
      setSelectedEn(null);
      setSelectedTr(null);
    } else {
      setMistakes((m) => m + 1);
      setAttempted((prev) => ({ ...prev, [selectedEn]: true }));
      const enWord = selectedEn;
      const trWord = selectedTr;
      setEnTiles((prev) => prev.map((t) => (t.word === enWord ? { ...t, wrong: true } : t)));
      setTrTiles((prev) => prev.map((t) => (t.word === trWord ? { ...t, wrong: true } : t)));
      const timer = setTimeout(() => {
        setEnTiles((prev) => prev.map((t) => (t.word === enWord ? { ...t, wrong: false } : t)));
        setTrTiles((prev) => prev.map((t) => (t.word === trWord ? { ...t, wrong: false } : t)));
        setSelectedEn(null);
        setSelectedTr(null);
      }, 420);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEn, selectedTr]);

  useEffect(() => {
    if (matchedCount === words.length && words.length > 0) {
      const t = setTimeout(() => setDone(true), 500);
      return () => clearTimeout(t);
    }
  }, [matchedCount, words.length]);

  if (done) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>
        <PracticeCompleteScreen
          title="Tüm Kelimeler Eşleşti!"
          stats={[
            { n: firstTryCorrect, label: 'İlk Denemede', color: TOKENS.green },
            { n: mistakes, label: 'Yanlış Deneme', color: TOKENS.red },
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
          <View style={[styles.progressFill, { width: `${(matchedCount / words.length) * 100}%` }]} />
        </View>
        <Text style={styles.counter}>{matchedCount}/{words.length}</Text>
        <Pressable style={styles.iconBtn} onPress={onClose}>
          <Feather name="x" size={15} color="#A3A0B8" />
        </Pressable>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>Kelime Eşleştir</Text>
        <Text style={styles.subtitle}>İngilizce kelimeyi doğru Türkçe karşılığıyla eşleştir</Text>
      </View>

      <ScrollView style={styles.board} contentContainerStyle={styles.boardContent} showsVerticalScrollIndicator={false}>
        <View style={styles.col}>
          {enTiles.map((t) => (
            <MatchTile key={t.key} tile={t} selected={selectedEn === t.word} isEnglish onPress={() => selectTile('en', t.word)} />
          ))}
        </View>
        <View style={styles.col}>
          {trTiles.map((t) => (
            <MatchTile key={t.key} tile={t} selected={selectedTr === t.word} onPress={() => selectTile('tr', t.word)} />
          ))}
        </View>
      </ScrollView>

      <ConfettiBurst burstKey={confettiKey} count={12} />
    </View>
  );
}

function MatchTile({ tile, selected, isEnglish, onPress }: { tile: Tile; selected: boolean; isEnglish?: boolean; onPress: () => void }) {
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!tile.wrong) return;
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 100, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 100, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 80, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  }, [tile.wrong, shake]);

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-5, 5] });

  let style = styles.tile;
  let textStyle = isEnglish ? styles.tileTextEn : styles.tileText;
  if (tile.matched) {
    style = { ...styles.tile, ...styles.tileMatched };
    textStyle = { ...textStyle, ...styles.tileTextMatched };
  } else if (tile.wrong) {
    style = { ...styles.tile, ...styles.tileWrong };
  } else if (selected) {
    style = { ...styles.tile, ...styles.tileSelected };
  }

  return (
    <Animated.View style={{ transform: [{ translateX }] }}>
      <Pressable disabled={tile.matched} onPress={onPress} style={style}>
        <Text style={textStyle} numberOfLines={2}>{tile.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: TOKENS.bg, paddingHorizontal: 20 },

  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', alignItems: 'center', justifyContent: 'center' },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: TOKENS.violet400 },
  counter: { fontFamily: 'Inter_700Bold', fontSize: 12, color: TOKENS.textMid },

  titleBlock: { alignItems: 'center', marginVertical: 20 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 19, color: TOKENS.textHi, marginBottom: 4 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, color: TOKENS.textLow },

  board: { flex: 1 },
  boardContent: { flexDirection: 'row', gap: 14, paddingBottom: 12 },
  col: { flex: 1, gap: 10 },
  tile: {
    height: 64,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  tileText: { fontFamily: 'Inter_600SemiBold', fontSize: 13.5, color: TOKENS.textHi, textAlign: 'center' },
  tileTextEn: { fontFamily: 'Inter_700Bold', fontSize: 16, color: TOKENS.textHi, textAlign: 'center' },
  tileSelected: { borderColor: TOKENS.violet400, backgroundColor: 'rgba(139,92,246,0.16)' },
  tileMatched: { backgroundColor: 'rgba(34,197,94,0.14)', borderColor: 'rgba(74,222,128,0.4)', opacity: 0.55 },
  tileTextMatched: { color: TOKENS.green },
  tileWrong: { backgroundColor: 'rgba(248,113,113,0.18)', borderColor: TOKENS.red },
});
