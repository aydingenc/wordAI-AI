import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfettiBurst } from '@/components/Confetti';
import { useProgress } from '@/context/ProgressContext';
import { buildComprehensionQuestions, makeWord, mockStoryCountForIndex } from '@/data/mock';
import { EmptySession } from './story';

const TOKENS = {
  bg: '#08070D',
  violet300: '#C4B5FD',
  violet400: '#A78BFA',
  violet500: '#8B5CF6',
  violet600: '#7C3AED',
  green: '#4ADE80',
  red: '#F87171',
  amber: '#FACC15',
  textHi: '#F5F3FF',
  textMid: '#B9B3D1',
  textLow: '#6F6A8A',
};

interface TargetWordLite {
  word: string;
  storyCount: number;
}

interface WordQuestion {
  kind: 'word';
  kicker: string;
  text: string;
  choices: string[];
  correctIndex: number;
  hint: string;
  word: string;
}

interface ComprehensionQuestion {
  kind: 'comprehension';
  kicker: string;
  text: string;
  choices: string[];
  correctIndex: number;
  hint: string;
}

type Question = WordQuestion | ComprehensionQuestion;

interface WordBankEntry {
  sentence: string;
  choices: string[];
  correctIndex: number;
  hint: string;
}

/** Hand-crafted sentence + hint for the words that recur across the preset theme/gallery seeds. */
const WORD_QUIZ_BANK: Record<string, WordBankEntry> = {
  adventure: { sentence: 'Every step felt like the start of a new ___.', choices: ['adventure', 'fear', 'tiredness', 'boredom'], correctIndex: 0, hint: 'Bu kelime, yeni ve bilinmeyen bir şeye atılan, heyecanlı ve biraz riskli bir deneyimi anlatır.' },
  journey: { sentence: 'It was going to be a long ___.', choices: ['hotel', 'journey', 'ticket', 'airport'], correctIndex: 1, hint: 'Bu kelime, bir yerden başka bir yere yapılan, genellikle uzun süren bir seyahati anlatır.' },
  luggage: { sentence: 'Carrying her ___ became harder every hour.', choices: ['luggage', 'document', 'food', 'map'], correctIndex: 0, hint: 'Bu kelime, seyahat ederken yanında taşıdığın valiz/bavul gibi eşyaları anlatır.' },
  passport: { sentence: 'She had to show her ___ at the counter.', choices: ['credit card', 'ticket', 'passport', 'key'], correctIndex: 2, hint: 'Bu kelime, yurt dışına çıkarken kimliğini kanıtlamak için gösterdiğin resmi belgedir.' },
  gate: { sentence: 'He checked the ___ number one more time.', choices: ['gate', 'carousel', 'counter', 'lounge'], correctIndex: 0, hint: 'Bu kelime, havalimanında uçağa binerken geçtiğin, üzerinde numara yazan kapıyı anlatır.' },
  love: { sentence: 'She said she would always ___ learning new things.', choices: ['love', 'forget', 'avoid', 'fear'], correctIndex: 0, hint: 'Bu kelime, birine ya da bir şeye karşı duyulan çok güçlü ve sıcak bir bağlılık duygusunu anlatır.' },
  travel: { sentence: 'They wanted to ___ to a new country every year.', choices: ['travel', 'stay', 'sleep', 'wait'], correctIndex: 0, hint: 'Bu kelime, bir yerden başka, genellikle uzak bir yere gitmeyi anlatır.' },
  airport: { sentence: 'The ___ was crowded this morning.', choices: ['airport', 'museum', 'library', 'market'], correctIndex: 0, hint: 'Bu kelime, uçakların inip kalktığı, check-in ve pasaport kontrolünün yapıldığı yeri anlatır.' },
  coffee: { sentence: 'She drinks ___ without sugar.', choices: ['coffee', 'water', 'soup', 'juice'], correctIndex: 0, hint: 'Bu kelime, kavrulmuş çekirdeklerden yapılan, sıcak içilen, uyandırıcı bir içeceği anlatır.' },
  mountain: { sentence: 'They climbed the tall ___.', choices: ['mountain', 'building', 'ladder', 'hill'], correctIndex: 0, hint: 'Bu kelime, yerden çok yükseğe uzanan, genellikle zirvesine tırmanılan doğal bir oluşumu anlatır.' },
  sunset: { sentence: 'We watched the ___ by the sea.', choices: ['sunset', 'sunrise', 'storm', 'moonlight'], correctIndex: 0, hint: 'Bu kelime, güneşin akşam ufukta kaybolurken gökyüzünü renklendirdiği anı anlatır.' },
  dream: { sentence: 'He follows his biggest ___.', choices: ['dream', 'fear', 'job', 'rule'], correctIndex: 0, hint: 'Bu kelime, uyurken görülen ya da gelecekte gerçekleşmesi çok istenen bir şeyi anlatır.' },
  ocean: { sentence: 'The ___ looked calm and blue.', choices: ['ocean', 'desert', 'valley', 'forest'], correctIndex: 0, hint: 'Bu kelime, dünyanın büyük bir bölümünü kaplayan, uçsuz bucaksız tuzlu su kütlesini anlatır.' },
  city: { sentence: 'The ___ never sleeps at night.', choices: ['city', 'village', 'farm', 'island'], correctIndex: 0, hint: 'Bu kelime, çok sayıda insanın, binanın ve caddenin bulunduğu büyük bir yerleşim yerini anlatır.' },
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

/** Redacts the word from its own real example sentence — a genuine contextual clue that never states the word or its translation. */
function buildFallbackHint(en: string, example: string): string {
  const re = new RegExp(`\\b${en}\\b`, 'i');
  const redacted = re.test(example) ? example.replace(re, '____') : example;
  return `İpucu: Bu kelime şu cümlede geçiyor — "${redacted}" Cümlenin genel anlamından kelimenin ne olabileceğini çıkarmaya çalış.`;
}

function buildWordQuestion(word: string): Omit<WordQuestion, 'kind' | 'kicker'> {
  const key = word.toLowerCase();
  const entry = WORD_QUIZ_BANK[key];
  if (entry) {
    return { text: entry.sentence, choices: entry.choices, correctIndex: entry.correctIndex, hint: entry.hint, word: key };
  }
  const w = makeWord(key);
  const re = new RegExp(`\\b${key}\\b`, 'i');
  const text = re.test(w.example) ? w.example.replace(re, '___') : `We couldn't stop thinking about ___.`;
  const distractors = shuffle(FALLBACK_DISTRACTORS.filter((d) => d !== key)).slice(0, 3);
  const choices = shuffle([key, ...distractors]);
  return {
    text,
    choices,
    correctIndex: choices.indexOf(key),
    hint: buildFallbackHint(key, w.example),
    word: key,
  };
}

function buildQuestions(targetWords: TargetWordLite[], comprehension: ReturnType<typeof buildComprehensionQuestions>): Question[] {
  const total = targetWords.length + comprehension.length;
  const wordQuestions: WordQuestion[] = targetWords.map((tw, i) => ({
    kind: 'word',
    kicker: `KELİME · ${i + 1}/${total}`,
    ...buildWordQuestion(tw.word),
  }));
  const comprehensionQuestions: ComprehensionQuestion[] = comprehension.map((c, i) => ({
    kind: 'comprehension',
    kicker: `ANLAMA · ${targetWords.length + i + 1}/${total}`,
    ...c,
  }));
  return [...wordQuestions, ...comprehensionQuestions];
}

interface ResultTier {
  emoji: string;
  ringColor: string;
  ringGlow: string;
  title: string | null;
  sub: string;
  btnGradient: readonly [string, string];
  btnText: string;
  xpMultiplier: number;
}

function getResultTier(pct: number): ResultTier {
  if (pct < 0.4) {
    return {
      emoji: '😢',
      ringColor: TOKENS.red,
      ringGlow: 'rgba(248,113,113,0.35)',
      title: 'Yeterli değil',
      sub: 'Metne tekrar dön, bol bol oku ve dinle.',
      btnGradient: [TOKENS.violet400, TOKENS.violet600],
      btnText: 'Hikâye’ye Geri Dön',
      xpMultiplier: 5,
    };
  }
  if (pct < 0.7) {
    return {
      emoji: '🙂',
      ringColor: TOKENS.amber,
      ringGlow: 'rgba(250,204,21,0.35)',
      title: 'Fena değil, gelişiyorsun',
      sub: 'Bazı kelimeleri tekrar gözden geçirmek iyi olur.',
      btnGradient: ['#FBBF24', '#D97706'],
      btnText: 'Devam Et',
      xpMultiplier: 10,
    };
  }
  return {
    emoji: '🎉',
    ringColor: TOKENS.green,
    ringGlow: 'rgba(74,222,128,0.35)',
    title: null,
    sub: 'Bu kelimeler bir daha "yeni" olarak gelmeyecek',
    btnGradient: ['#34D399', '#059669'],
    btnText: 'Harika, Devam Et',
    xpMultiplier: 15,
  };
}

const RING_RADIUS = 60;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function QuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentSession } = useProgress();

  const [stage, setStage] = useState<'intro' | 'quiz'>('intro');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [wordResults, setWordResults] = useState<Record<string, boolean>>({});
  const [showHelp, setShowHelp] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const streakScale = useRef(new Animated.Value(1)).current;

  const targetWords: TargetWordLite[] = useMemo(
    () => currentSession?.targetWords.map((w, i) => ({ word: w.en, storyCount: mockStoryCountForIndex(i) })) ?? [],
    [currentSession],
  );
  const comprehension = useMemo(
    () => (currentSession ? buildComprehensionQuestions(currentSession) : []),
    [currentSession],
  );
  const questions = useMemo(() => buildQuestions(targetWords, comprehension), [targetWords, comprehension]);
  const total = questions.length;
  const question = questions[index];

  useEffect(() => {
    setShowHelp(false);
  }, [index]);

  if (!currentSession || total === 0) return <EmptySession />;

  const pulseStreak = () => {
    streakScale.setValue(1);
    Animated.sequence([
      Animated.timing(streakScale, { toValue: 1.25, duration: 160, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(streakScale, { toValue: 1, duration: 240, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  };

  const selectAnswer = (choiceIndex: number) => {
    if (answered) return;
    setAnswered(true);
    setSelected(choiceIndex);
    const isCorrect = choiceIndex === question.correctIndex;

    if (question.kind === 'word') {
      setWordResults((prev) => ({ ...prev, [question.word]: isCorrect }));
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    }

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setStreak((s) => s + 1);
      pulseStreak();
      setConfettiKey((k) => k + 1);
    } else {
      setStreak(0);
    }
  };

  const goNext = () => {
    if (index + 1 >= total) {
      setShowResults(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setAnswered(false);
  };

  if (stage === 'intro') {
    return (
      <IntroScreen
        targetWords={targetWords}
        totalQuestions={total}
        onStart={() => setStage('quiz')}
      />
    );
  }

  if (showResults) {
    return (
      <ResultsScreen
        questions={questions}
        correctCount={correctCount}
        targetWords={targetWords}
        wordResults={wordResults}
        insetsTop={insets.top}
        insetsBottom={insets.bottom}
      />
    );
  }

  const progressPct = (index / total) * 100;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.topRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <Animated.View style={[styles.streakBadge, { transform: [{ scale: streakScale }] }]}>
          <Text style={styles.streakText}>🔥 {streak}</Text>
        </Animated.View>
      </View>

      <View style={styles.kickerRow}>
        <Text style={styles.kicker}>{question.kicker}</Text>
        <Pressable style={styles.helpBtn} onPress={() => setShowHelp((v) => !v)}>
          <Feather name="help-circle" size={12} color={TOKENS.textMid} />
          <Text style={styles.helpBtnText}>Yardım</Text>
        </Pressable>
      </View>

      {showHelp ? (
        <View style={styles.helpPanel}>
          <Text style={styles.helpPanelText}>{question.hint}</Text>
        </View>
      ) : null}

      <QuestionText text={question.text} />

      <View style={styles.choices}>
        {question.choices.map((choice, i) => {
          const isCorrectChoice = i === question.correctIndex;
          const isChosen = selected === i;
          let choiceStyle = styles.choice;
          let choiceTextStyle = styles.choiceText;
          if (answered) {
            if (isCorrectChoice) {
              choiceStyle = { ...styles.choice, ...styles.choiceCorrect };
              choiceTextStyle = { ...styles.choiceText, ...styles.choiceTextCorrect };
            } else if (isChosen) {
              choiceStyle = { ...styles.choice, ...styles.choiceWrong };
              choiceTextStyle = { ...styles.choiceText, ...styles.choiceTextWrong };
            } else {
              choiceStyle = { ...styles.choice, ...styles.choiceDim };
            }
          }
          return (
            <Pressable key={choice + i} disabled={answered} onPress={() => selectAnswer(i)} style={choiceStyle}>
              <Text style={choiceTextStyle}>{choice}</Text>
            </Pressable>
          );
        })}
      </View>

      {answered ? (
        <View style={[styles.feedbackBanner, selected === question.correctIndex ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={[styles.feedbackText, { color: selected === question.correctIndex ? TOKENS.green : TOKENS.red }]}>
            {selected === question.correctIndex ? '✓ Harika! Doğru cevap.' : `✗ Doğrusu: "${question.choices[question.correctIndex]}"`}
          </Text>
        </View>
      ) : null}

      {answered ? (
        <Pressable style={styles.nextBtnWrap} onPress={goNext}>
          <LinearGradient colors={[TOKENS.violet400, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>{index + 1 >= total ? 'Sonuçları Gör →' : 'Sonraki Soru →'}</Text>
          </LinearGradient>
        </Pressable>
      ) : null}

      <ConfettiBurst burstKey={confettiKey} />
    </View>
  );
}

function IntroScreen({
  targetWords,
  totalQuestions,
  onStart,
}: {
  targetWords: TargetWordLite[];
  totalQuestions: number;
  onStart: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.introRoot, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.introBadge}>
        <Feather name="star" size={26} color="#FFFFFF" />
      </View>
      <Text style={styles.introTitle}>Kelimeleri Fethet</Text>
      <Text style={styles.introSub}>
        Bu hikâyede ilk kez gördüğün kelimeler var. Onları ve hikâyeyi ne kadar anladığını test edelim.
      </Text>
      <View style={styles.introWords}>
        {targetWords.map((tw) => (
          <View key={tw.word} style={styles.introWordPill}>
            <Text style={styles.introWordPillText}>{tw.word}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.introMeta}>
        {totalQuestions} soru · ~{Math.max(1, Math.round(totalQuestions / 4))} dakika
      </Text>
      <Pressable onPress={onStart}>
        <LinearGradient colors={[TOKENS.violet400, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.introBtn}>
          <Text style={styles.introBtnText}>Başla</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function QuestionText({ text }: { text: string }) {
  const parts = text.split('___');
  if (parts.length === 1) {
    return <Text style={styles.qText}>{text}</Text>;
  }
  return (
    <Text style={styles.qText}>
      {parts[0]}
      <Text style={styles.qBlank}>___</Text>
      {parts[1]}
    </Text>
  );
}

function ResultsScreen({
  questions,
  correctCount,
  targetWords,
  wordResults,
  insetsTop,
  insetsBottom,
}: {
  questions: Question[];
  correctCount: number;
  targetWords: TargetWordLite[];
  wordResults: Record<string, boolean>;
  insetsTop: number;
  insetsBottom: number;
}) {
  const router = useRouter();
  const pct = correctCount / questions.length;
  const isLowTier = pct < 0.4;
  const tier = useMemo(() => getResultTier(pct), [pct]);
  const learnedCount = Object.values(wordResults).filter(Boolean).length;
  const xp = correctCount * tier.xpMultiplier;

  const ringProgress = useRef(new Animated.Value(0)).current;
  const xpOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const [confettiKey, setConfettiKey] = useState(0);
  const [revealedWords, setRevealedWords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Animated.timing(ringProgress, { toValue: pct, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    const xpTimer = setTimeout(() => {
      Animated.timing(xpOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 900);

    const achievedWords = targetWords.filter((tw) => wordResults[tw.word]).map((tw) => tw.word);
    let delay = 1400;
    const timers: ReturnType<typeof setTimeout>[] = [xpTimer];
    achievedWords.forEach((word) => {
      const t = setTimeout(() => {
        setRevealedWords((prev) => ({ ...prev, [word]: true }));
        setConfettiKey((k) => k + 1);
      }, delay);
      timers.push(t);
      delay += 220;
    });
    const btnTimer = setTimeout(() => {
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, delay + 300);
    timers.push(btnTimer);

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strokeDashoffset = ringProgress.interpolate({ inputRange: [0, 1], outputRange: [RING_CIRCUMFERENCE, 0] });

  const goToSummary = () => {
    router.push({
      pathname: '/learn/summary',
      params: { correct: String(correctCount), total: String(questions.length), xp: String(xp) },
    });
  };

  const handleCta = () => {
    if (isLowTier) {
      router.replace('/learn/story');
      return;
    }
    goToSummary();
  };

  return (
    <View style={styles.resultsRoot}>
      <View style={[styles.resultsContent, { paddingTop: insetsTop + 44, paddingBottom: insetsBottom + 24 }]}>
        <View style={styles.ringWrap}>
          <View style={[styles.ringGlow, { backgroundColor: tier.ringGlow }]} />
          <Svg width={140} height={140} viewBox="0 0 132 132" style={styles.ringSvg}>
            <Circle cx={66} cy={66} r={RING_RADIUS} stroke="rgba(255,255,255,0.1)" strokeWidth={8} fill="none" />
            <AnimatedCircle
              cx={66}
              cy={66}
              r={RING_RADIUS}
              stroke={tier.ringColor}
              strokeWidth={8}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.ringEmoji}>{tier.emoji}</Text>
            <Text style={styles.ringScore}>{correctCount}/{questions.length}</Text>
          </View>
        </View>

        <Animated.Text style={[styles.xpLine, { opacity: xpOpacity }]}>+{xp} XP kazandın</Animated.Text>

        <Text style={styles.resultsTitle}>{tier.title ?? `${learnedCount} Kelime artık senin!`}</Text>
        <Text style={styles.resultsSub}>{tier.sub}</Text>

        <View style={styles.transformRow}>
          {targetWords.map((tw) => (
            <TransformPill key={tw.word} word={tw.word} done={!!revealedWords[tw.word]} />
          ))}
        </View>

        <Animated.View style={{ opacity: btnOpacity, width: '100%' }}>
          <Pressable onPress={handleCta}>
            <LinearGradient colors={tier.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.resultsBtn}>
              <Text style={styles.resultsBtnText}>{tier.btnText}</Text>
            </LinearGradient>
          </Pressable>
          {isLowTier ? (
            <Pressable onPress={goToSummary} style={styles.resultsBtnSecondary}>
              <Text style={styles.resultsBtnSecondaryText}>Devam Et</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>

      <ConfettiBurst burstKey={confettiKey} count={20} />
    </View>
  );
}

function TransformPill({ word, done }: { word: string; done: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!done) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.12, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [done, scale]);

  return (
    <Animated.View style={[styles.pill, done ? styles.pillDone : styles.pillRed, { transform: [{ scale }] }]}>
      <Text style={[styles.pillText, done ? styles.pillTextDone : styles.pillTextRed]}>
        {word}
        {done ? ' ✓' : ''}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: TOKENS.bg, paddingHorizontal: 20 },

  introRoot: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: TOKENS.bg, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  introBadge: { width: 64, height: 64, borderRadius: 20, marginBottom: 6, backgroundColor: TOKENS.violet500, alignItems: 'center', justifyContent: 'center' },
  introTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, color: TOKENS.textHi, marginBottom: 6, textAlign: 'center' },
  introSub: { fontFamily: 'Inter_400Regular', fontSize: 13.5, color: TOKENS.textMid, marginBottom: 22, maxWidth: 280, textAlign: 'center', lineHeight: 20 },
  introWords: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 28, maxWidth: 300 },
  introWordPill: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(248,113,113,0.16)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.4)' },
  introWordPillText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: TOKENS.red },
  introMeta: { fontFamily: 'Inter_500Medium', fontSize: 12, color: TOKENS.textLow, marginBottom: 24 },
  introBtn: { paddingVertical: 16, paddingHorizontal: 48, borderRadius: 16, alignItems: 'center' },
  introBtnText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#FFFFFF' },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: TOKENS.violet400 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(251,146,60,0.15)', borderWidth: 1, borderColor: 'rgba(251,146,60,0.35)' },
  streakText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#FB923C' },

  kickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  kicker: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.4, color: TOKENS.violet400 },
  helpBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  helpBtnText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: TOKENS.textMid },

  helpPanel: { marginBottom: 14, padding: 12, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(139,92,246,0.3)' },
  helpPanelText: { fontFamily: 'Inter_500Medium', fontSize: 12.5, lineHeight: 19, color: TOKENS.violet300 },

  qText: { fontFamily: 'Inter_700Bold', fontSize: 19, lineHeight: 27, color: TOKENS.textHi, marginBottom: 24 },
  qBlank: { color: TOKENS.violet300, textDecorationLine: 'underline' },

  choices: { gap: 10 },
  choice: { padding: 15, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  choiceText: { fontFamily: 'Inter_600SemiBold', fontSize: 14.5, color: TOKENS.textHi },
  choiceCorrect: { backgroundColor: 'rgba(34,197,94,0.18)', borderColor: TOKENS.green },
  choiceTextCorrect: { color: TOKENS.green },
  choiceWrong: { backgroundColor: 'rgba(248,113,113,0.18)', borderColor: TOKENS.red },
  choiceTextWrong: { color: TOKENS.red },
  choiceDim: { opacity: 0.35 },

  feedbackBanner: { marginTop: 18, padding: 13, borderRadius: 12 },
  feedbackCorrect: { backgroundColor: 'rgba(34,197,94,0.14)' },
  feedbackWrong: { backgroundColor: 'rgba(248,113,113,0.14)' },
  feedbackText: { fontFamily: 'Inter_700Bold', fontSize: 13 },

  nextBtnWrap: { marginTop: 'auto' },
  nextBtn: { padding: 15, borderRadius: 14, alignItems: 'center' },
  nextBtnText: { fontFamily: 'Inter_700Bold', fontSize: 14.5, color: '#FFFFFF' },

  resultsRoot: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: TOKENS.bg },
  resultsContent: { flex: 1, paddingHorizontal: 20, alignItems: 'center' },

  ringWrap: { width: 140, height: 140, marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
  ringGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, opacity: 0.5 },
  ringSvg: { position: 'absolute' },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  ringEmoji: { fontSize: 28, lineHeight: 32 },
  ringScore: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#FFFFFF' },

  xpLine: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FBBF24', marginTop: 14, marginBottom: 6 },

  resultsTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: TOKENS.textHi, marginTop: 8, marginBottom: 4, textAlign: 'center' },
  resultsSub: { fontFamily: 'Inter_400Regular', fontSize: 12.5, color: TOKENS.textLow, marginBottom: 20, textAlign: 'center', maxWidth: 280 },

  transformRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 26, maxWidth: 320 },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5 },
  pillRed: { backgroundColor: 'rgba(248,113,113,0.16)', borderColor: 'rgba(248,113,113,0.4)' },
  pillDone: { backgroundColor: 'rgba(34,197,94,0.16)', borderColor: 'rgba(74,222,128,0.4)' },
  pillText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  pillTextRed: { color: TOKENS.red },
  pillTextDone: { color: TOKENS.green },

  resultsBtn: { width: '100%', padding: 16, borderRadius: 16, alignItems: 'center' },
  resultsBtnText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#FFFFFF' },
  resultsBtnSecondary: {
    width: '100%',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  resultsBtnSecondaryText: { fontFamily: 'Inter_700Bold', fontSize: 13.5, color: TOKENS.violet300 },
});
