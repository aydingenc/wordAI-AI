import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfettiBurst } from '@/components/Confetti';
import { useProgress } from '@/context/ProgressContext';
import { getWordTier, mockStoryCountForIndex } from '@/data/mock';

const TOKENS = {
  bg: '#08070D',
  violet300: '#C4B5FD',
  violet400: '#A78BFA',
  violet600: '#7C3AED',
  textHi: '#F5F3FF',
  textMid: '#B9B3D1',
  textLow: '#6F6A8A',
};

function useDelayedFade(delay: number) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { opacity, transform: [{ translateY }] };
}

export default function SummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    correct?: string;
    total?: string;
    fromCards?: string;
    known?: string;
    xp?: string;
  }>();
  const { currentSession, recentWords, unlockNextLevel, clearSession } = useProgress();

  const fromCards = params.fromCards === '1';
  const quizTotal = Number(params.total ?? currentSession?.targetWords.length ?? 0);
  const quizCorrect = Number(params.correct ?? 0);
  const pct = quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0;
  const xp = Number(params.xp ?? 0);

  const [badgeScale] = useState(() => new Animated.Value(0));
  const [confettiKey, setConfettiKey] = useState(0);
  const titleAnim = useDelayedFade(300);
  const subAnim = useDelayedFade(400);
  const recapAnim = useDelayedFade(950);
  const ctaAnim = useDelayedFade(1100);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Animated.sequence([
      Animated.delay(50),
      Animated.spring(badgeScale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => setConfettiKey((k) => k + 1), 200);
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
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const targetWords = currentSession?.targetWords ?? [];
  // "Bugün öğrendiğin kelimeler" = this session's genuinely new (red-tier) words,
  // same storyCount source as learn/story.tsx and learn/quiz.tsx so tiers agree everywhere.
  const newWords = targetWords.filter((w, i) => getWordTier(mockStoryCountForIndex(i)) === 'red');

  const goCards = () => router.push({ pathname: '/learn/flashcards', params: { xp: String(xp) } });
  const closeSession = () => {
    clearSession();
    router.dismissAll();
    router.replace('/home');
  };
  const goDifferentTheme = () => router.push('/themes');
  const goPracticeHub = () => {
    // 1A audit report §5: PostStoryFlow's practice-methods hub is orphaned — no
    // route reaches it anymore. Kept passive rather than left as a dead link.
    Alert.alert('Kelime Öğrenme Yöntemleri', 'Bu özellik demo sürümünde yakında eklenecek.');
  };
  const goNewStorySameWords = () =>
    router.push({ pathname: '/words-entry', params: { prefillWords: targetWords.map((w) => w.en).join(',') } });

  return (
    <View style={styles.root}>
      <Pressable style={styles.closeBtn} onPress={closeSession}>
        <Feather name="x" size={15} color="#A3A0B8" />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
          <LinearGradient colors={[TOKENS.violet400, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badgeInner}>
            <MaterialCommunityIcons name="star-four-points" size={32} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        <Animated.Text style={[styles.title, titleAnim]}>
          {fromCards ? 'Harika bir oturumdu!' : 'Quiz tamamlandı!'}
        </Animated.Text>
        <Animated.Text style={[styles.sub, subAnim]}>
          {fromCards
            ? `"${currentSession?.title ?? ''}" hikâyesini bitirdin ve kelimeleri fethettin. İşte bugün kazandıkların:`
            : 'Şimdi sıra kelime kartlarında — hepsini pekiştirelim.'}
        </Animated.Text>

        <View style={styles.statGrid}>
          <StatCard delay={500} icon="trophy" color="#FBBF24" value={`${xp}`} label="Toplam XP" />
          <StatCard delay={620} icon="sprout" color="#4ADE80" value={`${newWords.length}`} label="Yeni Kelime" />
          <StatCard delay={740} icon="star-outline" color="#60A5FA" value={`${recentWords.length}`} label="Toplam Kelime" />
          <StatCard delay={860} icon="chart-bar" color={TOKENS.violet400} value={`${quizCorrect}/${quizTotal}`} label="Quiz Skoru" />
        </View>

        {newWords.length > 0 ? (
          <Animated.View style={[styles.recap, recapAnim]}>
            <Text style={styles.recapLabel}>✓ BUGÜN ÖĞRENDİĞİN KELİMELER</Text>
            <View style={styles.recapRow}>
              {newWords.map((w) => (
                <View key={w.id} style={styles.recapPill}>
                  <Text style={styles.recapPillText}>{w.en}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}

        <Animated.View style={[styles.ctaRow, ctaAnim]}>
          {!fromCards ? (
            <Pressable onPress={goCards}>
              <LinearGradient colors={[TOKENS.violet400, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaPrimary}>
                <Text style={styles.ctaPrimaryText}>Kelime Kartlarına Geç</Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={goDifferentTheme}>
                <LinearGradient colors={[TOKENS.violet400, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaPrimary}>
                  <Text style={styles.ctaPrimaryText}>Farklı Tema Farklı Hikâyeler</Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={styles.ctaSecondaryDisabled} onPress={goPracticeHub}>
                <Text style={styles.ctaSecondaryDisabledText}>Bu Kelimelerin Uzmanı Olmak İstiyorum</Text>
                <View style={styles.soonBadge}>
                  <Text style={styles.soonBadgeText}>Yakında</Text>
                </View>
              </Pressable>
              <Pressable style={styles.ctaTertiary} onPress={goNewStorySameWords}>
                <Text style={styles.ctaTertiaryText}>Aynı Kelimelerden Farklı Hikâye Oluştur</Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      </ScrollView>

      <ConfettiBurst burstKey={confettiKey} count={30} />
    </View>
  );
}

function StatCard({
  delay,
  icon,
  color,
  value,
  label,
}: {
  delay: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  value: string;
  label: string;
}) {
  const anim = useDelayedFade(delay);
  return (
    <Animated.View style={[styles.statCard, anim]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}26` }]}>
        <MaterialCommunityIcons name={icon} size={14} color={color} />
      </View>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TOKENS.bg },
  closeBtn: {
    position: 'absolute',
    top: 28,
    right: 26,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: 20, alignItems: 'center' },

  badge: { width: 70, height: 70, marginTop: 8, marginBottom: 14 },
  badgeInner: { width: '100%', height: '100%', borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, color: TOKENS.textHi, marginBottom: 5, textAlign: 'center' },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 12.5, color: TOKENS.textMid, marginBottom: 20, textAlign: 'center', maxWidth: 280, lineHeight: 18 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, width: '100%', marginBottom: 20 },
  statCard: { width: '48%', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', backgroundColor: 'rgba(255,255,255,0.02)', paddingVertical: 13, paddingHorizontal: 8, alignItems: 'center' },
  statIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statNum: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#FFFFFF' },
  statLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, color: TOKENS.textLow, marginTop: 3 },

  recap: { width: '100%', marginBottom: 22 },
  recapLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.4, color: TOKENS.violet400, marginBottom: 8 },
  recapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  recapPill: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.14)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.35)' },
  recapPillText: { fontFamily: 'Inter_700Bold', fontSize: 11.5, color: '#4ADE80' },

  ctaRow: { width: '100%', gap: 10 },
  ctaPrimary: { padding: 14, borderRadius: 15, alignItems: 'center' },
  ctaPrimaryText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFFF' },
  ctaSecondaryDisabled: {
    padding: 12.5,
    borderRadius: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    backgroundColor: 'rgba(139,92,246,0.05)',
  },
  ctaSecondaryDisabledText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: TOKENS.textLow },
  soonBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(139,92,246,0.18)' },
  soonBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 9, color: TOKENS.violet300 },
  ctaTertiary: { padding: 11.5, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)' },
  ctaTertiaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: TOKENS.textMid },
});
