import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfettiBurst } from '@/components/Confetti';
import { PracticeCompleteScreen } from '@/components/PracticeCompleteScreen';
import { makeWord } from '@/data/mock';

export interface FillBlankPracticeProps {
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

const FILL_BLANK_BANK: Record<string, { sentence: string; distractors: string[] }> = {
  adventure: { sentence: 'Every step felt like the start of a new ___.', distractors: ['fear', 'tiredness'] },
  journey: { sentence: 'It was going to be a long ___.', distractors: ['hotel', 'ticket'] },
  luggage: { sentence: 'Carrying her ___ became harder every hour.', distractors: ['document', 'map'] },
  passport: { sentence: 'She had to show her ___ at the counter.', distractors: ['key', 'card'] },
  gate: { sentence: 'He checked the ___ number one more time.', distractors: ['lounge', 'carousel'] },
  love: { sentence: 'She said she would always ___ learning new things.', distractors: ['forget', 'avoid'] },
  travel: { sentence: 'They wanted to ___ to a new country every year.', distractors: ['stay', 'wait'] },
  airport: { sentence: 'The ___ was crowded this morning.', distractors: ['museum', 'library'] },
  coffee: { sentence: 'She drinks ___ without sugar.', distractors: ['water', 'juice'] },
  mountain: { sentence: 'They climbed the tall ___.', distractors: ['building', 'hill'] },
  sunset: { sentence: 'We watched the ___ by the sea.', distractors: ['sunrise', 'storm'] },
  dream: { sentence: 'He follows his biggest ___.', distractors: ['fear', 'job'] },
  ocean: { sentence: 'The ___ looked calm and blue.', distractors: ['desert', 'valley'] },
  city: { sentence: 'The ___ never sleeps at night.', distractors: ['village', 'farm'] },
};

const FALLBACK_DISTRACTORS = ['ticket', 'flight', 'hotel', 'map', 'key', 'forest', 'music', 'friend'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Item {
  word: string;
  before: string;
  after: string;
  options: string[];
}

function buildItem(word: string): Item {
  const key = word.toLowerCase();
  const entry = FILL_BLANK_BANK[key];
  let sentence: string;
  let distractors: string[];
  if (entry) {
    sentence = entry.sentence;
    distractors = entry.distractors;
  } else {
    const w = makeWord(key);
    const re = new RegExp(`\\b${key}\\b`, 'i');
    sentence = re.test(w.example) ? w.example.replace(re, '___') : `We couldn't stop thinking about ___.`;
    distractors = shuffle(FALLBACK_DISTRACTORS.filter((d) => d !== key)).slice(0, 2);
  }
  const [before, after] = sentence.split('___');
  return { word: key, before, after, options: shuffle([key, ...distractors]) };
}

export function FillBlankPractice({ words, onBack, onClose, onComplete }: FillBlankPracticeProps) {
  const insets = useSafeAreaInsets();
  const items = useMemo(() => words.map(buildItem), [words]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [confettiKey, setConfettiKey] = useState(0);
  const [done, setDone] = useState(false);

  const item = items[index];
  const answered = picked !== null;
  const isCorrect = picked === item?.word;

  const pick = (word: string) => {
    if (answered) return;
    setPicked(word);
    if (word === item.word) {
      setScore((s) => s + 1);
      setConfettiKey((k) => k + 1);
    }
  };

  const next = () => {
    if (index + 1 >= items.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  if (done) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>
        <PracticeCompleteScreen
          title="Tüm Cümleler Tamamlandı!"
          stats={[{ n: `${score}/${items.length}`, label: 'doğru cevap', color: TOKENS.green }]}
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
          <View style={[styles.progressFill, { width: `${(index / items.length) * 100}%` }]} />
        </View>
        <Text style={styles.counter}>{index + 1}/{items.length}</Text>
        <Pressable style={styles.iconBtn} onPress={onClose}>
          <Feather name="x" size={15} color="#A3A0B8" />
        </Pressable>
      </View>

      <Text style={styles.kicker}>CÜMLEYİ TAMAMLA</Text>

      <View style={styles.sentenceCard}>
        <Text style={styles.sentenceText}>
          {item.before}
          <Text
            style={[
              styles.blank,
              answered && (isCorrect ? styles.blankCorrect : styles.blankWrong),
            ]}
          >
            {picked ?? '?'}
          </Text>
          {item.after}
        </Text>
      </View>

      <View style={styles.wordBank}>
        {item.options.map((opt) => (
          <Pressable
            key={opt}
            disabled={answered}
            onPress={() => pick(opt)}
            style={[styles.bankTile, answered && opt !== picked && styles.bankTileUsed]}
          >
            <Text style={styles.bankTileText}>{opt}</Text>
          </Pressable>
        ))}
      </View>

      {answered ? (
        <View style={[styles.feedbackBanner, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={[styles.feedbackText, { color: isCorrect ? TOKENS.green : TOKENS.red }]}>
            {isCorrect ? '✓ Doğru!' : `✗ Doğrusu: "${item.word}"`}
          </Text>
        </View>
      ) : null}

      {answered ? (
        <Pressable style={styles.nextBtnWrap} onPress={next}>
          <LinearGradient colors={[TOKENS.violet400, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>{index + 1 >= items.length ? 'Bitir →' : 'Sonraki Cümle →'}</Text>
          </LinearGradient>
        </Pressable>
      ) : null}

      <ConfettiBurst burstKey={confettiKey} count={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: TOKENS.bg, paddingHorizontal: 20 },

  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  iconBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', alignItems: 'center', justifyContent: 'center' },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: TOKENS.violet400 },
  counter: { fontFamily: 'Inter_700Bold', fontSize: 12, color: TOKENS.textMid },

  kicker: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.4, color: TOKENS.violet400, textAlign: 'center', marginBottom: 14 },

  sentenceCard: { borderRadius: 22, padding: 26, marginBottom: 26, backgroundColor: 'rgba(139,92,246,0.06)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.22)' },
  sentenceText: { fontFamily: 'Inter_600SemiBold', fontSize: 17, lineHeight: 27, color: TOKENS.textHi, textAlign: 'center' },
  blank: { color: TOKENS.violet300, fontFamily: 'Inter_700Bold', textDecorationLine: 'underline' },
  blankCorrect: { color: TOKENS.green },
  blankWrong: { color: TOKENS.red },

  wordBank: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 'auto' },
  bankTile: { paddingHorizontal: 18, paddingVertical: 13, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  bankTileUsed: { opacity: 0.25 },
  bankTileText: { fontFamily: 'Inter_700Bold', fontSize: 14.5, color: TOKENS.textHi },

  feedbackBanner: { marginTop: 20, padding: 12, borderRadius: 12, alignItems: 'center' },
  feedbackCorrect: { backgroundColor: 'rgba(34,197,94,0.14)' },
  feedbackWrong: { backgroundColor: 'rgba(248,113,113,0.14)' },
  feedbackText: { fontFamily: 'Inter_700Bold', fontSize: 13 },

  nextBtnWrap: { marginTop: 16 },
  nextBtn: { padding: 15, borderRadius: 14, alignItems: 'center' },
  nextBtnText: { fontFamily: 'Inter_700Bold', fontSize: 14.5, color: '#FFFFFF' },
});
