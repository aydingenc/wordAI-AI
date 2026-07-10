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
import { PrimaryButton } from '@/components/PrimaryButton';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import { Story, THEME_STORIES } from '@/data/mock';

export default function StoriesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customStories } = useProgress();

  const all: Story[] = [...customStories, ...THEME_STORIES];

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Hikayelerim</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Oluşturduğun ve keşfettiğin tüm hikayeler
        </Text>

        {customStories.length === 0 ? (
          <GlowCard style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="book-open" size={26} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Henüz kendi hikayen yok
            </Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Kelimelerinden ilk hikayeni oluştur, burada saklansın.
            </Text>
            <PrimaryButton
              label="Hikaye Oluştur"
              icon="plus"
              onPress={() => router.push('/words-info')}
              style={{ marginTop: 6, alignSelf: 'stretch' }}
            />
          </GlowCard>
        ) : null}

        <View style={styles.list}>
          {all.map((story) => (
            <Pressable
              key={story.id}
              onPress={() => router.push(`/story/${story.id}`)}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <GlowCard style={styles.storyCard} padded={false}>
                {story.image ? (
                  <Image source={story.image} style={styles.storyImg} />
                ) : (
                  <View style={[styles.storyImg, { backgroundColor: colors.secondary }]}>
                    <Feather name="feather" size={28} color={colors.accent} />
                  </View>
                )}
                <View style={styles.storyBody}>
                  <View
                    style={[styles.badge, { backgroundColor: colors.secondary }]}
                  >
                    <Text style={[styles.badgeText, { color: colors.accent }]}>
                      {story.category === 'custom' ? 'Senin' : story.themeName}
                    </Text>
                  </View>
                  <Text style={[styles.storyTitle, { color: colors.foreground }]}>
                    {story.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <Feather name="bar-chart-2" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                      {story.level}
                    </Text>
                    <Feather name="tag" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                      {story.targetWords.length} kelime
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={22} color={colors.mutedForeground} />
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
    marginBottom: 12,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
  },
  emptyBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    gap: 12,
  },
  storyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingRight: 12,
  },
  storyImg: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyBody: {
    flex: 1,
    padding: 12,
    gap: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  storyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginRight: 6,
  },
});
