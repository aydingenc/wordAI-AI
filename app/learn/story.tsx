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
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';

export default function StoryLearnScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentSession } = useProgress();
  const [showTr, setShowTr] = useState(true);

  if (!currentSession) {
    return <EmptySession />;
  }

  const { title, levelName, paragraphs, targetWords } = currentSession;
  const targetSet = new Set(targetWords.map((w) => w.en.toLowerCase()));

  return (
    <GradientBackground>
      <ScreenHeader title="Hikaye" subtitle={`${title} · ${levelName}`} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepBar}>
          <StepDot label="Hikaye" active icon="book-open" />
          <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
          <StepDot label="Quiz" icon="help-circle" />
          <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
          <StepDot label="Kartlar" icon="layers" />
        </View>

        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: colors.mutedForeground }]}>
            Türkçe çeviri
          </Text>
          <Pressable
            onPress={() => setShowTr((v) => !v)}
            style={[
              styles.toggle,
              {
                backgroundColor: showTr ? colors.primary : colors.secondary,
              },
            ]}
          >
            <View
              style={[
                styles.knob,
                {
                  backgroundColor: '#fff',
                  alignSelf: showTr ? 'flex-end' : 'flex-start',
                },
              ]}
            />
          </Pressable>
        </View>

        {paragraphs.map((p, i) => (
          <GlowCard key={i} style={styles.para}>
            <Text style={[styles.enText, { color: colors.foreground }]}>
              {highlight(p.en, targetSet, colors.accent)}
            </Text>
            {showTr ? (
              <Text style={[styles.trText, { color: colors.mutedForeground }]}>
                {p.tr}
              </Text>
            ) : null}
          </GlowCard>
        ))}

        <GlowCard style={styles.wordsCard}>
          <Text style={[styles.wordsTitle, { color: colors.foreground }]}>
            Bu hikayedeki kelimeler
          </Text>
          <View style={styles.wordsWrap}>
            {targetWords.map((w) => (
              <View
                key={w.id}
                style={[styles.wordPill, { backgroundColor: colors.secondary }]}
              >
                <Text style={[styles.wordEn, { color: colors.accent }]}>{w.en}</Text>
                <Text style={[styles.wordTr, { color: colors.mutedForeground }]}>
                  {w.tr}
                </Text>
              </View>
            ))}
          </View>
        </GlowCard>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label="Quiz'e Geç"
          icon="arrow-right"
          onPress={() => router.push('/learn/quiz')}
          testID="story-to-quiz"
        />
      </View>
    </GradientBackground>
  );
}

function highlight(text: string, set: Set<string>, color: string) {
  const parts = text.split(/(\b)/);
  return parts.map((part, i) => {
    if (set.has(part.toLowerCase())) {
      return (
        <Text key={i} style={{ color, fontFamily: 'Inter_600SemiBold' }}>
          {part}
        </Text>
      );
    }
    return part;
  });
}

function StepDot({
  label,
  icon,
  active,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  active?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.stepDot}>
      <View
        style={[
          styles.stepIcon,
          {
            backgroundColor: active ? colors.primary : colors.secondary,
            borderColor: active ? colors.primaryGlow : colors.border,
          },
        ]}
      >
        <Feather
          name={icon}
          size={14}
          color={active ? colors.primaryForeground : colors.mutedForeground}
        />
      </View>
      <Text
        style={[
          styles.stepLabel,
          { color: active ? colors.foreground : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function EmptySession() {
  const colors = useColors();
  const router = useRouter();
  return (
    <GradientBackground>
      <ScreenHeader title="Ders" />
      <View style={styles.emptyWrap}>
        <Feather name="inbox" size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.foreground }]}>
          Aktif bir ders bulunamadı
        </Text>
        <PrimaryButton
          label="Ana Sayfaya Dön"
          icon="home"
          variant="secondary"
          onPress={() => router.replace('/home')}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  stepDot: {
    alignItems: 'center',
    gap: 4,
  },
  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginBottom: 18,
    marginHorizontal: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  toggleLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  para: {
    gap: 10,
  },
  enText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 17,
    lineHeight: 27,
  },
  trText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  wordsCard: {
    gap: 12,
  },
  wordsTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  wordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordPill: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  wordEn: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  wordTr: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    textAlign: 'center',
  },
});
