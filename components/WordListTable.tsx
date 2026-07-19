import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { GlowCard } from '@/components/GlowCard';
import { TextMarquee } from '@/components/TextMarquee';
import { DnaIcon, FunnelIcon, STATUS_META } from '@/components/WordStatusIcons';
import { useColors } from '@/hooks/useColors';
import { WordListEntry } from '@/data/mock';

const PAGE_SIZE = 10;

/** Single source of truth for column widths — header row and every data row share this object so they can never drift apart. */
const COL = {
  word: { flexBasis: 40, flexShrink: 0, flexGrow: 0, minWidth: 0 },
  mean: { flexBasis: 56, flexShrink: 0, flexGrow: 0, minWidth: 0 },
  status: { flexBasis: 74, flexShrink: 0, flexGrow: 0, minWidth: 0 },
  dna: { flexBasis: 40, flexShrink: 0, flexGrow: 0, minWidth: 0 },
} as const;

export function WordListTable({
  entries,
  panelTitle,
  panelSub,
  filterCount,
  onOpenFilter,
  onWordPress,
  onPressAll,
}: {
  entries: WordListEntry[];
  panelTitle: string;
  panelSub: string;
  filterCount: number;
  onOpenFilter: () => void;
  onWordPress: (entry: WordListEntry) => void;
  onPressAll?: () => void;
}) {
  const colors = useColors();
  const [dnaTooltipOpen, setDnaTooltipOpen] = useState(false);
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const visibleEntries = entries.slice(startIndex, startIndex + PAGE_SIZE);

  const dots = Array.from({ length: 8 }, (_, i) => i);
  const activeDotIndex =
    pageCount > 1 ? Math.round(((page - 1) / (pageCount - 1)) * (dots.length - 1)) : 0;

  return (
    <GlowCard style={styles.panel}>
      <View style={styles.titleRow}>
        <Text style={[styles.panelTitle, { color: colors.accent }]}>{panelTitle}</Text>
        <Pressable
          onPress={onOpenFilter}
          style={({ pressed }) => [
            styles.filterBtn,
            { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <FunnelIcon size={13} color={colors.accent} />
          <View style={[styles.filterCount, { backgroundColor: 'rgba(139,92,246,0.22)' }]}>
            <Text style={[styles.filterCountText, { color: colors.accent }]}>{filterCount}</Text>
          </View>
        </Pressable>
      </View>
      <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>{panelSub}</Text>

      <View style={styles.table}>
        <View style={[styles.row, styles.headRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.th, COL.word, { color: colors.mutedForeground }]}>Kelime</Text>
          <Text style={[styles.th, COL.mean, { color: colors.mutedForeground }]}>Anlamı</Text>
          <Text style={[styles.th, COL.status, { color: colors.mutedForeground }]}>Status</Text>
          <View style={[COL.dna, styles.thDna]}>
            <Text style={[styles.th, { color: colors.mutedForeground }]}>DNA</Text>
            <Pressable
              hitSlop={8}
              onPress={() => setDnaTooltipOpen((v) => !v)}
              style={[styles.infoIcon, { backgroundColor: 'rgba(139,92,246,0.16)', borderColor: 'rgba(139,92,246,0.35)' }]}
            >
              <Text style={[styles.infoIconText, { color: colors.accent }]}>i</Text>
            </Pressable>
          </View>
        </View>

        {dnaTooltipOpen ? (
          <View style={[styles.tooltip, { backgroundColor: colors.cardAlt, borderColor: 'rgba(139,92,246,0.35)' }]}>
            <Text style={[styles.tooltipText, { color: colors.mutedForeground }]}>
              Kelimeyi farklı örnek cümlelerde ve farklı bağlamlarda görmenin en iyi yolu
            </Text>
          </View>
        ) : null}

        {visibleEntries.map((entry) => (
          <WordRow key={entry.id} entry={entry} onPress={() => onWordPress(entry)} />
        ))}
      </View>

      <View style={[styles.footer, { borderTopColor: 'rgba(139,92,246,0.08)' }]}>
        <View style={styles.pageNav}>
          <Pressable
            disabled={page <= 1}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            style={[
              styles.pageArrow,
              { backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.25)' },
              page <= 1 && styles.pageArrowDisabled,
            ]}
          >
            <Feather name="chevron-left" size={13} color={colors.accent} />
          </Pressable>
          <Dots dots={dots.slice(0, 4)} activeIndex={activeDotIndex} />
          <Text style={[styles.pageLabel, { color: colors.mutedForeground }]}>
            {page} / {pageCount}
          </Text>
          <Dots dots={dots.slice(4)} activeIndex={activeDotIndex - 4} />
          <Pressable
            disabled={page >= pageCount}
            onPress={() => setPage((p) => Math.min(pageCount, p + 1))}
            style={[
              styles.pageArrow,
              { backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.25)' },
              page >= pageCount && styles.pageArrowDisabled,
            ]}
          >
            <Feather name="chevron-right" size={13} color={colors.accent} />
          </Pressable>
        </View>
        {onPressAll ? (
          <Pressable
            onPress={onPressAll}
            style={({ pressed }) => [
              styles.allBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.allBtnText}>Tümü ›</Text>
          </Pressable>
        ) : null}
      </View>
    </GlowCard>
  );
}

function Dots({ dots, activeIndex }: { dots: number[]; activeIndex: number }) {
  return (
    <View style={styles.dotsRow}>
      {dots.map((d, i) => (
        <View key={d} style={[styles.dot, i === activeIndex && styles.dotActive]} />
      ))}
    </View>
  );
}

function WordRow({ entry, onPress }: { entry: WordListEntry; onPress: () => void }) {
  const colors = useColors();
  const meta = STATUS_META[entry.status];

  return (
    <View style={[styles.dataRow, { backgroundColor: 'rgba(255,255,255,0.012)', borderColor: 'rgba(139,92,246,0.12)' }]}>
      <View style={[styles.row, styles.dataRowTop]}>
        <View style={COL.word}>
          <TextMarquee text={entry.en} style={[styles.wordText, { color: colors.foreground }]} />
        </View>
        <View style={COL.mean}>
          <TextMarquee text={entry.tr} style={[styles.meanText, { color: colors.mutedForeground }]} />
        </View>
        <View style={COL.status}>
          <View style={[styles.statusPill, { backgroundColor: meta.bg, borderColor: meta.border }]}>
            <meta.Icon size={10} color={meta.color} />
            <Text style={[styles.statusPillText, { color: meta.color }]} numberOfLines={1} ellipsizeMode="tail">
              {meta.label}
            </Text>
          </View>
        </View>
        <View style={[COL.dna, styles.dnaCell]}>
          <Pressable
            onPress={onPress}
            hitSlop={6}
            style={({ pressed }) => [
              styles.dnaBtn,
              { borderColor: 'rgba(139,92,246,0.3)', opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <DnaIcon size={16} />
          </Pressable>
        </View>
      </View>
      <View style={[styles.exampleRow, { borderTopColor: 'rgba(139,92,246,0.08)' }]}>
        <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>
          {entry.example}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  filterCount: {
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  filterCountText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  panelSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    marginTop: 4,
    marginBottom: 14,
  },
  table: {
    width: '100%',
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    width: '100%',
  },
  headRow: {
    paddingBottom: 9,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  th: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  thDna: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  infoIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    fontStyle: 'italic',
  },
  tooltip: {
    position: 'absolute',
    top: 24,
    right: 0,
    width: 180,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    zIndex: 20,
    elevation: 6,
  },
  tooltipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
  },
  dataRow: {
    flexDirection: 'column',
    width: '100%',
    paddingHorizontal: 9,
    paddingVertical: 10,
    marginBottom: 7,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dataRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exampleRow: {
    borderTopWidth: 1,
    marginTop: 6,
    paddingTop: 6,
  },
  exampleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'left',
  },
  wordText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  meanText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
  },
  statusPillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9.5,
    flexShrink: 1,
  },
  dnaCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dnaBtn: {
    width: 31,
    height: 31,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  pageNav: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  pageArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageArrowDisabled: {
    opacity: 0.3,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#6f6685',
    opacity: 0.35,
  },
  dotActive: {
    backgroundColor: '#b39dfb',
    opacity: 1,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pageLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  allBtn: {
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.45)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 7,
  },
  allBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#60a5fa',
  },
});
