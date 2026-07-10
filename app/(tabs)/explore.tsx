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
import { useColors } from '@/hooks/useColors';
import { THEMES } from '@/data/mock';

const QUICK: {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
}[] = [
  {
    key: 'words',
    title: 'Kelimelerden Öğren',
    subtitle: 'Kendi kelimelerinle başla',
    icon: 'edit-3',
    route: '/words-info',
  },
  {
    key: 'images',
    title: 'Görsellerden Öğren',
    subtitle: 'Fotoğrafla kelime keşfet',
    icon: 'camera',
    route: '/images-info',
  },
];

export default function ExploreScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Keşfet</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Yeni yollar dene, hazır temalarla pratik yap
        </Text>

        <View style={styles.quickRow}>
          {QUICK.map((q) => (
            <Pressable
              key={q.key}
              style={{ flex: 1 }}
              onPress={() => router.push(q.route as never)}
            >
              <GlowCard style={styles.quickCard}>
                <View style={[styles.quickIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={q.icon} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.quickTitle, { color: colors.foreground }]}>
                  {q.title}
                </Text>
                <Text style={[styles.quickSub, { color: colors.mutedForeground }]}>
                  {q.subtitle}
                </Text>
              </GlowCard>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Hazır Temalar
          </Text>
          <Pressable onPress={() => router.push('/themes')}>
            <Text style={[styles.seeAll, { color: colors.accent }]}>Tümü</Text>
          </Pressable>
        </View>

        <View style={styles.themeGrid}>
          {THEMES.map((theme) => (
            <Pressable
              key={theme.id}
              style={styles.themeCell}
              onPress={() => router.push(`/theme/${theme.id}`)}
            >
              <GlowCard style={styles.themeCard} padded={false}>
                <Image source={theme.image} style={styles.themeImg} />
                <View style={styles.themeOverlay} />
                <View style={styles.themeText}>
                  <Text style={styles.themeName}>{theme.name}</Text>
                  <Text style={styles.themeCount}>
                    {theme.scenes.length} sahne
                  </Text>
                </View>
              </GlowCard>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 8,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 14,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    gap: 8,
    minHeight: 130,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginTop: 4,
  },
  quickSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  seeAll: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  themeCell: {
    width: '47.5%',
  },
  themeCard: {
    height: 130,
    overflow: 'hidden',
  },
  themeImg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  themeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,7,19,0.45)',
  },
  themeText: {
    flex: 1,
    padding: 14,
    justifyContent: 'flex-end',
  },
  themeName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  themeCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#E9D5FF',
    marginTop: 2,
  },
});
