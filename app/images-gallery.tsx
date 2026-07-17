import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryChipRow } from '@/components/CategoryChipRow';
import {
  GALLERY_CATEGORIES,
  GALLERY_ITEMS,
  GALLERY_ITEMS_ROUND_ROBIN,
  LEVEL_TIERS,
  type GalleryItem,
  type LevelTier,
} from '@/data/mock';

const TOKENS = {
  bg: '#0A0714',
  violet100: '#C4B5FD',
  violet300: '#A78BFA',
  violet600: '#7C3AED',
  textMuted: '#A19DB0',
};

const cardGradient = ['rgba(38,28,58,0.55)', 'rgba(22,16,31,0.9)'] as const;
const REVEAL_STEP = 4;

export default function ImagesGalleryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();
  const initialCategory = GALLERY_CATEGORIES.some((c) => c.id === params.category)
    ? (params.category as string)
    : null;

  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);
  const [activeTier, setActiveTier] = useState<LevelTier | null>(null);
  const [search, setSearch] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setRevealed(false);
  }, [activeCategory, activeTier, search]);

  const filteredItems = useMemo(() => {
    const base: GalleryItem[] = activeCategory
      ? GALLERY_ITEMS.filter((g) => g.categoryId === activeCategory)
      : GALLERY_ITEMS_ROUND_ROBIN;

    const tierLevels = activeTier
      ? LEVEL_TIERS.find((t) => t.tier === activeTier)?.levels ?? []
      : null;

    const query = search.trim().toLowerCase();

    return base.filter((item) => {
      if (tierLevels && !tierLevels.includes(item.level)) return false;
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.categoryName.toLowerCase().includes(query) ||
        item.targetWords.some((w) => w.toLowerCase().includes(query))
      );
    });
  }, [activeCategory, activeTier, search]);

  const displayedItems = revealed ? filteredItems : filteredItems.slice(0, REVEAL_STEP);
  const remaining = filteredItems.length - displayedItems.length;

  const selectedItem = filteredItems.find((g) => g.id === selectedId) ?? null;

  const useSelection = () => {
    if (!selectedItem) return;
    router.push({ pathname: '/scene-transition', params: { itemId: selectedItem.id } });
  };

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.bgGlowTop} />
      <View pointerEvents="none" style={styles.bgGlowBottom} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={TOKENS.violet100} />
          </Pressable>
          <View style={styles.countBadge}>
            <Feather name="image" size={13} color={TOKENS.violet300} />
            <Text style={styles.countText}>{GALLERY_ITEMS.length} görsel</Text>
          </View>
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.title}>Hazır Görseller</Text>
          <Text style={styles.subtitle}>
            Kategorilere göre hazırlanmış sahnelerden birini seç, hedef kelimeleri incele ve hikâyeni başlat.
          </Text>
        </View>

        <View style={styles.tierRow}>
          <TierChip label="Tümü" active={activeTier === null} onPress={() => setActiveTier(null)} />
          {LEVEL_TIERS.map((t) => (
            <TierChip
              key={t.tier}
              label={t.tier}
              active={activeTier === t.tier}
              onPress={() => setActiveTier((prev) => (prev === t.tier ? null : t.tier))}
            />
          ))}
        </View>

        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={TOKENS.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Kelime veya kategori ara"
            placeholderTextColor={TOKENS.textMuted}
            style={styles.searchInput}
          />
        </View>

        <CategoryChipRow
          activeId={activeCategory}
          onSelect={(id) => setActiveCategory((prev) => (id !== null && prev === id ? null : id))}
        />

        <View style={styles.cardList}>
          {displayedItems.map((item) => {
            const category = GALLERY_CATEGORIES.find((c) => c.id === item.categoryId);
            const selected = item.id === selectedId;
            return (
              <Pressable
                key={item.id}
                style={[styles.card, selected && styles.cardSelected]}
                onPress={() => setSelectedId((prev) => (prev === item.id ? null : item.id))}
              >
                {/* TODO: replace this gradient+icon placeholder with a real photo/CMS image once available */}
                <LinearGradient
                  colors={[TOKENS.violet300, TOKENS.violet600]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardImage}
                >
                  <View pointerEvents="none" style={[styles.heroStar, styles.heroStarOne]} />
                  <View pointerEvents="none" style={[styles.heroStar, styles.heroStarTwo]} />
                  <View pointerEvents="none" style={[styles.heroStar, styles.heroStarThree]} />
                  <View pointerEvents="none" style={[styles.heroStar, styles.heroStarFour]} />

                  <View style={styles.heroIconArea}>
                    <View pointerEvents="none" style={styles.heroRadialGlow} />
                    <Text style={[styles.heroSparkle, styles.heroSparkleOne]}>✦</Text>
                    <Text style={[styles.heroSparkle, styles.heroSparkleTwo]}>✦</Text>
                    <View style={styles.heroIconBadge}>
                      <MaterialCommunityIcons name={category?.icon as never} size={36} color="#FFFFFF" />
                    </View>
                  </View>

                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(19,13,28,0)', 'rgba(19,13,28,0.95)']}
                    style={styles.heroFade}
                  />

                  <View style={styles.cardImageTopRow}>
                    <View style={styles.categoryTag}>
                      <MaterialCommunityIcons name={category?.icon as never} size={11} color="#FFFFFF" />
                      <Text style={styles.categoryTagText}>{item.categoryName}</Text>
                    </View>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>{item.level}</Text>
                    </View>
                  </View>
                  {selected ? (
                    <View style={styles.selectedMark}>
                      <Feather name="check" size={16} color="#FFFFFF" />
                    </View>
                  ) : null}
                </LinearGradient>

                <LinearGradient colors={cardGradient} style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.title}</Text>

                  <View style={styles.sectionLabelRow}>
                    <View style={styles.sectionDot} />
                    <Text style={styles.sectionLabel}>Hedef Kelimeler</Text>
                  </View>
                  <View style={styles.wordWrap}>
                    {item.targetWords.map((w) => (
                      <View key={w} style={styles.wordPill}>
                        <Text style={styles.wordPillText}>{w}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.sectionLabelRow}>
                    <View style={styles.sectionDot} />
                    <Text style={styles.sectionLabel}>Özet</Text>
                  </View>
                  <Text style={styles.summaryText}>{item.preview.tr}</Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>

        {!revealed && remaining > 0 ? (
          <Pressable style={styles.revealButton} onPress={() => setRevealed(true)}>
            <Text style={styles.revealButtonText}>Tümünü Gör ({remaining} daha)</Text>
            <Feather name="chevron-down" size={18} color={TOKENS.violet100} />
          </Pressable>
        ) : null}
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable
          style={[styles.ctaButton, !selectedItem && styles.ctaButtonDisabled]}
          onPress={useSelection}
          disabled={!selectedItem}
        >
          <Text style={styles.ctaText}>Bu Görseli Kullan</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function TierChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.tierChipWrap} onPress={onPress}>
      {active ? (
        <LinearGradient colors={[TOKENS.violet300, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tierChip}>
          <Text style={styles.tierChipTextActive}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.tierChip, styles.tierChipInactive]}>
          <Text style={styles.tierChipText}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#03020A' },
  bgGlowTop: { position: 'absolute', top: -90, right: -95, width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(124,58,237,0.2)' },
  bgGlowBottom: { position: 'absolute', bottom: -100, left: -110, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(139,92,246,0.14)' },
  content: { paddingHorizontal: 22, gap: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(196,181,253,0.46)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,7,20,0.45)', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, borderRadius: 18, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(167,139,250,0.35)', backgroundColor: 'rgba(22,16,31,0.6)' },
  countText: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 12 },
  headerCopy: { gap: 6 },
  title: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 26, lineHeight: 32, letterSpacing: -0.45 },
  subtitle: { color: '#C7C2D0', fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  tierRow: { flexDirection: 'row', gap: 8 },
  tierChipWrap: { flex: 1 },
  tierChip: { height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tierChipInactive: { borderWidth: 1, borderColor: 'rgba(167,139,250,0.28)', backgroundColor: 'rgba(8,4,18,0.72)' },
  tierChipText: { color: TOKENS.textMuted, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  tierChipTextActive: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(167,139,250,0.26)', backgroundColor: 'rgba(8,4,18,0.72)' },
  searchInput: { flex: 1, color: '#FFFFFF', fontFamily: 'Inter_400Regular', fontSize: 14, paddingVertical: 0 },
  cardList: { gap: 16 },
  card: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(167,139,250,0.24)', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.16, shadowRadius: 16, elevation: 5 },
  cardSelected: { borderColor: TOKENS.violet300, shadowOpacity: 0.5, shadowRadius: 22 },
  cardImage: { height: 100, alignItems: 'center', justifyContent: 'center', padding: 14, overflow: 'hidden' },
  heroStar: { position: 'absolute', width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.75)' },
  heroStarOne: { top: 16, left: 24 },
  heroStarTwo: { top: 26, right: 32, width: 2, height: 2, borderRadius: 1 },
  heroStarThree: { bottom: 50, left: 38, width: 2, height: 2, borderRadius: 1 },
  heroStarFour: { top: 42, right: 20, width: 4, height: 4, borderRadius: 2, opacity: 0.6 },
  heroIconArea: { width: 70, height: 70, alignItems: 'center', justifyContent: 'center' },
  heroRadialGlow: { position: 'absolute', width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(196,181,253,0.32)', opacity: 0.55 },
  heroIconBadge: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(196,181,253,0.35)', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.55, shadowRadius: 28, elevation: 10 },
  heroSparkle: { position: 'absolute', color: '#F5F0FF', zIndex: 2 },
  heroSparkleOne: { top: 0, right: 2, fontSize: 11 },
  heroSparkleTwo: { bottom: 4, left: -2, fontSize: 7 },
  heroFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 38 },
  cardImageTopRow: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryTag: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  categoryTagText: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  levelBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(10,7,20,0.5)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.65)' },
  levelBadgeText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 11 },
  selectedMark: { position: 'absolute', bottom: 12, right: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(10,7,20,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  cardBody: { padding: 16, paddingTop: 14, gap: 4, marginTop: -14, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  cardTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 6 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  sectionDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: TOKENS.violet300 },
  sectionLabel: { color: TOKENS.violet100, fontFamily: 'Inter_600SemiBold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
  wordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4 },
  wordPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(167,139,250,0.45)', backgroundColor: 'rgba(139,92,246,0.14)' },
  wordPillText: { color: '#DDD6FE', fontFamily: 'Inter_500Medium', fontSize: 11 },
  summaryText: { color: TOKENS.textMuted, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 4 },
  revealButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(167,139,250,0.35)', backgroundColor: 'rgba(22,16,31,0.6)' },
  revealButtonText: { color: TOKENS.violet100, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  ctaBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 14, backgroundColor: 'rgba(3,2,10,0.92)', borderTopWidth: 1, borderTopColor: 'rgba(167,139,250,0.2)' },
  ctaButton: { height: 56, borderRadius: 28, backgroundColor: '#7C3AED', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(196,181,253,0.4)' },
  ctaButtonDisabled: { backgroundColor: 'rgba(124,58,237,0.28)', borderColor: 'rgba(196,181,253,0.15)' },
  ctaText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16 },
});
