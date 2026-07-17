import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ConfettiBurst } from '@/components/Confetti';

const TOKENS = {
  violet400: '#A78BFA',
  violet600: '#7C3AED',
  textHi: '#F5F3FF',
  textLow: '#6F6A8A',
};

export function PracticeCompleteScreen({
  title,
  stats,
  ctaLabel = 'Başka Bir Yöntemle Devam Et',
  onCta,
  badgeGradient = [TOKENS.violet400, TOKENS.violet600],
}: {
  title: string;
  stats: { n: string | number; label: string; color: string }[];
  ctaLabel?: string;
  onCta: () => void;
  badgeGradient?: readonly [string, string];
}) {
  const badgeScale = useRef(new Animated.Value(0)).current;
  const [confettiKey, setConfettiKey] = useState(0);

  useEffect(() => {
    Animated.spring(badgeScale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }).start();
    setConfettiKey((k) => k + 1);
  }, [badgeScale]);

  return (
    <View style={styles.root}>
      <Animated.View style={{ transform: [{ scale: badgeScale }] }}>
        <LinearGradient colors={badgeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badge}>
          <MaterialCommunityIcons name="star-four-points" size={30} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={[styles.statN, { color: s.color }]}>{s.n}</Text>
            <Text style={styles.statL}>{s.label}</Text>
          </View>
        ))}
      </View>
      <Pressable onPress={onCta} style={styles.ctaWrap}>
        <LinearGradient colors={[TOKENS.violet400, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </LinearGradient>
      </Pressable>
      <ConfettiBurst burstKey={confettiKey} count={28} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 22, color: TOKENS.textHi, marginBottom: 8, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, marginVertical: 18 },
  stat: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  statN: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  statL: { fontFamily: 'Inter_500Medium', fontSize: 10, color: TOKENS.textLow, marginTop: 2 },
  ctaWrap: { width: '100%', maxWidth: 280 },
  cta: { padding: 15, borderRadius: 15, alignItems: 'center' },
  ctaText: { fontFamily: 'Inter_700Bold', fontSize: 14.5, color: '#FFFFFF' },
});
