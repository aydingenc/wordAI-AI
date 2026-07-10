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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import { THEMES } from '@/data/mock';

export default function ThemesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeProgress } = useProgress();

  return (
    <GradientBackground>
      <ScreenHeader title="Hazır Temalar" subtitle="Bir dünya seç, keşfe başla" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {THEMES.map((theme) => {
          const unlocked = themeProgress[theme.id] ?? 1;
          const pct = Math.round((unlocked / theme.scenes.length) * 100);
          return (
            <Pressable
              key={theme.id}
              onPress={() => router.push(`/theme/${theme.id}`)}
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
            >
              <GlowCard style={styles.card} padded={false}>
                <Image source={theme.image} style={styles.img} />
                <View style={styles.overlay} />
                <View style={styles.inner}>
                  <View style={styles.top}>
                    <View style={[styles.badge, { backgroundColor: 'rgba(139,92,246,0.9)' }]}>
                      <Feather name="grid" size={13} color="#fff" />
                      <Text style={styles.badgeText}>{theme.scenes.length} sahne</Text>
                    </View>
                  </View>
                  <View style={styles.bottom}>
                    <Text style={styles.name}>{theme.name}</Text>
                    <Text style={styles.desc}>{theme.description}</Text>
                    <View style={styles.progressRow}>
                      <View style={styles.track}>
                        <View style={[styles.fill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.pct}>%{pct}</Text>
                    </View>
                  </View>
                </View>
              </GlowCard>
            </Pressable>
          );
        })}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    height: 200,
    overflow: 'hidden',
  },
  img: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,7,19,0.5)',
  },
  inner: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  top: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#fff',
  },
  bottom: {
    gap: 8,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#fff',
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#E9D5FF',
    lineHeight: 18,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#C084FC',
  },
  pct: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#fff',
  },
});
