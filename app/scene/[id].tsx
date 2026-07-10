import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import { getSceneById, sessionFromScene } from '@/data/mock';

export default function SceneDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { startSession } = useProgress();

  const scene = getSceneById(id);

  if (!scene) {
    return (
      <GradientBackground>
        <ScreenHeader title="Sahne" />
        <View style={styles.empty}>
          <Text style={{ color: colors.foreground }}>Sahne bulunamadı.</Text>
        </View>
      </GradientBackground>
    );
  }

  const start = () => {
    startSession(sessionFromScene(scene));
    router.push('/story-loading');
  };

  return (
    <GradientBackground>
      <ScreenHeader title={scene.name} subtitle={scene.levelName} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image source={scene.image} style={styles.heroImg} />
          <View style={styles.heroOverlay} />
          <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
            <Feather name="bar-chart-2" size={13} color={colors.primaryForeground} />
            <Text style={styles.levelBadgeText}>{scene.levelName}</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>{scene.name}</Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>
          Bu sahnedeki nesnelerden çıkarılan kelimelerle bir hikaye okuyacak,
          quiz çözecek ve kelime kartlarıyla pekiştireceksin.
        </Text>

        <GlowCard style={styles.wordsCard}>
          <Text style={[styles.wordsTitle, { color: colors.foreground }]}>
            Bu sahnenin kelimeleri
          </Text>
          {scene.words.map((w) => (
            <View key={w.id} style={styles.wordRow}>
              <View style={[styles.wordIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="tag" size={14} color={colors.accent} />
              </View>
              <Text style={[styles.wEn, { color: colors.foreground }]}>{w.en}</Text>
              <Text style={[styles.wTr, { color: colors.mutedForeground }]}>{w.tr}</Text>
            </View>
          ))}
        </GlowCard>

        <View style={styles.flowRow}>
          {[
            { icon: 'book-open' as const, label: 'Hikaye' },
            { icon: 'help-circle' as const, label: 'Quiz' },
            { icon: 'layers' as const, label: 'Kartlar' },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <View style={styles.flowStep}>
                <View style={[styles.flowIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={s.icon} size={18} color={colors.accent} />
                </View>
                <Text style={[styles.flowLabel, { color: colors.mutedForeground }]}>
                  {s.label}
                </Text>
              </View>
              {i < arr.length - 1 ? (
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              ) : null}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label="Derse Başla"
          icon="play"
          onPress={start}
          testID="scene-start"
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    height: 180,
    borderRadius: 22,
    overflow: 'hidden',
  },
  heroImg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,7,19,0.3)',
  },
  levelBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  levelBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#fff',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    marginTop: 4,
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  wordsCard: {
    gap: 12,
    marginTop: 4,
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
  wordIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  flowStep: {
    alignItems: 'center',
    gap: 6,
  },
  flowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
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
