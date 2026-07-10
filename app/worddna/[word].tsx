import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import { findWordByEn, labExamples, makeWord, Word } from '@/data/mock';

type Tab = 'dna' | 'lab';

export default function WordDnaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { word: wordParam } = useLocalSearchParams<{ word: string }>();
  const { recentWords } = useProgress();
  const [tab, setTab] = useState<Tab>('dna');

  const word: Word = useMemo(() => {
    const fromRecent = recentWords.find(
      (w) => w.en.toLowerCase() === (wordParam ?? '').toLowerCase(),
    );
    return fromRecent ?? findWordByEn(wordParam) ?? makeWord(wordParam ?? 'word', 55);
  }, [wordParam, recentWords]);

  const dnaMetrics = [
    { label: 'Hatırlama', value: word.strength, icon: 'zap' as const },
    { label: 'Kullanım', value: Math.min(100, word.strength + 12), icon: 'edit-3' as const },
    { label: 'Tanıma', value: Math.min(100, word.strength + 20), icon: 'eye' as const },
  ];

  return (
    <GradientBackground>
      <ScreenHeader title="Word DNA" subtitle={word.en} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header word card */}
        <GlowCard style={styles.headCard} active>
          <Text style={[styles.bigWord, { color: colors.foreground }]}>{word.en}</Text>
          {word.phonetic ? (
            <Text style={[styles.phonetic, { color: colors.accent }]}>{word.phonetic}</Text>
          ) : null}
          <View style={[styles.trBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.trText, { color: colors.foreground }]}>{word.tr}</Text>
          </View>
        </GlowCard>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.secondary }]}>
          {(['dna', 'lab'] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[
                  styles.tab,
                  { backgroundColor: active ? colors.primary : 'transparent' },
                ]}
              >
                <Feather
                  name={t === 'dna' ? 'activity' : 'zap'}
                  size={15}
                  color={active ? colors.primaryForeground : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  {t === 'dna' ? 'Word DNA' : 'Sentence Lab'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'dna' ? (
          <>
            <GlowCard style={styles.metricsCard}>
              {dnaMetrics.map((m) => (
                <View key={m.label} style={styles.metric}>
                  <View style={styles.metricHead}>
                    <Feather name={m.icon} size={15} color={colors.accent} />
                    <Text style={[styles.metricLabel, { color: colors.foreground }]}>
                      {m.label}
                    </Text>
                    <Text style={[styles.metricValue, { color: colors.mutedForeground }]}>
                      %{m.value}
                    </Text>
                  </View>
                  <View style={[styles.track, { backgroundColor: colors.secondary }]}>
                    <View
                      style={[
                        styles.fill,
                        { backgroundColor: colors.primary, width: `${m.value}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </GlowCard>

            <GlowCard style={styles.exampleCard}>
              <Text style={[styles.exampleTitle, { color: colors.foreground }]}>
                Örnek Cümle
              </Text>
              <Text style={[styles.exEn, { color: colors.foreground }]}>{word.example}</Text>
              <Text style={[styles.exTr, { color: colors.mutedForeground }]}>
                {word.exampleTr}
              </Text>
            </GlowCard>
          </>
        ) : (
          <View style={styles.labList}>
            <Text style={[styles.labIntro, { color: colors.mutedForeground }]}>
              "{word.en}" kelimesini farklı cümlelerde gör:
            </Text>
            {labExamples(word).map((ex, i) => (
              <GlowCard key={i} style={styles.labCard}>
                <View style={[styles.labNum, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.labNumText, { color: colors.accent }]}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exEn, { color: colors.foreground }]}>{ex.en}</Text>
                  <Text style={[styles.exTr, { color: colors.mutedForeground }]}>{ex.tr}</Text>
                </View>
              </GlowCard>
            ))}
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  headCard: {
    alignItems: 'center',
    gap: 8,
  },
  bigWord: {
    fontFamily: 'Inter_700Bold',
    fontSize: 34,
  },
  phonetic: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
  trBadge: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  trText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  tabs: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  metricsCard: {
    gap: 16,
  },
  metric: {
    gap: 8,
  },
  metricHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricLabel: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  metricValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  exampleCard: {
    gap: 8,
  },
  exampleTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  exEn: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 22,
  },
  exTr: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  labList: {
    gap: 12,
  },
  labIntro: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  labCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  labNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labNumText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
});
