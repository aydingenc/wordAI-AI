import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { WordListTable } from '@/components/WordListTable';
import { WordFilterSheet, ActiveFilter } from '@/components/WordFilterSheet';
import { PracticeSuggestionsPanel } from '@/components/PracticeSuggestionsPanel';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import { buildWordListEntries, WordListEntry } from '@/data/mock';

export function RecentWordsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recentWords } = useProgress();

  const entries = useMemo(() => buildWordListEntries(recentWords), [recentWords]);

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

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
          <View style={styles.titleRow}>
            <View style={[styles.infinityIcon, { borderColor: 'rgba(139,92,246,0.38)' }]}>
              <Text style={[styles.infinitySymbol, { color: colors.accent }]}>∞</Text>
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Son Öğrenilen Kelimeler</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            En son öğrendiğin kelimeleri, durumlarını ve geçtiği hikâyeleri takip et.
          </Text>
        </View>

        {entries.length === 0 ? (
          <GlowCard style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="book" size={26} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Henüz kelime öğrenmedin
            </Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Bir hikâye veya temayla öğrenmeye başladığında kelimelerin burada listelenir.
            </Text>
            <PrimaryButton
              label="Öğrenmeye Başla"
              icon="plus"
              onPress={() => router.push('/create')}
              style={{ marginTop: 6, alignSelf: 'stretch' }}
            />
          </GlowCard>
        ) : (
          <WordListTable
            entries={entries}
            panelTitle="Son 20 Kelime"
            panelSub="En son öğrendiğin kelimeler en üstte görünür."
            filterCount={activeFilters.length}
            onOpenFilter={() => setFilterSheetOpen(true)}
            onWordPress={handleWordPress}
            onPressAll={() => router.push('/words/all')}
          />
        )}

        <PracticeSuggestionsPanel activeFilters={activeFilters} />
      </ScrollView>

      <WordFilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        onChange={setActiveFilters}
      />
    </GradientBackground>
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
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  infinityIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167,139,250,0.22)',
  },
  infinitySymbol: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
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
    maxWidth: 295,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
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
});
