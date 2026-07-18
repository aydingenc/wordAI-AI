import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { BookIcon, SparkleIcon } from '@/components/WordStatusIcons';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import { buildSessionFromStory, DISCOVER_GALLERY_ITEMS, GalleryItem, sessionFromGalleryItem, Story } from '@/data/mock';

type TabKey = 'all' | 'own' | 'theme';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'own', label: 'Kendi Oluşturduklarım' },
  { key: 'theme', label: 'Hazır Tema Hikayeler' },
];

// Curated gradient placeholders — no real photos (licensing), same approach as images-gallery.tsx.
const COLLECTION_GRADIENTS: [string, string, string][] = [
  ['#3d2a1a', '#ff8a5c', '#7c3aed'],
  ['#0f2417', '#2f6b47', '#16324a'],
  ['#241708', '#a5672f', '#3a2a1a'],
  ['#0a1a2a', '#1f4a6b', '#05121f'],
  ['#2a0a12', '#6b1f2f', '#0f0508'],
];

const DISCOVER_GRADIENTS: [string, string, string][] = [
  ['#123a4a', '#2f7a8c', '#0a1f2e'],
  ['#0a0a1a', '#1e2a4a', '#05050d'],
  ['#2a0a12', '#6b1f2f', '#0f0508'],
  ['#0a1a2a', '#1f4a6b', '#05121f'],
  ['#241708', '#a5672f', '#3a2a1a'],
];

function themeLabelFor(story: Story): string {
  if (story.themeName) return `${story.themeName} / ${story.themeNameEn ?? story.themeName}`;
  return 'Kendi Kelimelerim';
}

// View-only adaptor: DiscoverCard renders Story-shaped data, but the real 16
// categories live as GalleryItem (images-gallery.tsx's own system). Neither
// `image` nor `paragraphs` is used by DiscoverCard (it only reads `gradient`
// and text fields), so this is safe to leave sparse.
function discoverStoryFromGalleryItem(item: GalleryItem): Story {
  return {
    id: item.id,
    title: item.title,
    level: item.level,
    levelCode: item.level,
    category: 'theme',
    themeName: item.categoryName,
    themeNameEn: item.categoryName,
    paragraphs: [],
    targetWords: item.targetWords,
  };
}

export default function StoriesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customStories, startSession } = useProgress();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const showCollection = activeTab === 'all' || activeTab === 'own';
  const showDiscover = activeTab === 'all' || activeTab === 'theme';
  const hasOwnStories = customStories.length > 0;

  const openStory = (story: Story) => {
    // Own stories now reopen in the rich learn/story.tsx reader (chapters,
    // target-word pills, TTS) instead of the old plain-text /story/[id]
    // screen. Preset theme stories never reach this function (they use
    // openTheme below), but the category check keeps this correct even if
    // that ever changes.
    if (story.category === 'custom') {
      startSession(buildSessionFromStory(story));
      router.push('/learn/story');
      return;
    }
    router.push(`/story/${story.id}`);
  };
  const openTheme = (story: Story) => {
    // THEME_STORIES cards preview one specific scene, so tapping one must
    // deep-link straight into that scene (scene/[id].tsx) instead of the
    // theme's scene-list hub — otherwise the previewed content doesn't match
    // where the tap lands. Falls back to the hub if sceneId is ever missing.
    if (story.sceneId) {
      router.push(`/scene/${story.sceneId}`);
      return;
    }
    if (story.themeId) router.push(`/theme/${story.themeId}`);
  };
  const openGalleryItem = (item: GalleryItem) => {
    startSession(sessionFromGalleryItem(item));
    router.push('/learn/story');
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <SparkleIcon size={14} color={colors.accent} />
            <LinearGradient
              colors={['rgba(196,181,253,0.4)', 'rgba(88,58,168,0.18)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.headerIcon, { borderColor: 'rgba(196,181,253,0.5)' }]}
            >
              <BookIcon size={17} color={colors.accent} />
            </LinearGradient>
            <Text style={[styles.title, { color: colors.foreground }]}>Hikayelerim</Text>
            <SparkleIcon size={14} color={colors.accent} />
          </View>
          <Pressable
            onPress={() => router.push('/create')}
            style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.85 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Yeni hikaye oluştur"
          >
            <LinearGradient
              colors={[colors.accent, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addBtnGradient}
            >
              <Feather name="plus" size={18} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Oluşturduğun ve keşfettiğin tüm hikayeler.
        </Text>

        <View style={[styles.tabs, { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: colors.border }]}>
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={styles.tabHit}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: active }}
              >
                {active ? (
                  <LinearGradient
                    colors={[colors.accent, colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tabActive}
                  >
                    <Text style={styles.tabTextActive}>{tab.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tab}>
                    <Text style={[styles.tabText, { color: colors.mutedForeground }]}>{tab.label}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {showCollection ? (
          hasOwnStories ? (
            <>
              <SectionHead
                icon={<BookIcon size={15} color={colors.accent} />}
                title="Hikaye Koleksiyonum"
                showSeeAll={activeTab !== 'own'}
                onSeeAll={() => setActiveTab('own')}
              />
              <View style={styles.collectionList}>
                {customStories.map((story, i) => (
                  <CollectionCard
                    key={story.id}
                    story={story}
                    gradient={COLLECTION_GRADIENTS[i % COLLECTION_GRADIENTS.length]}
                    onPress={() => openStory(story)}
                  />
                ))}
              </View>
            </>
          ) : (
            <GlowCard style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="book-open" size={26} color={colors.accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Henüz kendi hikayen yok</Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                Kelimelerinden ilk hikayeni oluştur, burada saklansın.
              </Text>
              <PrimaryButton
                label="Hikaye Oluştur"
                icon="plus"
                onPress={() => router.push('/create')}
                style={{ marginTop: 6, alignSelf: 'stretch' }}
              />
            </GlowCard>
          )
        ) : null}

        {showDiscover ? (
          activeTab === 'theme' ? (
            <View style={styles.discoverGrid}>
              {DISCOVER_GALLERY_ITEMS.map((item, i) => (
                <DiscoverCard
                  key={item.id}
                  story={discoverStoryFromGalleryItem(item)}
                  gradient={DISCOVER_GRADIENTS[i % DISCOVER_GRADIENTS.length]}
                  style={styles.discoverGridItem}
                  onPress={() => openGalleryItem(item)}
                />
              ))}
            </View>
          ) : (
            <>
              <SectionHead
                icon={<SparkleIcon size={15} color="#facc15" />}
                title="Yeni Hikayeler Keşfet"
                showSeeAll
                onSeeAll={() => setActiveTab('theme')}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.discoverScroll}
              >
                {DISCOVER_GALLERY_ITEMS.map((item, i) => (
                  <DiscoverCard
                    key={item.id}
                    story={discoverStoryFromGalleryItem(item)}
                    gradient={DISCOVER_GRADIENTS[i % DISCOVER_GRADIENTS.length]}
                    style={styles.discoverScrollItem}
                    onPress={() => openGalleryItem(item)}
                  />
                ))}
              </ScrollView>
            </>
          )
        ) : null}
      </ScrollView>
    </GradientBackground>
  );
}

function SectionHead({
  icon,
  title,
  showSeeAll,
  onSeeAll,
}: {
  icon: React.ReactNode;
  title: string;
  showSeeAll: boolean;
  onSeeAll: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionTitleRow}>
        {icon}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {showSeeAll ? (
        <Pressable onPress={onSeeAll} style={styles.seeAll} hitSlop={6}>
          <Text style={[styles.seeAllText, { color: colors.accent }]}>Tümünü Gör</Text>
          <Feather name="chevron-right" size={12} color={colors.accent} />
        </Pressable>
      ) : null}
    </View>
  );
}

function CollectionCard({
  story,
  gradient,
  onPress,
}: {
  story: Story;
  gradient: [string, string, string];
  onPress: () => void;
}) {
  const colors = useColors();
  const tags = story.targetWords.slice(0, 5);
  const description = story.paragraphs[0]?.tr ?? '';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      <GlowCard padded={false} style={styles.collectionCard}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.collectionThumb}
        />
        <View style={styles.collectionBody}>
          <Text style={[styles.collectionTitle, { color: colors.foreground }]}>{story.title}</Text>
          <View style={styles.tagRow}>
            {tags.map((t) => (
              <View
                key={t}
                style={[styles.tagPill, { backgroundColor: 'rgba(139,92,246,0.14)', borderColor: 'rgba(139,92,246,0.3)' }]}
              >
                <Text style={[styles.tagPillText, { color: colors.accent }]}>{t}</Text>
              </View>
            ))}
          </View>
          {description ? (
            <Text style={[styles.collectionDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
          <View style={[styles.collectionFoot, { borderTopColor: 'rgba(255,255,255,0.06)' }]}>
            <View style={styles.themeTag}>
              <BookIcon size={12} color={colors.accent} />
              <Text style={[styles.themeTagText, { color: colors.accent }]} numberOfLines={1}>
                Tema: {themeLabelFor(story)}
              </Text>
            </View>
          </View>
        </View>
      </GlowCard>
    </Pressable>
  );
}

function DiscoverCard({
  story,
  gradient,
  style,
  onPress,
}: {
  story: Story;
  gradient: [string, string, string];
  style?: ViewStyle;
  onPress: () => void;
}) {
  const colors = useColors();
  const tags = story.targetWords.slice(0, 3);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [style, { opacity: pressed ? 0.9 : 1 }]}>
      <GlowCard padded={false} style={styles.discoverCard}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.discoverThumb}
        >
          <View style={[styles.levelBadge, { backgroundColor: 'rgba(124,58,237,0.85)' }]}>
            <Text style={styles.levelBadgeText}>{story.levelCode}</Text>
          </View>
        </LinearGradient>
        <View style={styles.discoverBody}>
          <Text style={[styles.discoverTitle, { color: colors.foreground }]} numberOfLines={2}>
            {story.title}
          </Text>
          <View style={styles.discoverTagsRow}>
            {tags.map((t) => (
              <View key={t} style={[styles.discoverTag, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                <Text style={[styles.discoverTagText, { color: colors.mutedForeground }]}>{t}</Text>
              </View>
            ))}
          </View>
          <View style={styles.discoverThemeRow}>
            <BookIcon size={10} color={colors.accent} />
            <Text style={[styles.discoverThemeText, { color: colors.accent }]} numberOfLines={1}>
              {themeLabelFor(story)}
            </Text>
          </View>
        </View>
      </GlowCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    gap: 0,
  },
  header: {
    position: 'relative',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 21,
  },
  addBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  addBtnGradient: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },

  tabs: {
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
  },
  tabHit: {
    flex: 1,
  },
  tab: {
    minHeight: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    paddingVertical: 8,
  },
  tabActive: {
    minHeight: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    paddingVertical: 8,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  tabText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    lineHeight: 12.5,
    textAlign: 'center',
  },
  tabTextActive: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    lineHeight: 12.5,
    textAlign: 'center',
    color: '#FFFFFF',
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 14.5,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  seeAllText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11.5,
  },

  empty: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 26,
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

  collectionList: {
    gap: 14,
    marginBottom: 26,
  },
  collectionCard: {
    overflow: 'hidden',
  },
  collectionThumb: {
    width: '100%',
    height: 130,
  },
  collectionBody: {
    padding: 15,
    paddingTop: 14,
  },
  collectionTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 15.5,
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  tagPillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  collectionDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    lineHeight: 17.5,
    marginBottom: 12,
  },
  collectionFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  themeTag: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 8,
  },
  themeTagText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10.5,
    flexShrink: 1,
  },
  likeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCountText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },

  discoverScroll: {
    gap: 12,
    paddingBottom: 6,
  },
  discoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  discoverScrollItem: {
    width: 148,
  },
  discoverGridItem: {
    width: '47%',
  },
  discoverCard: {
    overflow: 'hidden',
  },
  discoverThumb: {
    width: '100%',
    height: 96,
  },
  levelBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  levelBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    color: '#FFFFFF',
  },
  discoverBody: {
    padding: 11,
    paddingTop: 10,
  },
  discoverTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    lineHeight: 15.5,
    minHeight: 33,
    marginBottom: 6,
  },
  discoverTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
    minHeight: 36,
  },
  discoverTag: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discoverTagText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 8.5,
  },
  discoverThemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discoverThemeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    flexShrink: 1,
  },
});
