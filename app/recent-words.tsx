import React, { useState } from 'react';
import {
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
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import { Word } from '@/data/mock';

type Filter = 'all' | 'learning' | 'mastered';

export default function RecentWordsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recentWords } = useProgress();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = recentWords.filter((w) => {
    if (filter === 'learning') return w.strength < 70;
    if (filter === 'mastered') return w.strength >= 70;
    return true;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'learning', label: 'Öğreniliyor' },
    { key: 'mastered', label: 'Öğrenildi' },
  ];

  return (
    <GradientBackground>
      <ScreenHeader
        title="Kelimelerim"
        subtitle={`${recentWords.length} kelime`}
      />
      <View style={styles.filters}>
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: active ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Bu filtrede kelime yok
            </Text>
          </View>
        ) : (
          filtered.map((w) => (
            <WordRow key={w.id} word={w} onPress={() => router.push(`/worddna/${w.en}`)} />
          ))
        )}
      </ScrollView>
    </GradientBackground>
  );
}

function WordRow({ word, onPress }: { word: Word; onPress: () => void }) {
  const colors = useColors();
  const mastered = word.strength >= 70;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      <GlowCard style={styles.row}>
        <View
          style={[
            styles.strength,
            { backgroundColor: mastered ? 'rgba(52,211,153,0.15)' : colors.secondary },
          ]}
        >
          <Text
            style={[
              styles.strengthText,
              { color: mastered ? colors.success : colors.accent },
            ]}
          >
            {word.strength}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.en, { color: colors.foreground }]}>{word.en}</Text>
          <Text style={[styles.tr, { color: colors.mutedForeground }]}>{word.tr}</Text>
        </View>
        <Feather name="activity" size={18} color={colors.mutedForeground} />
      </GlowCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  content: {
    paddingHorizontal: 20,
    gap: 10,
  },
  empty: {
    alignItems: 'center',
    gap: 12,
    marginTop: 60,
  },
  emptyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  strength: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  en: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  tr: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginTop: 2,
  },
});
