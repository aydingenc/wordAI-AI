import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import { EmptySession } from './story';

export default function QuizScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentSession } = useProgress();

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [tfChoice, setTfChoice] = useState<boolean | null>(null);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(false);

  const quiz = currentSession?.quiz ?? [];
  const total = quiz.length;
  const question = quiz[index];

  const tfOptions = useMemo(() => [true, false], []);

  if (!currentSession || total === 0) return <EmptySession />;

  const isCorrectChoice = (): boolean => {
    if (question.type === 'truefalse') return tfChoice === question.answer;
    return selected === question.answerIndex;
  };

  const submit = () => {
    if (answered) return;
    const ok = isCorrectChoice();
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        ok
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
    }
    if (ok) setCorrect((c) => c + 1);
    setAnswered(true);
  };

  const next = () => {
    if (index + 1 >= total) {
      router.push({
        pathname: '/learn/summary',
        params: { correct: String(correct), total: String(total) },
      });
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setTfChoice(null);
    setAnswered(false);
  };

  const hasChoice =
    question.type === 'truefalse' ? tfChoice !== null : selected !== null;

  const optionState = (chosen: boolean, isAnswer: boolean) => {
    if (!answered) return chosen ? 'selected' : 'idle';
    if (isAnswer) return 'correct';
    if (chosen && !isAnswer) return 'wrong';
    return 'idle';
  };

  const bgFor = (s: string) => {
    switch (s) {
      case 'selected':
        return { bg: colors.secondary, border: colors.primary };
      case 'correct':
        return { bg: 'rgba(52,211,153,0.15)', border: colors.success };
      case 'wrong':
        return { bg: 'rgba(248,113,113,0.15)', border: colors.destructive };
      default:
        return { bg: colors.card, border: colors.border };
    }
  };

  return (
    <GradientBackground>
      <ScreenHeader
        title="Quiz"
        subtitle={`Soru ${index + 1} / ${total}`}
      />
      <View style={styles.progressWrap}>
        <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${((index + (answered ? 1 : 0)) / total) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <GlowCard style={styles.qCard} active>
          <View style={[styles.qBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.qBadgeText, { color: colors.accent }]}>
              {question.type === 'multiple'
                ? 'Çoktan Seçmeli'
                : question.type === 'truefalse'
                  ? 'Doğru / Yanlış'
                  : 'Boşluk Doldur'}
            </Text>
          </View>
          <Text style={[styles.qText, { color: colors.foreground }]}>
            {question.prompt}
          </Text>
        </GlowCard>

        <View style={styles.options}>
          {question.type === 'truefalse'
            ? tfOptions.map((val) => {
                const chosen = tfChoice === val;
                const state = optionState(chosen, question.answer === val);
                const { bg, border } = bgFor(state);
                return (
                  <Pressable
                    key={String(val)}
                    disabled={answered}
                    onPress={() => setTfChoice(val)}
                    style={[
                      styles.option,
                      { backgroundColor: bg, borderColor: border, borderRadius: colors.radius },
                    ]}
                  >
                    <Feather
                      name={val ? 'check-circle' : 'x-circle'}
                      size={20}
                      color={colors.foreground}
                    />
                    <Text style={[styles.optionText, { color: colors.foreground }]}>
                      {val ? 'Doğru' : 'Yanlış'}
                    </Text>
                    {answered && question.answer === val ? (
                      <Feather name="check" size={20} color={colors.success} />
                    ) : null}
                  </Pressable>
                );
              })
            : question.options.map((opt, i) => {
                const chosen = selected === i;
                const state = optionState(chosen, i === question.answerIndex);
                const { bg, border } = bgFor(state);
                return (
                  <Pressable
                    key={opt + i}
                    disabled={answered}
                    onPress={() => setSelected(i)}
                    style={[
                      styles.option,
                      { backgroundColor: bg, borderColor: border, borderRadius: colors.radius },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: colors.foreground }]}>
                      {opt}
                    </Text>
                    {answered && i === question.answerIndex ? (
                      <Feather name="check" size={20} color={colors.success} />
                    ) : answered && chosen ? (
                      <Feather name="x" size={20} color={colors.destructive} />
                    ) : null}
                  </Pressable>
                );
              })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {!answered ? (
          <PrimaryButton
            label="Kontrol Et"
            icon="check"
            onPress={submit}
            disabled={!hasChoice}
            testID="quiz-check"
          />
        ) : (
          <PrimaryButton
            label={index + 1 >= total ? 'Sonucu Gör' : 'Sonraki Soru'}
            icon="arrow-right"
            onPress={next}
            testID="quiz-next"
          />
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  progressWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  qCard: {
    gap: 12,
  },
  qBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  qBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  qText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  optionText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
