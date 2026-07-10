import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import { IMAGES, LEVEL_NAMES, sessionFromScene, THEMES } from '@/data/mock';

const PICKS: { key: keyof typeof IMAGES; label: string; sceneId: string }[] = [
  { key: 'nature', label: 'Dağ Gölü', sceneId: 'nature-0' },
  { key: 'city', label: 'Şehir Işıkları', sceneId: 'city-0' },
  { key: 'airport', label: 'Havalimanı', sceneId: 'travel-0' },
  { key: 'cafe', label: 'Sabah Kahvesi', sceneId: 'cafe-0' },
  { key: 'beach', label: 'Altın Kumsal', sceneId: 'beach-0' },
];

export default function ImagesInfoScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { startSession } = useProgress();
  const [picked, setPicked] = useState<string | null>(null);

  const analyze = () => {
    const scene = THEMES.flatMap((t) => t.scenes).find((s) => s.id === picked);
    if (!scene) return;
    startSession(sessionFromScene(scene));
    router.push('/story-loading');
  };

  return (
    <GradientBackground>
      <ScreenHeader title="Görsellerden Öğren" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Bir fotoğraf seç
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          AI görseldeki nesneleri tanır, İngilizce kelimeleri çıkarır ve sana bir
          hikaye ile quiz hazırlar.
        </Text>

        {/* Upload placeholder */}
        <Pressable
          style={[styles.upload, { borderColor: colors.borderStrong }]}
          onPress={() =>
            Alert.alert(
              'Fotoğraf Yükle',
              'Bu bir demo — aşağıdaki hazır görsellerden birini seçerek devam edebilirsin.',
            )
          }
        >
          <Feather name="upload-cloud" size={28} color={colors.accent} />
          <Text style={[styles.uploadText, { color: colors.foreground }]}>
            Kendi fotoğrafını yükle
          </Text>
          <Text style={[styles.uploadHint, { color: colors.mutedForeground }]}>
            veya aşağıdaki hazır görsellerden seç
          </Text>
        </Pressable>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Hazır Görseller
        </Text>
        <View style={styles.grid}>
          {PICKS.map((p) => {
            const active = picked === p.sceneId;
            return (
              <Pressable
                key={p.sceneId}
                style={styles.cell}
                onPress={() => setPicked(p.sceneId)}
              >
                <GlowCard style={styles.imgCard} active={active} padded={false}>
                  <Image source={IMAGES[p.key]} style={styles.img} />
                  <View style={styles.imgOverlay} />
                  {active ? (
                    <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                      <Feather name="check" size={16} color={colors.primaryForeground} />
                    </View>
                  ) : null}
                  <Text style={styles.imgLabel}>{p.label}</Text>
                </GlowCard>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label={picked ? 'Analiz Et' : 'Bir görsel seç'}
          icon="cpu"
          onPress={analyze}
          disabled={!picked}
          testID="images-analyze"
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
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  upload: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 30,
  },
  uploadText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  uploadHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  cell: {
    width: '47.5%',
  },
  imgCard: {
    height: 120,
    overflow: 'hidden',
  },
  img: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,7,19,0.35)',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgLabel: {
    position: 'absolute',
    left: 12,
    bottom: 10,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#fff',
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
