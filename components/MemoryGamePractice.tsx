import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfettiBurst } from '@/components/Confetti';
import { PracticeCompleteScreen } from '@/components/PracticeCompleteScreen';
import { makeWord } from '@/data/mock';

export interface MemoryGamePracticeProps {
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

interface Card {
  key: string;
  pairId: number;
  text: string;
}

export function MemoryGamePractice({ words, onBack, onClose, onComplete }: MemoryGamePracticeProps) {
  const insets = useSafeAreaInsets();
  const cards = useMemo<Card[]>(() => {
    const base: Card[] = [];
    words.forEach((word, i) => {
      const w = makeWord(word);
      base.push({ key: `en-${word}`, pairId: i, text: w.en });
      base.push({ key: `tr-${word}`, pairId: i, text: w.tr });
    });
    return shuffle(base);
  }, [words]);

  const [flippedIdx, setFlippedIdx] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<number>>(new Set());
  const [wrongIdx, setWrongIdx] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [done]);

  const flipCell = (idx: number) => {
    if (locked || flippedIdx.includes(idx) || matchedIds.has(cards[idx].pairId)) return;
    const next = [...flippedIdx, idx];
    setFlippedIdx(next);

    if (next.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [a, b] = next;
      if (cards[a].pairId === cards[b].pairId) {
        setTimeout(() => {
          setMatchedIds((prev) => {
            const s = new Set(prev);
            s.add(cards[a].pairId);
            return s;
          });
          setConfettiKey((k) => k + 1);
          setFlippedIdx([]);
          setLocked(false);
        }, 350);
      } else {
        setWrongIdx(next);
        setTimeout(() => {
          setWrongIdx([]);
          setFlippedIdx([]);
          setLocked(false);
        }, 750);
      }
    }
  };

  useEffect(() => {
    if (matchedIds.size === words.length && words.length > 0) {
      const t = setTimeout(() => setDone(true), 500);
      return () => clearTimeout(t);
    }
  }, [matchedIds, words.length]);

  if (done) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>
        <PracticeCompleteScreen
          title="Tüm Çiftler Bulundu!"
          stats={[
            { n: moves, label: 'Toplam Hamle', color: TOKENS.violet400 },
            { n: `${elapsed}sn`, label: 'Süre', color: TOKENS.violet400 },
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
        <View style={styles.spacer} />
        <View style={styles.statPill}>
          <Text style={styles.statPillText}>🔄 {moves} hamle</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={onClose}>
          <Feather name="x" size={15} color="#A3A0B8" />
        </Pressable>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>Hafıza Oyunu</Text>
        <Text style={styles.subtitle}>Eşleşen İngilizce–Türkçe kart çiftlerini bul</Text>
      </View>

      <ScrollView style={styles.gridScroll} contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {cards.map((card, idx) => (
          <MemoryCell
            key={card.key}
            text={card.text}
            flipped={flippedIdx.includes(idx) || matchedIds.has(card.pairId)}
            matched={matchedIds.has(card.pairId)}
            wrong={wrongIdx.includes(idx)}
            onPress={() => flipCell(idx)}
          />
        ))}
      </ScrollView>

      <ConfettiBurst burstKey={confettiKey} count={10} />
    </View>
  );
}

function MemoryCell({ text, flipped, matched, wrong, onPress }: { text: string; flipped: boolean; matched: boolean; wrong: boolean; onPress: () => void }) {
  const flip = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(flip, { toValue: flipped ? 1 : 0, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
  }, [flipped, flip]);

  useEffect(() => {
    if (!wrong) return;
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 100, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  }, [wrong, shake]);

  const frontStyle = {
    opacity: flip.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [1, 1, 0, 0] }),
    transform: [{ perspective: 1000 }, { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }],
  };
  const backStyle = {
    opacity: flip.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [0, 0, 1, 1] }),
    transform: [{ perspective: 1000 }, { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }) }],
  };
  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-4, 4] });

  return (
    <Pressable style={styles.cell} onPress={onPress}>
      <Animated.View style={{ flex: 1, transform: [{ translateX }] }}>
        <Animated.View style={[styles.cellFace, styles.cellBack, frontStyle]}>
          <MaterialCommunityIcons name="star-four-points-outline" size={22} color={TOKENS.violet400} />
        </Animated.View>
        <Animated.View style={[styles.cellFace, styles.cellFront, backStyle, matched && styles.cellFrontMatched]}>
          <Text style={[styles.cellText, matched && styles.cellTextMatched]} numberOfLines={2}>{text}</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: TOKENS.bg, paddingHorizontal: 20 },

  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', alignItems: 'center', justifyContent: 'center' },
  spacer: { flex: 1 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(139,92,246,0.1)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' },
  statPillText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: TOKENS.violet400 },

  titleBlock: { alignItems: 'center', marginVertical: 16 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 19, color: TOKENS.textHi, marginBottom: 4 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, color: TOKENS.textLow },

  gridScroll: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignContent: 'center', flexGrow: 1, paddingBottom: 12 },
  cell: { width: '22%', aspectRatio: 1 },
  cellFace: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    backfaceVisibility: 'hidden',
  },
  cellBack: { backgroundColor: '#1A1230', borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.35)' },
  cellFront: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
  cellFrontMatched: { backgroundColor: 'rgba(34,197,94,0.16)', borderColor: 'rgba(74,222,128,0.4)' },
  cellText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: TOKENS.textHi, textAlign: 'center' },
  cellTextMatched: { color: TOKENS.green },
});
