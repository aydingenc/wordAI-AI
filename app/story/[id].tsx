import React, { useState } from 'react';
import {
  Image,
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

export default function StoryDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getStoryById } = useProgress();
  const [showTr, setShowTr] = useState(true);

  const story = getStoryById(id);

  if (!story) {
    return (
      <GradientBackground>
        <ScreenHeader title="Hikaye" />
        <View style={styles.empty}>
          <Text style={{ color: colors.foreground }}>Hikaye bulunamadı.</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScreenHeader
        title={story.title}
        subtitle={`${story.level} · ${story.targetWords.length} kelime`}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {story.image ? (
          <View style={styles.hero}>
            <Image source={story.image} style={styles.heroImg} />
            <View style={styles.heroOverlay} />
            <Text style={styles.heroTitle}>{story.title}</Text>
          </View>
        ) : null}

        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: colors.mutedForeground }]}>
            Türkçe çeviri
          </Text>
          <Pressable
            onPress={() => setShowTr((v) => !v)}
            style={[
              styles.toggle,
              { backgroundColor: showTr ? colors.primary : colors.secondary },
            ]}
          >
            <View
              style={[
                styles.knob,
                { alignSelf: showTr ? 'flex-end' : 'flex-start' },
              ]}
            />
          </Pressable>
        </View>

        {story.paragraphs.map((p, i) => (
          <GlowCard key={i} style={styles.para}>
            <Text style={[styles.enText, { color: colors.foreground }]}>{p.en}</Text>
            {showTr ? (
              <Text style={[styles.trText, { color: colors.mutedForeground }]}>{p.tr}</Text>
            ) : null}
          </GlowCard>
        ))}

        <GlowCard style={styles.wordsCard}>
          <Text style={[styles.wordsTitle, { color: colors.foreground }]}>
            Hikayedeki kelimeler
          </Text>
          <View style={styles.wordsWrap}>
            {story.targetWords.map((w) => (
              <View key={w} style={[styles.pill, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.pillText, { color: colors.accent }]}>{w}</Text>
              </View>
            ))}
          </View>
        </GlowCard>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    height: 160,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroImg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,7,19,0.5)',
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#fff',
    padding: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  toggleLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  para: {
    gap: 10,
  },
  enText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 17,
    lineHeight: 27,
  },
  trText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  wordsCard: {
    gap: 12,
  },
  wordsTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  wordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
});
