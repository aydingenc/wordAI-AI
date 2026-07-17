import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { GradientBackground } from '@/components/GradientBackground';
import { ReviewCountSheet } from '@/components/ReviewCountSheet';
import { ClearIcon, PersonIcon, SparkleIcon } from '@/components/WordStatusIcons';
import { NETWORK_THEMES } from '@/app/word-network';
import {
  ALL_WORD_ENTRIES,
  WORD_LEVEL_META,
  WordLevelKey,
  wordsByLevel,
  wordsByStatus,
  wordsByType,
} from '@/data/mock';
import { useColors } from '@/hooks/useColors';

type TintKey = 'violet' | 'blue' | 'pink' | 'green' | 'amber' | 'teal';

const TINTS: Record<TintKey, { from: string; border: string; iconBg: string; iconColor: string }> = {
  violet: { from: 'rgba(139,92,246,0.16)', border: 'rgba(139,92,246,0.3)', iconBg: 'rgba(139,92,246,0.2)', iconColor: '#c4b5fd' },
  blue: { from: 'rgba(96,165,250,0.14)', border: 'rgba(96,165,250,0.3)', iconBg: 'rgba(96,165,250,0.2)', iconColor: '#60a5fa' },
  pink: { from: 'rgba(244,114,182,0.14)', border: 'rgba(244,114,182,0.3)', iconBg: 'rgba(244,114,182,0.2)', iconColor: '#f472b6' },
  green: { from: 'rgba(74,222,128,0.14)', border: 'rgba(74,222,128,0.3)', iconBg: 'rgba(74,222,128,0.2)', iconColor: '#4ade80' },
  amber: { from: 'rgba(250,204,21,0.14)', border: 'rgba(250,204,21,0.3)', iconBg: 'rgba(250,204,21,0.2)', iconColor: '#facc15' },
  teal: { from: 'rgba(45,212,191,0.14)', border: 'rgba(45,212,191,0.3)', iconBg: 'rgba(45,212,191,0.2)', iconColor: '#2dd4bf' },
};

/** Same order as NETWORK_THEMES (Canlı Kelime Ağı) — one tint per topic. */
const THEME_TINTS: TintKey[] = [
  'violet', 'pink', 'amber', 'blue', 'green', 'teal', 'blue', 'green',
  'pink', 'pink', 'amber', 'teal', 'violet', 'blue', 'green', 'amber',
];

const THEME_PAGE_SIZE = 4;
const THEME_TOTAL_PAGES = Math.ceil(NETWORK_THEMES.length / THEME_PAGE_SIZE);

const LEVEL_TINTS: Record<WordLevelKey, TintKey> = {
  beginner: 'violet',
  intermediate: 'pink',
  advanced: 'blue',
};

const STATUS_TINTS = { new: 'violet', learning: 'amber', mastered: 'green' } as const;
const TYPE_TINTS: Record<'verb' | 'adverb' | 'noun' | 'adjective' | 'pronoun', TintKey> = {
  verb: 'violet',
  adverb: 'blue',
  noun: 'pink',
  adjective: 'teal',
  pronoun: 'blue',
};

/** Per-topic thin-line glyph, in the same 16-item order as NETWORK_THEMES. */
function ThemeGlyph({ index, size = 12, color }: { index: number; size?: number; color: string }) {
  const p = { stroke: color, strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
  switch (index) {
    case 0:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Rect x={4} y={5} width={8} height={9} rx={1} {...p} />
          <Path d="M6 5V3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5V5" {...p} />
        </Svg>
      );
    case 1:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Circle cx={8} cy={8} r={6} {...p} />
          <Path d="M6 6h.01M10 6h.01M6 10c.7.7 1.3 1 2 1s1.3-.3 2-1" {...p} />
        </Svg>
      );
    case 2:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Circle cx={8} cy={8} r={6} {...p} />
          <Circle cx={6} cy={6} r={0.8} fill={color} />
          <Circle cx={10} cy={6} r={0.8} fill={color} />
          <Circle cx={6} cy={10} r={0.8} fill={color} />
        </Svg>
      );
    case 3:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M4 14V3l7 2-7 2" {...p} />
        </Svg>
      );
    case 4:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M3 13c6 1 10-3 10-10-7 0-10 4-10 10z" {...p} />
        </Svg>
      );
    case 5:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M4 7h8v3a4 4 0 0 1-4 4 4 4 0 0 1-4-4V7z" {...p} />
          <Path d="M12 8h1.5a1.5 1.5 0 0 1 0 3H12" {...p} />
        </Svg>
      );
    case 6:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Rect x={2} y={5} width={12} height={8} rx={1.5} {...p} />
          <Path d="M6 5V4a2 2 0 0 1 4 0v1" {...p} />
        </Svg>
      );
    case 7:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M8 14s-5-3.2-5-7a3 3 0 0 1 5-2.2A3 3 0 0 1 13 7c0 3.8-5 7-5 7z" {...p} />
          <Path d="M6.5 7h1v-1.5h1V7h1v1h-1v1.5h-1V8h-1z" {...p} />
        </Svg>
      );
    case 8:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path
            d="M8 13.5s-5.5-3.4-5.5-7.2C2.5 4 4.2 2.5 6.2 2.5c1.1 0 2.1.5 2.8 1.3.7-.8 1.7-1.3 2.8-1.3 2 0 3.7 1.5 3.7 3.8 0 3.8-5.5 7.2-5.5 7.2z"
            fill={color}
          />
        </Svg>
      );
    case 9:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Circle cx={5.5} cy={6} r={2} {...p} />
          <Circle cx={10.5} cy={6} r={2} {...p} />
          <Path d="M2.5 14c0-2.5 1.5-4 3.5-4M13.5 14c0-2.5-1.5-4-3.5-4" {...p} />
        </Svg>
      );
    case 10:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M5 2v5M7 2v5M5 7c0 3 0 7 2 7s2-4 2-7" {...p} />
          <Path d="M11 2v12" {...p} />
        </Svg>
      );
    case 11:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M6 2h4M6.5 2v4.5L3 12c-.5.9.2 2 1.2 2h7.6c1 0 1.7-1.1 1.2-2l-3.5-5.5V2" {...p} />
        </Svg>
      );
    case 12:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Rect x={4} y={4} width={8} height={8} rx={1.5} {...p} />
          <Path d="M8 1v2M8 13v2M1 8h2M13 8h2" {...p} />
        </Svg>
      );
    case 13:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M4 5h8l-1 8H5L4 5z" {...p} />
          <Path d="M6 5V4a2 2 0 0 1 4 0v1" {...p} />
        </Svg>
      );
    case 14:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Circle cx={8} cy={8} r={6} {...p} />
          <Path d="M8 2v12M2 8h12M4 4l8 8M12 4l-8 8" {...p} />
        </Svg>
      );
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M2 5.5L8 3l6 2.5L8 8 2 5.5z" {...p} />
          <Path d="M4.5 6.7V10c0 1 1.5 2 3.5 2s3.5-1 3.5-2V6.7" {...p} />
        </Svg>
      );
  }
}

function LevelGlyph({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 13V8M8 13V4M13 13V6" />
    </Svg>
  );
}

function TagGlyph({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 7l5-5h5.5A1.5 1.5 0 0 1 14 3.5V9l-5 5-7-7z" />
      <Circle cx={5.5} cy={5.5} r={1} />
    </Svg>
  );
}

function NotesGlyph({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={2} y={3} width={12} height={10} rx={1.5} />
      <Path d="M5 6.5h6M5 9.5h4" />
    </Svg>
  );
}

function PartialCircleGlyph({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeDasharray="2 2">
      <Circle cx={8} cy={8} r={5.5} />
    </Svg>
  );
}

function CheckCircleGlyph({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={8} cy={8} r={5.5} />
      <Path d="M5.5 8l1.8 1.8 3.2-3.6" />
    </Svg>
  );
}

function SparkleGlyph({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M8 1.8l1.1 3.9 3.9 1.1-3.9 1.1L8 11.8l-1.1-3.9-3.9-1.1 3.9-1.1L8 1.8z" fill={color} />
    </Svg>
  );
}

function VerbGlyph({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 13l4-4M7 9l3-6M10 3h3v3" />
    </Svg>
  );
}

function AdverbGlyph({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 5l4 3-4 3zM8 5l4 3-4 3z" />
    </Svg>
  );
}

function StarGlyph({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M8 1.8l1.7 4.4 4.6.4-3.5 3 1.1 4.5L8 11.6l-4 2.5 1.1-4.5-3.5-3 4.6-.4L8 1.8z" fill={color} />
    </Svg>
  );
}

function SpeechBubbleGlyph({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 3h12v7H6l-3 3v-3H2V3z" />
    </Svg>
  );
}

function NetworkGlyph({ color, size = 19 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={8} cy={8} r={2} />
      <Circle cx={3} cy={4} r={1.2} />
      <Circle cx={13} cy={4} r={1.2} />
      <Circle cx={3} cy={12} r={1.2} />
      <Circle cx={13} cy={12} r={1.2} />
      <Path d="M6.5 6.7L4 4.8M9.5 6.7L12 4.8M6.5 9.3L4 11.2M9.5 9.3L12 11.2" />
    </Svg>
  );
}

const ALL_COUNT = ALL_WORD_ENTRIES.length;
const ESTIMATED_MINUTES = Math.max(1, Math.round(ALL_COUNT * 0.25));

export default function WordCardsHubScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [themePage, setThemePage] = useState(0);
  const [rulesOpen, setRulesOpen] = useState(false);

  const openPractice = (source: string, value?: string) => {
    router.push({ pathname: '/flashcards-practice', params: value ? { source, value } : { source } });
  };

  const pageThemes = NETWORK_THEMES.slice(themePage * THEME_PAGE_SIZE, themePage * THEME_PAGE_SIZE + THEME_PAGE_SIZE);

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: 'rgba(255,255,255,0.1)' }]}>
            <Feather name="chevron-left" size={13} color={colors.mutedForeground} />
          </Pressable>
          <View style={styles.headerTitleRow}>
            <SparkleIcon size={12} color={colors.accent} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
              Kelime Kartları
            </Text>
            <SparkleIcon size={12} color={colors.accent} />
          </View>
        </View>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          Kelime kartlarıyla hızlı tekrar yap ve öğrendiklerini güçlendir.
        </Text>

        <LinearGradient
          colors={['rgba(139,92,246,0.22)', 'rgba(88,58,168,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderColor: 'rgba(139,92,246,0.38)' }]}
        >
          <View style={styles.heroStack}>
            <View style={[styles.stackCard, styles.stackCardC1]} />
            <View style={[styles.stackCard, styles.stackCardC2]} />
            <View style={[styles.stackCard, styles.stackCardC3]}>
              <Text style={styles.stackWord}>journey</Text>
              <Text style={styles.stackType}>noun</Text>
              <Text style={styles.stackDef}>a long trip or experience</Text>
            </View>
          </View>
          <View style={styles.heroInfo}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Tüm kelime kartlarını çalış</Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              Bu zamana kadar öğrendiğin tüm kelimeleri kartlarla tekrar et.
            </Text>
            <Pressable onPress={() => openPractice('all')} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1, alignSelf: 'flex-start' })}>
              <LinearGradient colors={['#a78bfa', '#7c3aed']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBtn}>
                <Text style={styles.heroBtnText}>Başla</Text>
                <Feather name="chevron-right" size={13} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Feather name="layers" size={12} color={colors.accent} />
                <Text style={[styles.heroStatText, { color: colors.mutedForeground }]}>Toplam {ALL_COUNT} kart</Text>
              </View>
              <View style={styles.heroStat}>
                <Feather name="clock" size={12} color={colors.accent} />
                <Text style={[styles.heroStatText, { color: colors.mutedForeground }]}>Tahmini {ESTIMATED_MINUTES} dk</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <SectionHead icon={<LevelGlyph color={colors.accent} />} title="Seviyene göre çalış" />
        <View style={styles.levelRow}>
          {(['beginner', 'intermediate', 'advanced'] as WordLevelKey[]).map((level) => {
            const meta = WORD_LEVEL_META[level];
            const tint = TINTS[LEVEL_TINTS[level]];
            const count = wordsByLevel(level).length;
            return (
              <Pressable
                key={level}
                onPress={() => openPractice('level', level)}
                style={({ pressed }) => [styles.levelCardWrap, { opacity: pressed ? 0.9 : 1 }]}
              >
                <LinearGradient
                  colors={[tint.from, 'rgba(19,17,32,0.6)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.miniCard, styles.levelCard, { borderColor: tint.border }]}
                >
                  <Text style={[styles.levelLabel, { color: colors.foreground }]}>{meta.label}</Text>
                  <Text style={[styles.levelCode, { color: colors.foreground }]}>{meta.code}</Text>
                  <Text style={[styles.miniSub, { color: colors.mutedForeground }]}>{count} kart</Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>

        <SectionHead icon={<TagGlyph color={colors.accent} />} title="Temalara göre çalış" />
        <View style={styles.themeGrid}>
          {pageThemes.map((theme, i) => {
            const globalIndex = themePage * THEME_PAGE_SIZE + i;
            const tint = TINTS[THEME_TINTS[globalIndex]];
            const displayName = theme.name;
            return (
              <Pressable
                key={theme.name}
                onPress={() => openPractice('theme', theme.name)}
                style={({ pressed }) => [styles.themeCardWrap, { opacity: pressed ? 0.9 : 1 }]}
              >
                <LinearGradient
                  colors={[tint.from, 'rgba(19,17,32,0.6)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.miniCard, styles.themeCard, { borderColor: tint.border }]}
                >
                  <View style={[styles.rcIconWrap, { backgroundColor: tint.iconBg, borderColor: tint.iconColor, shadowColor: tint.iconColor }]}>
                    <ThemeGlyph index={globalIndex} color={tint.iconColor} />
                  </View>
                  <View style={styles.rcTextCol}>
                    <Text style={[styles.rcTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={[styles.rcSub, { color: colors.mutedForeground }]}>{theme.words.length} kart</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.themePager}>
          <Pressable
            disabled={themePage === 0}
            onPress={() => setThemePage((p) => Math.max(0, p - 1))}
            style={[styles.themeArrow, { borderColor: 'rgba(139,92,246,0.28)' }, themePage === 0 && styles.themeArrowDisabled]}
          >
            <Feather name="chevron-left" size={13} color={colors.accent} />
          </Pressable>
          <View style={styles.themeDots}>
            {Array.from({ length: THEME_TOTAL_PAGES }, (_, i) => (
              <View key={i} style={[styles.themeDot, i === themePage && styles.themeDotActive]} />
            ))}
          </View>
          <Pressable
            disabled={themePage === THEME_TOTAL_PAGES - 1}
            onPress={() => setThemePage((p) => Math.min(THEME_TOTAL_PAGES - 1, p + 1))}
            style={[styles.themeArrow, { borderColor: 'rgba(139,92,246,0.28)' }, themePage === THEME_TOTAL_PAGES - 1 && styles.themeArrowDisabled]}
          >
            <Feather name="chevron-right" size={13} color={colors.accent} />
          </Pressable>
        </View>

        <View style={styles.sectHeadRow}>
          <View style={styles.sectTitleRow}>
            <ClearIcon size={14} color={colors.accent} />
            <Text style={[styles.sectTitle, { color: colors.foreground }]}>Review Count&apos;a Göre Çalış</Text>
            <Pressable
              onPress={() => setRulesOpen(true)}
              hitSlop={8}
              style={[styles.infoBtn, { backgroundColor: 'rgba(139,92,246,0.16)', borderColor: 'rgba(139,92,246,0.4)' }]}
            >
              <Text style={[styles.infoBtnText, { color: colors.accent }]}>i</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.rcGrid}>
          <StatusCard
            tint={TINTS[STATUS_TINTS.new]}
            icon={<SparkleGlyph color={TINTS[STATUS_TINTS.new].iconColor} />}
            title="Yeni"
            sub="Henüz oturmadı"
            count={wordsByStatus('new').length}
            onPress={() => openPractice('status', 'new')}
          />
          <StatusCard
            tint={TINTS[STATUS_TINTS.learning]}
            icon={<PartialCircleGlyph color={TINTS[STATUS_TINTS.learning].iconColor} />}
            title="Öğreniliyor"
            sub="Pekişiyor"
            count={wordsByStatus('learning').length}
            onPress={() => openPractice('status', 'learning')}
          />
          <StatusCard
            tint={TINTS[STATUS_TINTS.mastered]}
            icon={<CheckCircleGlyph color={TINTS[STATUS_TINTS.mastered].iconColor} />}
            title="Mastered"
            sub="Kalıcı oldu"
            count={wordsByStatus('mastered').length}
            onPress={() => openPractice('status', 'mastered')}
          />
        </View>

        <SectionHead icon={<NotesGlyph color={colors.accent} />} title="Kelime türüne göre çalış" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.wordTypeScroll}
        >
          <WordTypeCard tint={TINTS[TYPE_TINTS.verb]} icon={<VerbGlyph color={TINTS[TYPE_TINTS.verb].iconColor} />} title="Fiiller" count={wordsByType('verb').length} onPress={() => openPractice('type', 'verb')} />
          <WordTypeCard tint={TINTS[TYPE_TINTS.adverb]} icon={<AdverbGlyph color={TINTS[TYPE_TINTS.adverb].iconColor} />} title="Zarflar" count={wordsByType('adverb').length} onPress={() => openPractice('type', 'adverb')} />
          <WordTypeCard tint={TINTS[TYPE_TINTS.noun]} icon={<PersonIcon size={14} color={TINTS[TYPE_TINTS.noun].iconColor} />} title="İsimler" count={wordsByType('noun').length} onPress={() => openPractice('type', 'noun')} />
          <WordTypeCard tint={TINTS[TYPE_TINTS.adjective]} icon={<StarGlyph color={TINTS[TYPE_TINTS.adjective].iconColor} />} title="Sıfatlar" count={wordsByType('adjective').length} onPress={() => openPractice('type', 'adjective')} />
          <WordTypeCard tint={TINTS[TYPE_TINTS.pronoun]} icon={<SpeechBubbleGlyph color={TINTS[TYPE_TINTS.pronoun].iconColor} />} title="Zamirler" count={wordsByType('pronoun').length} onPress={() => openPractice('type', 'pronoun')} />
        </ScrollView>

        <Pressable onPress={() => router.push('/create')} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
          <LinearGradient
            colors={['rgba(139,92,246,0.16)', 'rgba(76,50,150,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.aiBox, { borderColor: 'rgba(139,92,246,0.38)' }]}
          >
            <View style={[styles.aiIcon, { borderColor: 'rgba(139,92,246,0.3)' }]}>
              <NetworkGlyph color={colors.accent} />
            </View>
            <Text style={[styles.aiText, { color: colors.mutedForeground }]}>
              <Text style={[styles.aiTextBold, { color: colors.foreground }]}>AI Tavsiyesi: </Text>
              Bilemediğin ve pekiştirmek istediğin kelimelerden yeni hikâyeler türet; böylece kelimeleri farklı
              bağlamlarda görerek kalıcılıklarını artır.
            </Text>
            <View style={[styles.aiArrow, { borderColor: 'rgba(255,255,255,0.1)' }]}>
              <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
            </View>
          </LinearGradient>
        </Pressable>
      </ScrollView>

      <ReviewCountSheet visible={rulesOpen} onClose={() => setRulesOpen(false)} />
    </GradientBackground>
  );
}

function SectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectHeadRow}>
      <View style={styles.sectTitleRow}>
        {icon}
        <Text style={[styles.sectTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
    </View>
  );
}

function StatusCard({
  tint,
  icon,
  title,
  sub,
  count,
  onPress,
}: {
  tint: { from: string; border: string; iconBg: string; iconColor: string };
  icon: React.ReactNode;
  title: string;
  sub: string;
  count: number;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.rcCardWrap, { opacity: pressed ? 0.9 : 1 }]}>
      <LinearGradient
        colors={[tint.from, 'rgba(19,17,32,0.6)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.miniCard, styles.rcCard, { borderColor: tint.border }]}
      >
        <View style={[styles.rcIconWrap, styles.rcIconWrapSmall, { backgroundColor: tint.iconBg, borderColor: tint.iconColor, shadowColor: tint.iconColor }]}>
          {icon}
        </View>
        <View style={[styles.rcTextCol, styles.rcTextColTight]}>
          <Text
            style={[styles.rcTitle, { color: colors.foreground }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {title}
          </Text>
          <Text style={[styles.rcSub, { color: colors.mutedForeground }]}>{sub}</Text>
          <Text style={[styles.rcCount, { color: colors.mutedForeground }]}>{count} kart</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function WordTypeCard({
  tint,
  icon,
  title,
  count,
  onPress,
}: {
  tint: { from: string; border: string; iconBg: string; iconColor: string };
  icon: React.ReactNode;
  title: string;
  count: number;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <LinearGradient
        colors={[tint.from, 'rgba(19,17,32,0.6)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.miniCard, styles.wtCard, { borderColor: tint.border }]}
      >
        <View style={[styles.rcIconWrap, { backgroundColor: tint.iconBg, borderColor: tint.iconColor, shadowColor: tint.iconColor, alignSelf: 'center' }]}>
          {icon}
        </View>
        <Text style={[styles.rcTitle, styles.wtTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.rcSub, styles.wtSub, { color: colors.mutedForeground }]}>{count} kart</Text>
      </LinearGradient>
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
    paddingHorizontal: 42,
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  headerTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 17,
  },
  headerSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 22,
  },

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 22,
  },
  heroStack: {
    width: 78,
    height: 88,
    flexShrink: 0,
  },
  stackCard: {
    position: 'absolute',
    width: 70,
    height: 82,
    borderRadius: 12,
    backgroundColor: '#1a1230',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.4)',
  },
  stackCardC1: { top: 6, left: 0, opacity: 0.6, transform: [{ rotate: '-8deg' }] },
  stackCardC2: { top: 3, left: 4, opacity: 0.8, transform: [{ rotate: '-3deg' }] },
  stackCardC3: { top: 0, left: 8, alignItems: 'center', justifyContent: 'center', padding: 8 },
  stackWord: { fontFamily: 'Fraunces_700Bold', fontSize: 14, color: '#FFFFFF' },
  stackType: { fontFamily: 'Inter_400Regular', fontStyle: 'italic', fontSize: 8, color: '#b39dfb', marginVertical: 3 },
  stackDef: { fontFamily: 'Inter_400Regular', fontSize: 6.5, color: '#6f6685', textAlign: 'center', lineHeight: 8.5 },

  heroInfo: { flex: 1, minWidth: 0 },
  heroTitle: { fontFamily: 'Fraunces_700Bold', fontSize: 15, marginBottom: 4 },
  heroSub: { fontFamily: 'Inter_400Regular', fontSize: 10.5, lineHeight: 14.5, marginBottom: 10 },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 11,
  },
  heroBtnText: { fontFamily: 'Inter_700Bold', fontSize: 11.5, color: '#FFFFFF' },
  heroStats: { flexDirection: 'row', gap: 14, marginTop: 12 },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroStatText: { fontFamily: 'Inter_400Regular', fontSize: 10 },

  sectHeadRow: {
    marginBottom: 11,
  },
  sectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 13,
  },
  infoBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  infoBtnText: {
    fontFamily: 'Fraunces_700Bold',
    fontStyle: 'italic',
    fontSize: 10,
  },

  miniCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },

  levelRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 22,
  },
  levelCardWrap: {
    flex: 1,
    minWidth: 0,
  },
  levelCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  levelLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, marginBottom: 2 },
  levelCode: { fontFamily: 'Fraunces_700Bold', fontSize: 14, marginBottom: 3 },
  miniSub: { fontFamily: 'Inter_400Regular', fontSize: 9 },

  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 2,
  },
  themeCardWrap: {
    width: '47.5%',
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },

  themePager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 2,
    marginBottom: 22,
  },
  themeArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(139,92,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeArrowDisabled: { opacity: 0.25 },
  themeDots: { flexDirection: 'row', gap: 6 },
  themeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#6f6685', opacity: 0.35 },
  themeDotActive: { backgroundColor: '#b39dfb', opacity: 1, width: 14, borderRadius: 4 },

  rcGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  rcCardWrap: {
    flex: 1,
    minWidth: 0,
  },
  rcCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 9,
  },
  rcIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  rcTextCol: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    gap: 1,
    marginLeft: 10,
  },
  rcIconWrapSmall: {
    width: 26,
    height: 26,
    borderRadius: 7,
  },
  rcTextColTight: {
    marginLeft: 8,
  },
  rcTitle: { fontFamily: 'Inter_700Bold', fontSize: 10.5, marginBottom: 1 },
  rcSub: { fontFamily: 'Inter_400Regular', fontSize: 8.5 },
  rcCount: { fontFamily: 'Inter_700Bold', fontSize: 8.5, marginTop: 1 },

  wordTypeScroll: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 20,
  },
  wtCard: {
    width: 84,
    padding: 11,
    alignItems: 'center',
  },
  wtTitle: { fontSize: 10.5, textAlign: 'center', marginTop: 6, marginBottom: 2 },
  wtSub: { fontSize: 8.5, textAlign: 'center' },

  aiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderRadius: 17,
    padding: 13,
    marginBottom: 8,
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  aiText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 9.5,
    lineHeight: 14.5,
  },
  aiTextBold: {
    fontFamily: 'Fraunces_700Bold',
  },
  aiArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
