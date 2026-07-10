import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';

export default function SummaryScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    correct?: string;
    total?: string;
    fromCards?: string;
    known?: string;
  }>();
  const { currentSession, unlockNextLevel, clearSession } = useProgress();

  const fromCards = params.fromCards === '1';
  const total = Number(params.total ?? currentSession?.targetWords.length ?? 0);
  const score = Number(fromCards ? params.known : params.correct ?? 0);
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // Unlock next theme level on quiz completion for theme-origin sessions.
    if (
      !fromCards &&
      currentSession?.origin === 'theme' &&
      currentSession.themeId != null &&
      currentSession.levelIndex != null &&
      pct >= 60
    ) {
      unlockNextLevel(currentSession.themeId, currentSession.levelIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const words = currentSession?.targetWords ?? [];

  const goCards = () => router.push('/learn/flashcards');
  const finish = () => {
    clearSession();
    router.dismissAll();
    router.replace('/home');
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.primary, shadowColor: colors.primaryGlow },
          ]}
        >
          <Feather
            name={fromCards ? 'check-circle' : 'award'}
            size={48}
            color={colors.primaryForeground}
          />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          {fromCards ? 'Ders Tamamlandı!' : 'Quiz Bitti!'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {fromCards
            ? 'Kelimelerin öğrenme döngüne eklendi.'
            : 'Harika gidiyorsun, devam et!'}
        </Text>

        <GlowCard style={styles.scoreCard} active>
          <Text style={[styles.scoreBig, { color: colors.foreground }]}>
            {score}
            <Text style={{ color: colors.mutedForeground }}> / {total}</Text>
          </Text>
          <Text style={[styles.scoreLabel, { color: colors.accent }]}>
            {fromCards ? 'bildiğin kelime' : 'doğru cevap'}
          </Text>
          <View style={[styles.track, { backgroundColor: colors.secondary }]}>
            <View
              style={[styles.fill, { backgroundColor: colors.primary, width: `${pct}%` }]}
            />
          </View>
          <Text style={[styles.pct, { color: colors.mutedForeground }]}>%{pct} başarı</Text>
        </GlowCard>

        {words.length > 0 ? (
          <GlowCard style={styles.wordsCard}>
            <Text style={[styles.wordsTitle, { color: colors.foreground }]}>
              Öğrenilen kelimeler
            </Text>
            {words.map((w) => (
              <View key={w.id} style={styles.wordRow}>
                <View style={[styles.check, { backgroundColor: colors.secondary }]}>
                  <Feather name="check" size={14} color={colors.success} />
                </View>
                <Text style={[styles.wEn, { color: colors.foreground }]}>{w.en}</Text>
                <Text style={[styles.wTr, { color: colors.mutedForeground }]}>{w.tr}</Text>
              </View>
            ))}
          </GlowCard>
        ) : null}

        <View style={styles.actions}>
          {!fromCards ? (
            <PrimaryButton
              label="Kelime Kartlarına Geç"
              icon="layers"
              onPress={goCards}
              testID="summary-to-cards"
            />
          ) : null}
          <PrimaryButton
            label="Bitir"
            icon="home"
            variant={fromCards ? 'primary' : 'secondary'}
            onPress={finish}
            testID="summary-finish"
          />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 14,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 10,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    marginTop: 6,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
  },
  scoreCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  scoreBig: {
    fontFamily: 'Inter_700Bold',
    fontSize: 48,
  },
  scoreLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  track: {
    height: 10,
    borderRadius: 5,
    width: '100%',
    overflow: 'hidden',
    marginTop: 4,
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  pct: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  wordsCard: {
    alignSelf: 'stretch',
    gap: 12,
  },
  wordsTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wEn: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    flex: 1,
  },
  wTr: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  actions: {
    alignSelf: 'stretch',
    gap: 12,
    marginTop: 8,
  },
});
