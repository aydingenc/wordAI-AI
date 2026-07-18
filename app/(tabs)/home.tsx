import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { Logo } from '@/components/Logo';
import { WordNetwork } from '@/components/WordNetwork';
import { FeatureCarousel } from '@/components/FeatureCarousel';
import { useColors } from '@/hooks/useColors';
import { IMAGES } from '@/data/mock';
import { APP_NAME } from '@/constants/app';

const STORY_IMG = require('@/assets/images/home-story.jpg');
const PREMIUM_IMG = require('@/assets/images/home-premium.jpg');

// Placeholder learner name for the prototype greeting.
const USER_NAME = 'Aydın';

const LEVELS: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: number;
  color: string;
}[] = [
  { icon: 'sprout', label: 'Başlangıç', value: 4, color: '#34D399' },
  { icon: 'star', label: 'Orta', value: 12, color: '#FBBF24' },
  { icon: 'rocket-launch', label: 'İleri', value: 6, color: '#C084FC' },
];

// Extra detail shown in the "Kelime Seviyelerin" info sheet (CEFR ranges).
const LEVEL_INFO: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  range: string;
  desc: string;
  color: string;
}[] = [
  { icon: 'sprout', label: 'Başlangıç', range: 'A1-A2', desc: 'A1-A2 seviye kelimeleri', color: '#34D399' },
  { icon: 'star', label: 'Orta', range: 'B1-B2', desc: 'B1-B2 seviye kelimeleri', color: '#FBBF24' },
  { icon: 'rocket-launch', label: 'İleri', range: 'C1-C2', desc: 'C1-C2 seviye kelimeleri', color: '#C084FC' },
];

const RECENT_CHIPS = ['eat', 'love', 'like', 'travel', 'window'];

const HINTS = [
  ['love', 'sevmek', 'I love you'],
  ['travel', 'seyahat', 'I love to travel'],
  ['dream', 'hayal', 'Follow your dream'],
  ['coffee', 'kahve', 'I need a coffee'],
];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [levelInfoOpen, setLevelInfoOpen] = useState(false);

  // Two-tone wordmark (placeholder split; APP_NAME stays the single source).
  const half = Math.ceil(APP_NAME.length / 2);
  const brandHead = APP_NAME.slice(0, half);
  const brandTail = APP_NAME.slice(half);

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 44) + 10, paddingBottom: 10 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Logo showName={false} size={18} />
          </View>
          <Text style={[styles.brand, { color: colors.foreground }]}>
            {brandHead}
            <Text style={{ color: colors.primary }}>{brandTail}</Text>
          </Text>
          <Pressable
            onPress={() => router.push('/profile')}
            style={[
              styles.iconCircle,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="user" size={19} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Greeting */}
        <GlowCard padded={false} style={styles.greetCard}>
          <Image source={IMAGES.nature} style={styles.greetImg} />
          <LinearGradient
            colors={[colors.card, colors.card, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.greetContent}>
            <Text style={[styles.greetHi, { color: colors.foreground }]}>
              Merhaba {USER_NAME} 👋
            </Text>
            <Text style={[styles.greetSub, { color: colors.mutedForeground }]}>
              Bugün öğrenmeye hazırsın.
            </Text>
          </View>
        </GlowCard>

        {/* Levels + recent words */}
        <View style={styles.row}>
          <GlowCard style={styles.rowCardWide}>
            <Pressable
              style={styles.levelHead}
              onPress={() => setLevelInfoOpen(true)}
              hitSlop={8}
            >
              <Text
                style={[styles.cardHeadText, { color: colors.foreground }]}
                numberOfLines={1}
              >
                Kelime Seviyelerin
              </Text>
              <Feather name="info" size={14} color={colors.mutedForeground} />
            </Pressable>
            <View style={styles.levels}>
              {LEVELS.map((l) => (
                <View
                  key={l.label}
                  style={[
                    styles.levelTile,
                    { backgroundColor: colors.secondary, borderColor: colors.border },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={l.icon}
                    size={16}
                    color={l.color}
                  />
                  <Text
                    style={[styles.levelLabel, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {l.label}
                  </Text>
                  <Text style={[styles.levelValue, { color: l.color }]}>
                    {l.value}
                  </Text>
                </View>
              ))}
            </View>
          </GlowCard>

          <GlowCard style={styles.rowCard}>
            <Pressable
              style={styles.cardHead}
              onPress={() => router.push('/recent-words')}
            >
              <Text
                style={[styles.cardHeadText, { color: colors.foreground }]}
                numberOfLines={1}
              >
                Son Öğrenilen Kelimeler
              </Text>
              <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
            </Pressable>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {RECENT_CHIPS.map((c) => (
                <View
                  key={c}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.secondary, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.chipText, { color: colors.accent }]}>{c}</Text>
                </View>
              ))}
            </ScrollView>
          </GlowCard>
        </View>

        {/* Search */}
        <Pressable onPress={() => router.push('/explore')}>
          <View
            style={[
              styles.search,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
                shadowColor: colors.primaryGlow,
              },
            ]}
          >
            <View
              style={[styles.searchIcon, { borderColor: colors.primary }]}
            >
              <Feather name="search" size={17} color={colors.primary} />
            </View>
            <SearchHint />
          </View>
        </Pressable>

        {/* Feature carousel */}
        <FeatureCarousel onPress={() => router.push('/words-info')} />

        {/* AI sentence fix */}
        <GlowCard style={styles.aiCard}>
          <View style={styles.aiHead}>
            <Feather name="zap" size={15} color={colors.accent} />
            <Text style={[styles.aiHeadText, { color: colors.foreground }]}>
              AI ile cümle düzelt
            </Text>
          </View>
          <View style={styles.aiRow}>
            <View
              style={[
                styles.aiPill,
                {
                  backgroundColor: 'rgba(248,113,113,0.12)',
                  borderColor: 'rgba(248,113,113,0.4)',
                },
              ]}
            >
              <Text style={[styles.aiPillText, { color: '#FCA5A5' }]}>
                I you love
              </Text>
            </View>
            <Feather name="arrow-right" size={18} color={colors.primary} />
            <View
              style={[
                styles.aiPill,
                {
                  backgroundColor: 'rgba(52,211,153,0.14)',
                  borderColor: 'rgba(52,211,153,0.45)',
                },
              ]}
            >
              <Text style={[styles.aiPillText, { color: '#6EE7B7' }]}>
                I love you
              </Text>
              <Feather name="check-circle" size={15} color={colors.success} />
            </View>
          </View>
        </GlowCard>

        {/* Story suggestion + word network */}
        <View style={styles.row}>
          <GlowCard padded={false} style={styles.storyCard}>
            <Image
              source={STORY_IMG}
              resizeMode="cover"
              style={StyleSheet.absoluteFill as never}
            />
            <LinearGradient
              colors={['rgba(11,7,19,0.9)', 'rgba(11,7,19,0.45)', 'transparent']}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <Pressable
              style={styles.storyContent}
              onPress={() => router.push('/stories')}
            >
              <View style={styles.storyTop}>
                <View style={styles.miniHead}>
                  <MaterialCommunityIcons
                    name="star-four-points"
                    size={14}
                    color={colors.accent}
                  />
                  <Text style={styles.miniHeadText}>Yeni Hikâye Önerisi</Text>
                </View>
                <Text style={styles.storyBody}>
                  Aşk temasında yeni bir hikâye hazırlandı.
                </Text>
              </View>
              <View
                style={[
                  styles.storyBtn,
                  { backgroundColor: 'rgba(255,255,255,0.1)' },
                ]}
              >
                <Text style={styles.storyBtnText}>Hikâyeye Git</Text>
                <Feather name="chevron-right" size={14} color="#FFFFFF" />
              </View>
            </Pressable>
          </GlowCard>

          <GlowCard style={styles.netCard}>
            <Text
              style={[styles.netTitle, { color: colors.foreground }]}
              numberOfLines={1}
            >
              Canlı Kelime Ağı
            </Text>
            <WordNetwork />
            <Pressable
              onPress={() => router.push('/word-network')}
              style={[
                styles.storyBtn,
                { backgroundColor: 'rgba(255,255,255,0.1)' },
              ]}
            >
              <Text style={styles.storyBtnText} numberOfLines={1}>
                Kelime Ağını Gör
              </Text>
              <Feather name="chevron-right" size={14} color="#FFFFFF" />
            </Pressable>
          </GlowCard>
        </View>

        {/* Premium */}
        <Pressable onPress={() => router.push('/profile')}>
          <GlowCard padded={false} style={styles.premiumCard}>
            <Image source={PREMIUM_IMG} style={styles.premiumImg} />
            <LinearGradient
              colors={[colors.card, colors.card, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.premiumContent}>
              <View style={styles.miniHead}>
                <Text style={styles.crown}>👑</Text>
                <Text style={[styles.premiumTitle, { color: colors.foreground }]}>
                  Premium farklarını keşfet ✦
                </Text>
              </View>
              <View
                style={[
                  styles.premiumBadge,
                  {
                    backgroundColor: 'rgba(139,92,246,0.16)',
                    borderColor: 'rgba(139,92,246,0.5)',
                  },
                ]}
              >
                <Feather name="lock" size={9} color={colors.accent} />
                <Text style={[styles.premiumBadgeText, { color: colors.accent }]}>
                  Üyelere Özel
                </Text>
              </View>
              <Text style={[styles.premiumDesc, { color: colors.mutedForeground }]}>
                Sınırsız hikâye, gelişmiş WordDNA ve özel tekrar planları.
              </Text>
            </View>
            <View style={styles.inceleWrap} pointerEvents="none">
              <View style={[styles.incele, { backgroundColor: colors.primary }]}>
                <Feather name="lock" size={13} color="#FFFFFF" />
                <Text style={styles.inceleText}>İncele</Text>
              </View>
            </View>
          </GlowCard>
        </Pressable>
      </ScrollView>

      <Modal
        visible={levelInfoOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setLevelInfoOpen(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setLevelInfoOpen(false)}
        >
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: insets.bottom + 22,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[styles.sheetGrabber, { backgroundColor: colors.borderStrong }]}
            />
            {/* Scrollable so large system font sizes can't push the level
                rows off-screen with no way to reach them (WL-009) — at
                normal text size this scrolls nowhere and looks identical. */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.sheetHeadRow}>
                <View
                  style={[styles.sheetIcon, { backgroundColor: colors.secondary }]}
                >
                  <Feather name="bar-chart-2" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  Kelime Seviyelerin
                </Text>
              </View>

              <Text style={[styles.sheetIntro, { color: colors.mutedForeground }]}>
                Öğrendiğin kelimelerin statüsünü buradan takip edebilirsin.
              </Text>

              <Text style={[styles.sheetSubtitle, { color: colors.foreground }]}>
                Kelime Seviyeleri Nasıl Belirlenir?
              </Text>

              <View style={styles.sheetLevels}>
                {LEVEL_INFO.map((l) => (
                  <View
                    key={l.label}
                    style={[
                      styles.sheetLevelRow,
                      { backgroundColor: colors.secondary, borderColor: colors.border },
                    ]}
                  >
                    <MaterialCommunityIcons name={l.icon} size={20} color={l.color} />
                    <View style={styles.sheetLevelTextWrap}>
                      <Text
                        style={[styles.sheetLevelLabel, { color: colors.foreground }]}
                      >
                        {l.label}
                      </Text>
                      <Text
                        style={[
                          styles.sheetLevelDesc,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {l.desc}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.sheetRangeBadge,
                        { backgroundColor: l.color + '22', borderColor: l.color + '55' },
                      ]}
                    >
                      <Text style={[styles.sheetRangeText, { color: l.color }]}>
                        {l.range}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </GradientBackground>
  );
}

function SearchHint() {
  const colors = useColors();
  const [i, setI] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start(() => {
        setI((p) => (p + 1) % HINTS.length);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }).start();
      });
    }, 2600);
    return () => clearInterval(id);
  }, [opacity]);

  const h = HINTS[i];
  return (
    <Animated.View style={[styles.hint, { opacity }]}>
      <Text style={[styles.hintWord, { color: colors.foreground }]}>{h[0]}</Text>
      <Text style={[styles.hintDot, { color: colors.primary }]}>•</Text>
      <Text style={[styles.hintMuted, { color: colors.mutedForeground }]}>{h[1]}</Text>
      <Text style={[styles.hintDot, { color: colors.primary }]}>•</Text>
      <Text
        style={[styles.hintMuted, { color: colors.mutedForeground }]}
        numberOfLines={1}
      >
        {h[2]}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    gap: 4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginBottom: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
    fontSize: 23,
    letterSpacing: 0.3,
  },
  greetCard: {
    overflow: 'hidden',
    minHeight: 82,
    justifyContent: 'center',
  },
  greetImg: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '46%',
    height: '100%',
  },
  greetContent: {
    padding: 12,
    paddingRight: 130,
    gap: 2,
  },
  greetHi: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  greetSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  rowCard: {
    flex: 1,
    padding: 10,
  },
  rowCardWide: {
    flex: 0.85,
    padding: 10,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 8,
  },
  cardHeadText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10.5,
    flexShrink: 1,
  },
  levelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
    maxHeight: '85%',
  },
  sheetGrabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  sheetIntro: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  sheetSubtitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginTop: 2,
  },
  sheetLevels: {
    gap: 10,
  },
  sheetLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  sheetLevelTextWrap: {
    flex: 1,
    gap: 2,
  },
  sheetLevelLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  sheetLevelDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
  },
  sheetRangeBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sheetRangeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  levels: {
    flexDirection: 'row',
    gap: 5,
  },
  levelTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 1,
    gap: 3,
    alignItems: 'center',
  },
  levelLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 8,
    letterSpacing: -0.2,
  },
  levelValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
  },
  chips: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 5,
  },
  searchIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintWord: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  hintDot: {
    fontSize: 13,
  },
  hintMuted: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    flexShrink: 1,
  },
  aiCard: {
    gap: 9,
    padding: 12,
  },
  aiHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  aiHeadText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  aiPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  storyCard: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 96,
    overflow: 'hidden',
  },
  storyContent: {
    flex: 1,
    padding: 12,
    paddingRight: 18,
    paddingBottom: 7,
    justifyContent: 'space-between',
  },
  storyTop: {
    gap: 5,
  },
  miniHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniHeadText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13.5,
    color: '#E9D5FF',
  },
  storyBody: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  storyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 3,
  },
  storyBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  netCard: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    padding: 10,
    paddingBottom: 7,
  },
  netTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13.5,
    marginBottom: 5,
  },
  premiumCard: {
    overflow: 'hidden',
    minHeight: 74,
    justifyContent: 'center',
  },
  premiumImg: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '52%',
    height: '100%',
  },
  premiumContent: {
    padding: 10,
    paddingRight: 118,
    gap: 2,
  },
  crown: {
    fontSize: 16,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  premiumBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 0.3,
  },
  premiumTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    flexShrink: 1,
  },
  premiumDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    lineHeight: 15,
  },
  inceleWrap: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  incele: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 9,
    borderRadius: 20,
  },
  inceleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
