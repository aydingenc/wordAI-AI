import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfettiBurst } from '@/components/Confetti';
import { PracticeCompleteScreen } from '@/components/PracticeCompleteScreen';
import { makeWord } from '@/data/mock';

export interface SpeedRoundPracticeProps {
  words: string[];
  onClose: () => void;
  onComplete: () => void;
}

const TOKENS = {
  bg: '#08070D',
  violet400: '#A78BFA',
  violet600: '#7C3AED',
  green: '#4ADE80',
  red: '#F87171',
  amber: '#FACC15',
  textHi: '#F5F3FF',
  textMid: '#B9B3D1',
  textLow: '#6F6A8A',
};

const TR_DISTRACTORS = ['zaman', 'renk', 'kapı', 'deniz', 'ağaç', 'yıldız', 'gölge', 'anahtar', 'korku', 'yorgunluk'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ROUND_SECONDS = 3;
const RADIUS = 24;
const CIRC = 2 * Math.PI * RADIUS;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function SpeedRoundPractice({ words, onClose, onComplete }: SpeedRoundPracticeProps) {
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<'intro' | 'game' | 'complete'>('intro');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);

  const timerFill = useRef(new Animated.Value(0)).current;
  const timerColor = useRef(new Animated.Value(0)).current;
  const answeredRef = useRef(false);

  const word = words[index];
  const w = word ? makeWord(word) : null;

  useEffect(() => {
    if (stage !== 'game' || !word) return;
    answeredRef.current = false;
    setAnswered(false);
    setChosen(null);
    setTimeLeft(ROUND_SECONDS);

    const distractors = shuffle(TR_DISTRACTORS.filter((d) => d !== w?.tr)).slice(0, 2);
    setOptions(shuffle([w!.tr, ...distractors]));

    timerFill.setValue(0);
    timerColor.setValue(0);
    Animated.timing(timerFill, { toValue: 1, duration: ROUND_SECONDS * 1000, easing: Easing.linear, useNativeDriver: false }).start();

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        if (next <= 1) {
          Animated.timing(timerColor, { toValue: 1, duration: 300, useNativeDriver: false }).start();
        }
        if (next <= 0) {
          clearInterval(interval);
          if (!answeredRef.current) {
            answeredRef.current = true;
            setAnswered(true);
            setTimeout(goNext, 700);
          }
        }
        return Math.max(next, 0);
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, index]);

  const goNext = () => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= words.length) {
        setStage('complete');
        return i;
      }
      return next;
    });
  };

  const answer = (opt: string) => {
    if (answeredRef.current || !w) return;
    answeredRef.current = true;
    setAnswered(true);
    setChosen(opt);
    if (opt === w.tr) {
      setScore((s) => s + 1);
      setConfettiKey((k) => k + 1);
    }
    setTimeout(goNext, 600);
  };

  const strokeDashoffset = timerFill.interpolate({ inputRange: [0, 1], outputRange: [0, CIRC] });
  const strokeColor = timerColor.interpolate({ inputRange: [0, 1], outputRange: [TOKENS.amber, TOKENS.red] });

  if (stage === 'complete') {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>
        <PracticeCompleteScreen
          title="Tur Bitti!"
          stats={[{ n: `${score}/${words.length}`, label: 'doğru cevap', color: TOKENS.amber }]}
          onCta={onComplete}
          badgeGradient={['#FDE047', '#F59E0B']}
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>
      <Pressable style={styles.closeBtnAbs} onPress={onClose}>
        <Feather name="x" size={15} color="#A3A0B8" />
      </Pressable>

      {stage === 'intro' ? (
        <View style={styles.intro}>
          <LinearGradient colors={['#FACC15', '#F59E0B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.introBadge}>
            <Feather name="zap" size={30} color="#1C1200" />
          </LinearGradient>
          <Text style={styles.introTitle}>Hızlı Tekrar</Text>
          <Text style={styles.introSub}>{words.length} kelime, her biri için 3 saniye. Süre bitmeden doğru anlamı seç!</Text>
          <Text style={styles.introMeta}>{words.length} kelime · ~{words.length * 3} saniye</Text>
          <Pressable onPress={() => setStage('game')}>
            <LinearGradient colors={['#FDE047', '#F59E0B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.introBtn}>
              <Text style={styles.introBtnText}>Başla</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <View style={styles.game}>
          <View style={styles.topbar}>
            <View style={styles.timerWrap}>
              <Svg width={56} height={56} viewBox="0 0 56 56" style={styles.timerSvg}>
                <Circle cx={28} cy={28} r={RADIUS} stroke="rgba(255,255,255,0.1)" strokeWidth={5} fill="none" />
                <AnimatedCircle
                  cx={28}
                  cy={28}
                  r={RADIUS}
                  stroke={strokeColor as unknown as string}
                  strokeWidth={5}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={strokeDashoffset}
                />
              </Svg>
              <Text style={styles.timerNum}>{timeLeft}</Text>
            </View>
            <View style={styles.scorePill}>
              <Text style={styles.scorePillText}>⚡ {score}/{words.length}</Text>
            </View>
          </View>

          <View style={styles.qStage}>
            <Text style={styles.qWord}>{w?.en}</Text>
            <View style={styles.qChoices}>
              {options.map((opt) => {
                let style = styles.qChoice;
                if (answered) {
                  if (opt === w?.tr) style = { ...styles.qChoice, ...styles.qChoiceCorrect };
                  else if (opt === chosen) style = { ...styles.qChoice, ...styles.qChoiceWrong };
                }
                return (
                  <Pressable key={opt} disabled={answered} onPress={() => answer(opt)} style={style}>
                    <Text style={styles.qChoiceText}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}

      <ConfettiBurst burstKey={confettiKey} count={10} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: TOKENS.bg, paddingHorizontal: 20 },
  closeBtnAbs: { position: 'absolute', top: 26, right: 24, zIndex: 100, width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },

  intro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  introBadge: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  introTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, color: TOKENS.textHi, marginBottom: 8 },
  introSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: TOKENS.textMid, textAlign: 'center', maxWidth: 270, lineHeight: 19, marginBottom: 20 },
  introMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, color: TOKENS.textLow, marginBottom: 24 },
  introBtn: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16 },
  introBtnText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#1C1200' },

  game: { flex: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 34, marginBottom: 20 },
  timerWrap: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  timerSvg: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
  timerNum: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#FFFFFF' },
  scorePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  scorePillText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: TOKENS.green },

  qStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  qWord: { fontFamily: 'Inter_700Bold', fontSize: 36, color: TOKENS.textHi, marginBottom: 28, textAlign: 'center' },
  qChoices: { gap: 10, width: '100%' },
  qChoice: { padding: 15, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.09)', alignItems: 'center' },
  qChoiceText: { fontFamily: 'Inter_600SemiBold', fontSize: 14.5, color: TOKENS.textHi },
  qChoiceCorrect: { backgroundColor: 'rgba(34,197,94,0.18)', borderColor: TOKENS.green },
  qChoiceWrong: { backgroundColor: 'rgba(248,113,113,0.18)', borderColor: TOKENS.red },
});
