import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { WordListTable } from '@/components/WordListTable';
import { WordFilterSheet, ActiveFilter } from '@/components/WordFilterSheet';
import { PracticeSuggestionsPanel } from '@/components/PracticeSuggestionsPanel';
import { ReviewCountSheet } from '@/components/ReviewCountSheet';
import {
  AdjectiveIcon,
  AdverbIcon,
  BookIcon,
  hexToRgba,
  ImagesIcon,
  NounIcon,
  OwnWordsIcon,
  PronounIcon,
  ShieldIcon,
  SparkleIcon,
  ThemesIcon,
  VerbIcon,
} from '@/components/WordStatusIcons';
import { useColors } from '@/hooks/useColors';
import { ALL_WORD_ENTRIES, WordListEntry } from '@/data/mock';

type IconRenderer = (p: { size?: number; color?: string }) => React.JSX.Element;

interface StatCardSpec {
  key: string;
  title: string;
  value: string;
  description: string;
  tint: string;
  Icon: IconRenderer;
}

// Placeholder counts per spec — static until real word-history data replaces them.
const STATUS_STATS: StatCardSpec[] = [
  { key: 'new', title: 'Yeni Kelimeler', value: '42', description: 'Henüz yeterince farklı hikâyede geçmedi.', tint: '#8b5cf6', Icon: SparkleIcon },
  { key: 'learning', title: 'Öğreniliyor', value: '144', description: 'Birden fazla farklı hikâyede geçen kelimeler.', tint: '#facc15', Icon: BookIcon },
  { key: 'mastered', title: 'Mastered', value: '59', description: 'Çok sayıda farklı hikâyede geçen, kalıcı hafızaya yerleşen kelimeler.', tint: '#4ade80', Icon: ShieldIcon },
];

const TYPE_STATS: StatCardSpec[] = [
  { key: 'verb', title: 'Verb', value: '68', description: 'Eylem bildiren kelimeler.', tint: '#ff8a5c', Icon: VerbIcon },
  { key: 'noun', title: 'Noun', value: '54', description: 'Varlık ve nesne isimleri.', tint: '#38d4ff', Icon: NounIcon },
  { key: 'adjective', title: 'Adjective', value: '31', description: 'Niteleyen kelimeler.', tint: '#4ade80', Icon: AdjectiveIcon },
  { key: 'adverb', title: 'Adverb', value: '19', description: 'Fiili niteleyen kelimeler.', tint: '#fbbf24', Icon: AdverbIcon },
  { key: 'pronoun', title: 'Pronoun', value: '12', description: 'Zamirler.', tint: '#f472b6', Icon: PronounIcon },
];

const SOURCE_STATS: StatCardSpec[] = [
  { key: 'own', title: 'Kendi Kelimelerim', value: '120', description: 'Elle eklediğin kelimeler.', tint: '#60a5fa', Icon: OwnWordsIcon },
  { key: 'theme', title: 'Hazır Temalar', value: '85', description: 'Hazır temalardan gelenler.', tint: '#facc15', Icon: ThemesIcon },
  { key: 'image', title: 'Kendi Görsellerin', value: '40', description: 'Görsellerinden çıkarılanlar.', tint: '#4ade80', Icon: ImagesIcon },
];

export default function AllWordsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [rulesSheetOpen, setRulesSheetOpen] = useState(false);

  const handleWordPress = (_entry: WordListEntry) => {
    router.push('/word-network');
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={[styles.backBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Tüm Kelimelerim</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Bugüne kadar öğrendiğin tüm kelimeleri buradan arayıp filtreleyebilirsin.
          </Text>
        </View>

        <GlowCard style={styles.panel}>
          <Text style={[styles.panelTitle, { color: colors.accent }]}>Kelime Durumları</Text>
          <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
            Kelime haznenin öğrenme yolculuğu.
          </Text>
          <StatGrid cards={STATUS_STATS} />

          <View style={[styles.rulesPanel, { borderColor: 'rgba(139,92,246,0.18)' }]}>
            <View style={styles.rulesHeader}>
              <Text style={[styles.rulesTitle, { color: colors.foreground }]}>Durum Kuralları</Text>
              <Pressable
                onPress={() => setRulesSheetOpen(true)}
                style={[styles.rulesInfoBtn, { backgroundColor: 'rgba(139,92,246,0.16)', borderColor: 'rgba(139,92,246,0.35)' }]}
              >
                <Text style={[styles.rulesInfoText, { color: colors.accent }]}>i</Text>
              </Pressable>
            </View>

            <View style={styles.rulesRow}>
              <RuleStep label="Yeni" count="1-3" color="#c4b5fd" Icon={SparkleIcon} />
              <LinearGradient colors={['rgba(196,181,253,0.6)', 'rgba(250,204,21,0.6)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.rulesConnector} />
              <RuleStep label="Öğreniliyor" count="4-8" color="#facc15" Icon={BookIcon} />
              <LinearGradient colors={['rgba(250,204,21,0.6)', 'rgba(74,222,128,0.6)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.rulesConnector} />
              <RuleStep label="Mastered" count="9+" color="#4ade80" Icon={ShieldIcon} />
            </View>
            <Text style={[styles.rulesCaption, { color: colors.mutedForeground }]}>
              Tekrar sayısına göre kelimeler otomatik olarak durum değiştirir.
            </Text>
          </View>
        </GlowCard>

        <GlowCard style={styles.panel}>
          <Text style={[styles.panelTitle, { color: colors.accent }]}>Kelime Türlerin</Text>
          <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
            Hangi kelime türünde ne kadar birikimin var.
          </Text>
          <StatGrid cards={TYPE_STATS} />
        </GlowCard>

        <GlowCard style={styles.panel}>
          <Text style={[styles.panelTitle, { color: colors.accent }]}>Kaynaklarım</Text>
          <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
            Kelimelerin nereden geldiğine göre dağılımı.
          </Text>
          <StatGrid cards={SOURCE_STATS} />
        </GlowCard>

        <WordListTable
          entries={ALL_WORD_ENTRIES}
          panelTitle="Tüm Kelimeler"
          panelSub="Alfabetik olarak sıralanmış tüm kelimelerin."
          filterCount={activeFilters.length}
          onOpenFilter={() => setFilterSheetOpen(true)}
          onWordPress={handleWordPress}
        />

        <PracticeSuggestionsPanel activeFilters={activeFilters} />
      </ScrollView>

      <WordFilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        onChange={setActiveFilters}
      />

      <ReviewCountSheet visible={rulesSheetOpen} onClose={() => setRulesSheetOpen(false)} />
    </GradientBackground>
  );
}

function StatGrid({ cards }: { cards: StatCardSpec[] }) {
  return (
    <View style={styles.statGrid}>
      {cards.map((c) => (
        <StatCard key={c.key} spec={c} />
      ))}
    </View>
  );
}

function StatCard({ spec }: { spec: StatCardSpec }) {
  const { title, value, description, tint, Icon } = spec;
  return (
    <View style={[styles.statCard, { backgroundColor: hexToRgba(tint, 0.14), borderColor: hexToRgba(tint, 0.3) }]}>
      <View style={[styles.statGlow, { backgroundColor: hexToRgba(tint, 0.4) }]} />
      <View style={[styles.statIcon, { backgroundColor: hexToRgba(tint, 0.22) }]}>
        <Icon size={16} color={tint} />
      </View>
      <Text style={styles.statTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statDesc}>{description}</Text>
    </View>
  );
}

function RuleStep({
  label,
  count,
  color,
  Icon,
}: {
  label: string;
  count: string;
  color: string;
  Icon: IconRenderer;
}) {
  return (
    <View style={styles.ruleStep}>
      <View style={[styles.ruleCircle, { backgroundColor: hexToRgba(color, 0.18), borderColor: hexToRgba(color, 0.45) }]}>
        <Icon size={16} color={color} />
      </View>
      <Text style={[styles.ruleLabel, { color }]}>{label}</Text>
      <Text style={styles.ruleCount}>{count}</Text>
      <Text style={styles.ruleSub}>Farklı Hikâye</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 12,
    position: 'relative',
    marginBottom: 4,
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: -2,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 21,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 9,
    maxWidth: 300,
  },
  panel: {
    gap: 0,
  },
  panelTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  panelSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    marginTop: 4,
    marginBottom: 14,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    paddingTop: 15,
    paddingBottom: 13,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statGlow: {
    position: 'absolute',
    bottom: -30,
    left: '50%',
    marginLeft: -70,
    width: 140,
    height: 60,
    borderRadius: 30,
    opacity: 0.5,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  statTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10.5,
    color: '#a89fc2',
    marginBottom: 5,
    textAlign: 'center',
  },
  statNum: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 8.5,
    color: '#6f6685',
    textAlign: 'center',
    lineHeight: 12,
  },
  rulesPanel: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  rulesTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13.5,
  },
  rulesInfoBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesInfoText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    fontStyle: 'italic',
  },
  rulesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  ruleStep: {
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  ruleCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  ruleCount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9.5,
    color: '#a89fc2',
  },
  ruleSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 8,
    color: '#6f6685',
  },
  rulesConnector: {
    flex: 1,
    height: 2,
    borderRadius: 2,
    marginTop: 19,
    minWidth: 16,
    marginHorizontal: 4,
  },
  rulesCaption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 14,
  },
});
