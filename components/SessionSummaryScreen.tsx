import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfettiBurst } from '@/components/Confetti';

export interface SessionSummaryScreenProps {
  storyTitle: string;
  xpEarned: number;
  newWordsCount: number;
  totalWordsLifetime: number;
  quizScore: { correct: number; total: number };
  streakDays: number;
  learnedWords: string[];
  onClose: () => void;
  onDifferentTheme: () => void;
  onPracticeWords: () => void;
  onNewStorySameWords: () => void;
}

const TOKENS = {
  bg: '#08070D',
  violet300: '#C4B5FD',
  violet400: '#A78BFA',
  violet600: '#7C3AED',
  textHi: '#F5F3FF',
  textMid: '#B9B3D1',
  textLow: '#6F6A8A',
};

function useDelayedFade(delay: number, translate = false) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(translate ? 8 : 0)).current;
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

export function SessionSummaryScreen({
  storyTitle,
  xpEarned,
  newWordsCount,
  totalWordsLifetime,
  quizScore,
  streakDays,
  learnedWords,
  onClose,
  onDifferentTheme,
  onPracticeWords,
  onNewStorySameWords,
}: SessionSummaryScreenProps) {
  const insets = useSafeAreaInsets();
  const [confettiKey, setConfettiKey] = useState(0);
  const badgeScale = useRef(new Animated.Value(0)).current;

  const titleAnim = useDelayedFade(300, true);
  const subAnim = useDelayedFade(400, true);
  const streakAnim = useDelayedFade(1000, true);
  const recapAnim = useDelayedFade(1150, true);
  const ctaAnim = useDelayedFade(1300, true);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(50),
      Animated.spring(badgeScale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => setConfettiKey((k) => k + 1), 200);
    return () => clearTimeout(t);
  }, [badgeScale]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 16 }]}>
      <Pressable style={styles.closeBtn} onPress={onClose}>
        <Feather name="x" size={15} color="#A3A0B8" />
      </Pressable>

      <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
        <LinearGradient colors={[TOKENS.violet400, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badgeInner}>
          <MaterialCommunityIcons name="star-four-points" size={32} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>

      <Animated.Text style={[styles.title, titleAnim]}>Harika bir oturumdu!</Animated.Text>
      <Animated.Text style={[styles.sub, subAnim]}>
        "{storyTitle}" hikâyesini bitirdin ve kelimeleri fethettin. İşte bugün kazandıkların:
      </Animated.Text>

      <View style={styles.statGrid}>
        <StatCard delay={500} icon="trophy" color="#FBBF24" value={`${xpEarned}`} label="Toplam XP" />
        <StatCard delay={620} icon="sprout" color="#4ADE80" value={`${newWordsCount}`} label="Yeni Kelime" />
        <StatCard delay={740} icon="star-outline" color="#60A5FA" value={`${totalWordsLifetime}`} label="Toplam Kelime" />
        <StatCard delay={860} icon="chart-bar" color={TOKENS.violet400} value={`${quizScore.correct}/${quizScore.total}`} label="Quiz Skoru" />
      </View>

      <Animated.View style={[styles.streakBanner, streakAnim]}>
        <Text style={styles.streakFire}>🔥</Text>
        <View style={styles.streakText}>
          <Text style={styles.streakT1}>{streakDays} günlük seriye ulaştın!</Text>
          <Text style={styles.streakT2}>Yarın da öğrenmeye devam et, serini bozma</Text>
        </View>
      </Animated.View>

      {learnedWords.length > 0 ? (
        <Animated.View style={[styles.recap, recapAnim]}>
          <Text style={styles.recapLabel}>✓ BUGÜN ÖĞRENDİĞİN KELİMELER</Text>
          <View style={styles.recapRow}>
            {learnedWords.map((word) => (
              <View key={word} style={styles.recapPill}>
                <Text style={styles.recapPillText}>{word}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      ) : null}

      <Animated.View style={[styles.ctaRow, ctaAnim]}>
        <Pressable onPress={onDifferentTheme}>
          <LinearGradient colors={[TOKENS.violet400, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaPrimary}>
            <Text style={styles.ctaPrimaryText}>Farklı Tema Farklı Hikâyeler</Text>
          </LinearGradient>
        </Pressable>
        <Pressable style={styles.ctaSecondary} onPress={onPracticeWords}>
          <Text style={styles.ctaSecondaryText}>Bu Kelimelerin Uzmanı Olmak İstiyorum</Text>
        </Pressable>
        <Pressable style={styles.ctaTertiary} onPress={onNewStorySameWords}>
          <Text style={styles.ctaTertiaryText}>Aynı Kelimelerden Farklı Hikâye Oluştur</Text>
        </Pressable>
      </Animated.View>

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
  const anim = useDelayedFade(delay, true);
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
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: TOKENS.bg,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
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
  badge: { width: 70, height: 70, marginTop: 30, marginBottom: 14 },
  badgeInner: { width: '100%', height: '100%', borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, color: TOKENS.textHi, marginBottom: 5, textAlign: 'center' },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 12.5, color: TOKENS.textMid, marginBottom: 20, textAlign: 'center', maxWidth: 280, lineHeight: 18 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, width: '100%', marginBottom: 14 },
  statCard: { width: '48%', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', backgroundColor: 'rgba(255,255,255,0.02)', paddingVertical: 13, paddingHorizontal: 8, alignItems: 'center' },
  statIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statNum: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#FFFFFF' },
  statLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, color: TOKENS.textLow, marginTop: 3 },

  streakBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', padding: 12, borderRadius: 14, backgroundColor: 'rgba(251,146,60,0.1)', borderWidth: 1, borderColor: 'rgba(251,146,60,0.3)', marginBottom: 16 },
  streakFire: { fontSize: 22 },
  streakText: { flex: 1 },
  streakT1: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#FB923C' },
  streakT2: { fontFamily: 'Inter_400Regular', fontSize: 11, color: TOKENS.textLow, marginTop: 1 },

  recap: { width: '100%', marginBottom: 18 },
  recapLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.4, color: TOKENS.violet400, marginBottom: 8 },
  recapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  recapPill: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.14)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.35)' },
  recapPillText: { fontFamily: 'Inter_700Bold', fontSize: 11.5, color: '#4ADE80' },

  ctaRow: { width: '100%', gap: 10, marginTop: 'auto' },
  ctaPrimary: { padding: 14, borderRadius: 15, alignItems: 'center' },
  ctaPrimaryText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFFF' },
  ctaSecondary: { padding: 12.5, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(139,92,246,0.35)', backgroundColor: 'rgba(139,92,246,0.1)' },
  ctaSecondaryText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: TOKENS.violet300 },
  ctaTertiary: { padding: 11.5, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)' },
  ctaTertiaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: TOKENS.textMid },
});
