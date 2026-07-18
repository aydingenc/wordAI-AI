import React from 'react';
import {
  Image,
  Pressable,
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
import { getThemeById } from '@/data/mock';

export default function ThemeDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLevelUnlocked } = useProgress();

  const theme = getThemeById(id);

  if (!theme) {
    return (
      <GradientBackground>
        <ScreenHeader title="Tema" />
        <View style={styles.empty}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.foreground }]}>
            Bu tema bulunamadı
          </Text>
          <PrimaryButton
            label="Ana Sayfaya Dön"
            icon="home"
            variant="secondary"
            onPress={() => router.replace('/home')}
          />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScreenHeader title={theme.name} subtitle={theme.description} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image source={theme.image} style={styles.heroImg} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{theme.name} Yolu</Text>
            <Text style={styles.heroSub}>
              Seviyeleri sırayla tamamla, yenilerini aç
            </Text>
          </View>
        </View>

        <View style={styles.pathList}>
          {theme.scenes.map((scene, i) => {
            const unlocked = isLevelUnlocked(theme.id, i);
            return (
              <View key={scene.id} style={styles.pathItem}>
                <View style={styles.rail}>
                  <View
                    style={[
                      styles.railDot,
                      {
                        backgroundColor: unlocked ? colors.primary : colors.secondary,
                        borderColor: unlocked ? colors.primaryGlow : colors.border,
                      },
                    ]}
                  >
                    <Feather
                      name={unlocked ? 'unlock' : 'lock'}
                      size={14}
                      color={unlocked ? colors.primaryForeground : colors.mutedForeground}
                    />
                  </View>
                  {i < theme.scenes.length - 1 ? (
                    <View style={[styles.railLine, { backgroundColor: colors.border }]} />
                  ) : null}
                </View>

                <Pressable
                  disabled={!unlocked}
                  onPress={() => router.push(`/scene/${scene.id}`)}
                  style={{ flex: 1, opacity: unlocked ? 1 : 0.55 }}
                  accessibilityRole="button"
                  accessibilityLabel={`${scene.levelName} · ${scene.name}${unlocked ? '' : ', kilitli'}`}
                  accessibilityState={{ disabled: !unlocked }}
                >
                  <GlowCard style={styles.sceneCard} active={unlocked && i === 0} padded={false}>
                    <Image source={scene.image} style={styles.sceneImg} />
                    <View style={styles.sceneBody}>
                      <Text style={[styles.sceneLevel, { color: colors.accent }]}>
                        {scene.levelName}
                      </Text>
                      <Text style={[styles.sceneName, { color: colors.foreground }]}>
                        {scene.name}
                      </Text>
                      <Text style={[styles.sceneMeta, { color: colors.mutedForeground }]}>
                        {scene.words.length} kelime · Hikaye + Quiz
                      </Text>
                    </View>
                    <Feather
                      name={unlocked ? 'chevron-right' : 'lock'}
                      size={20}
                      color={colors.mutedForeground}
                      style={{ marginRight: 12 }}
                    />
                  </GlowCard>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 18,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  hero: {
    height: 150,
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
    backgroundColor: 'rgba(11,7,19,0.5)',
  },
  heroText: {
    flex: 1,
    padding: 18,
    justifyContent: 'flex-end',
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#fff',
  },
  heroSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#E9D5FF',
    marginTop: 2,
  },
  pathList: {
    gap: 0,
  },
  pathItem: {
    flexDirection: 'row',
    gap: 14,
  },
  rail: {
    alignItems: 'center',
    width: 36,
  },
  railDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railLine: {
    flex: 1,
    width: 2,
    marginVertical: 4,
    minHeight: 40,
  },
  sceneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  sceneImg: {
    width: 74,
    height: 74,
  },
  sceneBody: {
    flex: 1,
    padding: 12,
    gap: 3,
  },
  sceneLevel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  sceneName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  sceneMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
});
