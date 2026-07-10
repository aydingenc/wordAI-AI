import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';

function strengthColor(v: number) {
  if (v >= 70) return '#34D399';
  if (v >= 40) return '#FBBF24';
  return '#F87171';
}

export default function WordsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recentWords } = useProgress();

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.head}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Kelimelerim
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {recentWords.length} kelime öğrendin
          </Text>
        </View>

        <View style={styles.list}>
          {recentWords.map((w) => (
            <Pressable
              key={w.id}
              onPress={() => router.push(`/worddna/${encodeURIComponent(w.en)}`)}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <GlowCard style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.word, { color: colors.foreground }]}>
                    {w.en}
                  </Text>
                  <Text style={[styles.tr, { color: colors.mutedForeground }]}>
                    {w.tr}
                  </Text>
                </View>
                <View style={styles.right}>
                  <View style={styles.strengthRow}>
                    <View
                      style={[
                        styles.strengthTrack,
                        { backgroundColor: colors.secondary },
                      ]}
                    >
                      <View
                        style={[
                          styles.strengthFill,
                          {
                            width: `${w.strength}%`,
                            backgroundColor: strengthColor(w.strength),
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[styles.strengthText, { color: colors.mutedForeground }]}
                    >
                      %{w.strength}
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </View>
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
    paddingHorizontal: 18,
  },
  head: {
    marginBottom: 18,
    gap: 4,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  word: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
  },
  tr: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strengthRow: {
    alignItems: 'flex-end',
    gap: 5,
  },
  strengthTrack: {
    width: 74,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
});
