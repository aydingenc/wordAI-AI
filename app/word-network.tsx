import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOKENS = {
  bg: '#08070D',
  violet300: '#C4B5FD',
  violet400: '#A78BFA',
  violet600: '#7C3AED',
  green: '#4ADE80',
  textHi: '#F5F3FF',
  textMid: '#B9B3D1',
  textLow: '#6F6A8A',
};

export interface NetworkTheme {
  name: string;
  nameTr: string;
  icon: string;
  iconBg: string;
  progressColors: readonly [string, string];
  current: number;
  total: number;
  words: string[];
  ai: string;
  networkWords: string[];
}

/** The 16 vocabulary-network topics — also reused by the Kelime Kartları hub's "Temalara göre çalış" section. */
export const NETWORK_THEMES: NetworkTheme[] = [
  { name: 'Travel', nameTr: 'Seyahat', icon: '🧳', iconBg: 'rgba(139,92,246,0.2)', progressColors: ['#A78BFA', '#7C3AED'], current: 32, total: 40, words: ['airport', 'passport', 'journey', 'holiday', 'hotel', 'luggage', 'ticket'], ai: 'Bu tema tamamlandığında seyahat konularında rahatça konuşabileceksin.', networkWords: ['airport', 'passport', 'journey', 'holiday', 'hotel', 'luggage', 'map', 'visa'] },
  { name: 'Entertainment', nameTr: 'Eğlence', icon: '🎬', iconBg: 'rgba(244,114,182,0.16)', progressColors: ['#F472B6', '#BE185D'], current: 14, total: 35, words: ['movie', 'concert', 'actor', 'festival', 'ticket', 'screen'], ai: 'Bu tema tamamlandığında eğlence dünyasından rahatça bahsedebileceksin.', networkWords: ['movie', 'concert', 'actor', 'festival', 'screen', 'stage', 'plot', 'genre'] },
  { name: 'Art', nameTr: 'Sanat', icon: '🎨', iconBg: 'rgba(251,146,60,0.16)', progressColors: ['#FB923C', '#C2410C'], current: 9, total: 30, words: ['canvas', 'sculpture', 'gallery', 'brush', 'palette'], ai: 'Bu tema tamamlandığında sanat eserlerini yorumlayabileceksin.', networkWords: ['canvas', 'sculpture', 'gallery', 'brush', 'palette', 'artist', 'exhibit', 'frame'] },
  { name: 'Politics', nameTr: 'Politika', icon: '🏛️', iconBg: 'rgba(96,165,250,0.16)', progressColors: ['#60A5FA', '#1D4ED8'], current: 6, total: 30, words: ['election', 'senate', 'policy', 'debate', 'vote'], ai: 'Bu tema tamamlandığında güncel olayları takip edebileceksin.', networkWords: ['election', 'senate', 'policy', 'debate', 'vote', 'law', 'reform', 'ballot'] },
  { name: 'Nature', nameTr: 'Doğa', icon: '🌿', iconBg: 'rgba(74,222,128,0.16)', progressColors: ['#4ADE80', '#15803D'], current: 21, total: 35, words: ['forest', 'river', 'wildlife', 'mountain', 'desert'], ai: 'Bu tema tamamlandığında doğa hakkında konuşabileceksin.', networkWords: ['forest', 'river', 'wildlife', 'mountain', 'desert', 'valley', 'stream', 'cliff'] },
  { name: 'Daily Life', nameTr: 'Günlük Yaşam', icon: '☕', iconBg: 'rgba(217,119,6,0.16)', progressColors: ['#FBBF24', '#B45309'], current: 27, total: 35, words: ['routine', 'breakfast', 'commute', 'chores', 'errand'], ai: 'Bu tema tamamlandığında günlük hayatını İngilizce anlatabileceksin.', networkWords: ['routine', 'breakfast', 'commute', 'chores', 'errand', 'laundry', 'grocery', 'schedule'] },
  { name: 'Business', nameTr: 'İş', icon: '💼', iconBg: 'rgba(96,165,250,0.16)', progressColors: ['#60A5FA', '#2563EB'], current: 18, total: 40, words: ['meeting', 'contract', 'revenue', 'client', 'deadline'], ai: 'Bu tema tamamlandığında iş toplantılarında rahat konuşabileceksin.', networkWords: ['meeting', 'contract', 'revenue', 'client', 'deadline', 'invoice', 'budget', 'proposal'] },
  { name: 'Health', nameTr: 'Sağlık', icon: '🩺', iconBg: 'rgba(248,113,113,0.16)', progressColors: ['#FACC15', '#CA8A04'], current: 15, total: 30, words: ['clinic', 'symptom', 'prescription', 'checkup', 'recovery'], ai: 'Bu tema tamamlandığında sağlıkla ilgili konuları anlatabileceksin.', networkWords: ['clinic', 'symptom', 'prescription', 'checkup', 'recovery', 'diagnosis', 'therapy', 'vaccine'] },
  { name: 'Emotions', nameTr: 'Duygular', icon: '😊', iconBg: 'rgba(250,204,21,0.16)', progressColors: ['#FDE047', '#CA8A04'], current: 19, total: 30, words: ['joy', 'anxiety', 'gratitude', 'frustration', 'relief'], ai: 'Bu tema tamamlandığında duygularını daha iyi ifade edebileceksin.', networkWords: ['joy', 'anxiety', 'gratitude', 'frustration', 'relief', 'excitement', 'calm', 'hope'] },
  { name: 'Relationships & Dating', nameTr: 'İlişkiler', icon: '💕', iconBg: 'rgba(244,114,182,0.16)', progressColors: ['#F472B6', '#BE185D'], current: 7, total: 25, words: ['crush', 'commitment', 'breakup', 'trust', 'affection'], ai: 'Bu tema tamamlandığında ilişkiler hakkında rahat konuşabileceksin.', networkWords: ['crush', 'commitment', 'breakup', 'trust', 'affection', 'loyalty', 'romance', 'bond'] },
  { name: 'Food', nameTr: 'Yemek', icon: '🍽️', iconBg: 'rgba(251,146,60,0.16)', progressColors: ['#A78BFA', '#7C3AED'], current: 11, total: 30, words: ['recipe', 'flavor', 'ingredient', 'appetizer', 'dessert'], ai: 'Bu tema tamamlandığında yemek siparişi verip tarif tartışabileceksin.', networkWords: ['recipe', 'flavor', 'ingredient', 'appetizer', 'dessert', 'cuisine', 'portion', 'spice'] },
  { name: 'Science', nameTr: 'Bilim', icon: '🔬', iconBg: 'rgba(45,212,191,0.16)', progressColors: ['#2DD4BF', '#0D9488'], current: 13, total: 35, words: ['hypothesis', 'experiment', 'molecule', 'theory', 'evidence'], ai: 'Bu tema tamamlandığında bilimsel konuları tartışabileceksin.', networkWords: ['hypothesis', 'experiment', 'molecule', 'theory', 'evidence', 'sample', 'data', 'lab'] },
  { name: 'Technology', nameTr: 'Teknoloji', icon: '💻', iconBg: 'rgba(45,212,191,0.16)', progressColors: ['#2DD4BF', '#0D9488'], current: 24, total: 40, words: ['software', 'device', 'network', 'update', 'algorithm'], ai: 'Bu tema tamamlandığında teknoloji sohbetlerine katılabileceksin.', networkWords: ['software', 'device', 'network', 'update', 'algorithm', 'server', 'interface', 'bandwidth'] },
  { name: 'Shopping', nameTr: 'Alışveriş', icon: '🛍️', iconBg: 'rgba(244,114,182,0.16)', progressColors: ['#F472B6', '#BE185D'], current: 16, total: 30, words: ['discount', 'receipt', 'checkout', 'refund', 'brand'], ai: 'Bu tema tamamlandığında alışveriş yaparken rahat olacaksın.', networkWords: ['discount', 'receipt', 'checkout', 'refund', 'brand', 'coupon', 'cart', 'warranty'] },
  { name: 'Sports', nameTr: 'Spor', icon: '⚽', iconBg: 'rgba(74,222,128,0.16)', progressColors: ['#F472B6', '#BE185D'], current: 7, total: 25, words: ['match', 'coach', 'stadium', 'referee', 'score'], ai: 'Bu tema tamamlandığında spor maçlarını takip edip konuşabileceksin.', networkWords: ['match', 'coach', 'stadium', 'referee', 'score', 'league', 'tournament', 'goal'] },
  { name: 'Education', nameTr: 'Eğitim', icon: '📚', iconBg: 'rgba(167,139,250,0.16)', progressColors: ['#C4B5FD', '#7C3AED'], current: 22, total: 35, words: ['lecture', 'exam', 'curriculum', 'tuition', 'degree'], ai: 'Bu tema tamamlandığında eğitim konularında akıcı konuşabileceksin.', networkWords: ['lecture', 'exam', 'curriculum', 'tuition', 'degree', 'semester', 'faculty', 'thesis'] },
];

const PER_PAGE = 4;
const TOTAL_PAGES = Math.ceil(NETWORK_THEMES.length / PER_PAGE);
// Fallback used only until the left column's real height is measured via onLayout.
const FALLBACK_COLUMN_HEIGHT = 372;
const WORD_LIST_HEIGHT = 150;

const NET_BOX_W = 320;
const NET_BOX_H = 280;
const NET_CENTER = { x: NET_BOX_W / 2, y: NET_BOX_H / 2 };
const NET_POSITIONS = [
  { x: NET_CENTER.x, y: 42 },
  { x: NET_CENTER.x + 100, y: 74 },
  { x: NET_CENTER.x + 112, y: NET_CENTER.y },
  { x: NET_CENTER.x + 82, y: NET_BOX_H - 40 },
  { x: NET_CENTER.x, y: NET_BOX_H - 28 },
  { x: NET_CENTER.x - 82, y: NET_BOX_H - 40 },
  { x: NET_CENTER.x - 112, y: NET_CENTER.y },
  { x: NET_CENTER.x - 100, y: 74 },
];

export default function WordNetworkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [columnHeight, setColumnHeight] = useState(FALLBACK_COLUMN_HEIGHT);

  const pageThemes = NETWORK_THEMES.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const theme = NETWORK_THEMES[selectedIndex];
  const pct = Math.round((theme.current / theme.total) * 100);

  const selectTheme = (idx: number) => setSelectedIndex(idx);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topbar}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Feather name="chevron-left" size={17} color={TOKENS.violet300} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            <Text style={styles.spark}>✦</Text> Canlı Kelime Ağı <Text style={styles.spark}>✦</Text>
          </Text>
          <Text style={styles.headerSub}>Kelimeleri temalar içinde ve bağlantılarla keşfet.</Text>
        </View>

        <View style={styles.topRow}>
          <View
            style={styles.collectionsCol}
            onLayout={(e) => setColumnHeight(e.nativeEvent.layout.height)}
          >
            <View style={styles.collectionsList}>
              {pageThemes.map((t, i) => {
                const globalIdx = page * PER_PAGE + i;
                const selected = globalIdx === selectedIndex;
                const cardPct = Math.round((t.current / t.total) * 100);
                return (
                  <Pressable
                    key={t.name}
                    style={[styles.collectionCard, selected && styles.collectionCardSelected]}
                    onPress={() => selectTheme(globalIdx)}
                  >
                    <View style={[styles.collIcon, { backgroundColor: t.iconBg }]}>
                      <Text style={styles.collIconText}>{t.icon}</Text>
                    </View>
                    <View style={styles.collText}>
                      <Text style={styles.collName} numberOfLines={1}>{t.name}</Text>
                      <View style={styles.collProgressRow}>
                        <View style={styles.collProgressTrack}>
                          <LinearGradient
                            colors={t.progressColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.collProgressFill, { width: `${cardPct}%` }]}
                          />
                        </View>
                        <Text style={styles.collCount}>{t.current}/{t.total}</Text>
                      </View>
                    </View>
                    <Feather name="chevron-right" size={13} color={TOKENS.textLow} />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.pager}>
              <Pressable
                style={[styles.pagerBtn, page === 0 && styles.pagerBtnDisabled]}
                disabled={page === 0}
                onPress={() => setPage((p) => Math.max(0, p - 1))}
              >
                <Feather name="chevron-left" size={15} color={TOKENS.violet300} />
              </Pressable>
              <View style={styles.pagerDots}>
                {Array.from({ length: TOTAL_PAGES }, (_, i) => (
                  <View key={i} style={[styles.pagerDot, i === page && styles.pagerDotActive]} />
                ))}
              </View>
              <Pressable
                style={[styles.pagerBtn, page === TOTAL_PAGES - 1 && styles.pagerBtnDisabled]}
                disabled={page === TOTAL_PAGES - 1}
                onPress={() => setPage((p) => Math.min(TOTAL_PAGES - 1, p + 1))}
              >
                <Feather name="chevron-right" size={15} color={TOKENS.violet300} />
              </Pressable>
            </View>
          </View>

          <View style={[styles.detailCol, { height: columnHeight }]}>
            <LinearGradient
              colors={['rgba(139,92,246,0.1)', 'rgba(20,14,34,0.5)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[styles.detailCard, { height: columnHeight }]}
            >
              <View style={styles.detailHero}>
                <View style={styles.detailHeroText}>
                  <Text style={styles.detailName} numberOfLines={1}>{theme.name}</Text>
                </View>
                <View style={[styles.detailIconLg, { backgroundColor: 'rgba(139,92,246,0.18)' }]}>
                  <Text style={styles.detailIconLgText}>{theme.icon}</Text>
                </View>
              </View>

              <View style={styles.detailCountPill}>
                <Text style={styles.detailCountPillText}>{theme.current}/{theme.total} Kelime</Text>
              </View>
              <View style={styles.detailProgressTrack}>
                <LinearGradient
                  colors={[TOKENS.violet400, TOKENS.violet600]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.detailProgressFill, { width: `${pct}%` }]}
                />
              </View>
              <Text style={styles.detailPct}>%{pct} Tamamlandı</Text>

              <Text style={styles.sectionLabel}>{theme.nameTr} Kelimelerim</Text>
              <WordListScroll words={theme.words} height={WORD_LIST_HEIGHT} />
            </LinearGradient>
          </View>
        </View>

        <View style={styles.aiComment}>
          <View style={styles.aiCommentIcon}>
            <Text style={styles.aiCommentIconText}>🧠</Text>
          </View>
          <Text style={styles.aiCommentText}>
            <Text style={styles.aiCommentBold}>AI Yorumu: </Text>
            {theme.ai}
          </Text>
        </View>

        <Text style={styles.outerSectionLabel}>KELİME AĞI</Text>
        <View style={styles.networkCard}>
          <View style={styles.networkHeader}>
            <View style={styles.networkTitleRow}>
              <MaterialCommunityIcons name="graph-outline" size={15} color={TOKENS.violet400} />
              <Text style={styles.networkTitle}>Kelime Ağı</Text>
            </View>
            <SampleDataPill />
          </View>
          <Text style={styles.networkSub}>{theme.name} temasındaki bağlantıları incele</Text>
          <Text style={styles.networkSampleNote}>
            Bu ağ örnek/gösterim amaçlıdır; henüz senin gerçek kelime geçmişine bağlı değil.
          </Text>

          <NetworkGraph centerWord={theme.words[0] ?? theme.name.toLowerCase()} words={theme.networkWords} />
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 16 }]}>
        <NavItem icon="home" label="Ana Sayfa" active onPress={() => router.replace('/home')} />
        <NavItem icon="book-open-variant" label="Kelimelerim" onPress={() => router.replace('/words')} />
        <Pressable style={styles.navFabWrap} onPress={() => router.push('/create')}>
          <LinearGradient colors={[TOKENS.violet400, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.navFab}>
            <Feather name="plus" size={20} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
        <NavItem icon="bookmark-outline" label="Hikâyelerim" onPress={() => router.replace('/stories')} />
        <NavItem icon="compass-outline" label="Keşfet" onPress={() => router.replace('/explore')} />
      </View>
    </View>
  );
}

// Renamed from the earlier "LivePill" (CANLI/pulsing-green): this network is
// static sample content, not a live/real-time feed, so the badge must not
// imply otherwise (WL-009 dummy-data honesty).
function SampleDataPill() {
  return (
    <View style={styles.livePill}>
      <View style={styles.liveDot} />
      <Text style={styles.livePillText}>ÖRNEK</Text>
    </View>
  );
}

function WordListScroll({ words, height }: { words: string[]; height: number }) {
  const [scrollY, setScrollY] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const showThumb = contentHeight > height;
  const thumbHeight = showThumb ? Math.max(20, (height / contentHeight) * height) : height;
  const maxScroll = Math.max(1, contentHeight - height);
  const thumbTop = showThumb ? (scrollY / maxScroll) * (height - thumbHeight) : 0;

  return (
    <View style={[styles.wordListWrap, { height }]}>
      <ScrollView
        style={styles.wordListScroll}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        onContentSizeChange={(_w, h) => setContentHeight(h)}
      >
        {words.map((w) => (
          <View key={w} style={styles.wordRow}>
            <View style={styles.wordCheck}>
              <Feather name="check" size={9} color={TOKENS.violet300} />
            </View>
            <Text style={styles.wordName} numberOfLines={1}>{w}</Text>
            <Feather name="chevron-right" size={12} color={TOKENS.textLow} />
          </View>
        ))}
      </ScrollView>
      {showThumb ? (
        <View style={styles.scrollTrack}>
          <View style={[styles.scrollThumb, { height: thumbHeight, top: thumbTop }]} />
        </View>
      ) : null}
    </View>
  );
}

// The graph's internal coordinates are all authored against a fixed
// NET_BOX_W×NET_BOX_H box. On phones narrower than that box (320-360px
// devices, once screen padding is subtracted) it used to overflow/clip
// (WL-009). Instead of rewriting the node-position math, the whole box is
// measured and uniformly scaled down to fit — the same technique already
// used for the onboarding screen's responsive scale factor.
function NetworkGraph({ centerWord, words }: { centerWord: string; words: string[] }) {
  const [containerWidth, setContainerWidth] = useState(NET_BOX_W);
  const scale = Math.min(1, containerWidth / NET_BOX_W);
  const onLayout = (e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.networkSvgOuter} onLayout={onLayout}>
      <View style={[styles.networkSvgWrap, { width: NET_BOX_W * scale, height: NET_BOX_H * scale }]}>
        <View style={{ width: NET_BOX_W, height: NET_BOX_H, transform: [{ scale }] }}>
          <Svg width={NET_BOX_W} height={NET_BOX_H} viewBox={`0 0 ${NET_BOX_W} ${NET_BOX_H}`}>
            {NET_POSITIONS.map((p, i) => (
              <Line
                key={i}
                x1={NET_CENTER.x}
                y1={NET_CENTER.y}
                x2={p.x}
                y2={p.y}
                stroke="rgba(167,139,250,0.35)"
                strokeWidth={1.5}
              />
            ))}
          </Svg>
          {NET_POSITIONS.map((p, i) => (
            <View key={i} style={[styles.netNode, { left: p.x - 41, top: p.y - 15 }]}>
              <Text style={styles.netNodeText} numberOfLines={1}>{words[i] ?? ''}</Text>
            </View>
          ))}
          <View style={[styles.netNodeCenter, { left: NET_CENTER.x - 55, top: NET_CENTER.y - 25 }]}>
            <Text style={styles.netNodeCenterText} numberOfLines={1}>{centerWord}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function NavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.navItem} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={20} color={active ? TOKENS.violet400 : TOKENS.textLow} />
      <Text style={[styles.navItemText, active && styles.navItemTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TOKENS.bg },
  scrollContent: { paddingHorizontal: 18 },

  topbar: { flexDirection: 'row', marginBottom: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', alignItems: 'center', justifyContent: 'center' },

  header: { alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, color: TOKENS.textHi },
  spark: { color: TOKENS.violet400, fontSize: 15 },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: TOKENS.textLow, marginTop: 4 },

  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 22 },

  collectionsCol: { flexBasis: '44%', flexGrow: 0, flexShrink: 0 },
  collectionsList: { gap: 8 },
  collectionCard: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 9, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.025)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)' },
  collectionCardSelected: { borderColor: 'rgba(139,92,246,0.6)', backgroundColor: 'rgba(139,92,246,0.1)' },
  collIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  collIconText: { fontSize: 14 },
  collText: { flex: 1, minWidth: 0, gap: 4 },
  collName: { fontFamily: 'Inter_700Bold', fontSize: 11, color: TOKENS.textHi },
  collProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  collProgressTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  collProgressFill: { height: '100%', borderRadius: 2 },
  collCount: { fontFamily: 'Inter_700Bold', fontSize: 8.5, color: TOKENS.textMid, flexShrink: 0 },

  pager: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pagerBtn: { width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', alignItems: 'center', justifyContent: 'center' },
  pagerBtnDisabled: { opacity: 0.3 },
  pagerDots: { flexDirection: 'row', gap: 5 },
  pagerDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  pagerDotActive: { backgroundColor: TOKENS.violet400 },

  detailCol: { flex: 1 },
  detailCard: { borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', overflow: 'hidden' },
  detailHero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  detailHeroText: { flex: 1, justifyContent: 'center', paddingTop: 6 },
  detailName: { fontFamily: 'Inter_700Bold', fontSize: 16, color: TOKENS.textHi, textAlign: 'center' },
  detailIconLg: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  detailIconLgText: { fontSize: 20 },

  detailCountPill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(139,92,246,0.18)', marginBottom: 7 },
  detailCountPillText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: TOKENS.violet300 },
  detailProgressTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 4 },
  detailProgressFill: { height: '100%', borderRadius: 3 },
  detailPct: { fontFamily: 'Inter_400Regular', fontSize: 9.5, color: TOKENS.textLow, marginBottom: 10 },

  sectionLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.3, color: TOKENS.violet400, marginBottom: 6 },

  wordListWrap: { flexDirection: 'row', overflow: 'hidden' },
  wordListScroll: { flex: 1 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 6, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  wordCheck: { width: 15, height: 15, borderRadius: 8, backgroundColor: 'rgba(139,92,246,0.25)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  wordName: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 11.5, color: TOKENS.textHi },

  scrollTrack: { width: 3, marginLeft: 3, borderRadius: 2, backgroundColor: 'transparent' },
  scrollThumb: { position: 'absolute', width: 3, borderRadius: 2, backgroundColor: 'rgba(139,92,246,0.35)' },

  aiComment: { marginBottom: 22, flexDirection: 'row', gap: 10, padding: 13, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.06)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  aiCommentIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.18)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aiCommentIconText: { fontSize: 15 },
  aiCommentText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11.5, color: TOKENS.textMid, lineHeight: 17 },
  aiCommentBold: { fontFamily: 'Inter_700Bold', color: TOKENS.violet300 },

  outerSectionLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.3, color: TOKENS.violet400, marginBottom: 8 },
  networkCard: { borderRadius: 20, padding: 16, backgroundColor: 'rgba(139,92,246,0.05)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.22)' },
  networkHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  networkTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  networkTitle: { fontFamily: 'Inter_700Bold', fontSize: 13.5, color: TOKENS.textHi },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: TOKENS.violet400 },
  livePillText: { fontFamily: 'Inter_700Bold', fontSize: 9, color: TOKENS.violet300 },
  networkSub: { fontFamily: 'Inter_400Regular', fontSize: 10, color: TOKENS.textLow, marginTop: 3, marginBottom: 4 },
  networkSampleNote: { fontFamily: 'Inter_400Regular', fontSize: 10, color: TOKENS.textLow, fontStyle: 'italic', marginBottom: 10 },

  networkSvgOuter: { width: '100%', alignItems: 'center' },
  networkSvgWrap: { alignSelf: 'center', position: 'relative', overflow: 'hidden' },
  netNode: { position: 'absolute', width: 82, paddingVertical: 7, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,14,34,0.9)', borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.5)' },
  netNodeText: { fontFamily: 'Inter_700Bold', fontSize: 10.5, color: TOKENS.textHi },
  netNodeCenter: { position: 'absolute', width: 110, paddingVertical: 14, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(139,92,246,0.28)', borderWidth: 2, borderColor: TOKENS.violet400 },
  netNodeCenterText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: TOKENS.textHi },

  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 10, backgroundColor: 'rgba(8,7,13,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  navItem: { alignItems: 'center', gap: 4 },
  navItemText: { fontFamily: 'Inter_700Bold', fontSize: 9, color: TOKENS.textLow },
  navItemTextActive: { color: TOKENS.violet400 },
  navFabWrap: { marginTop: -26 },
  navFab: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: TOKENS.bg },
});
