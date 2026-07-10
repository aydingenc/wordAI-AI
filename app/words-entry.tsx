import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import { buildSessionFromWords, LEVEL_NAMES, makeWord } from '@/data/mock';

const MIN_WORDS = 5;
const MAX_WORDS = 15;
const QUICK_WORDS = [
  'love',
  'travel',
  'airport',
  'beautiful',
  'book',
  'walk',
  'coffee',
  'family',
];
const THEMES = ['Otomatik', 'Seyahat', 'Günlük Yaşam', 'Okul', 'Kafe'];

export default function WordsEntryScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { startSession } = useProgress();

  const [words, setWords] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [theme, setTheme] = useState(THEMES[0]);
  const [notice, setNotice] = useState('');

  const canCreate = words.length >= MIN_WORDS;
  const reachedMax = words.length >= MAX_WORDS;

  const addWord = (raw: string) => {
    const nextWord = raw.trim().toLowerCase();
    if (!nextWord) return;

    if (words.includes(nextWord)) {
      setNotice('Bu kelime zaten listede.');
      setInput('');
      return;
    }

    if (reachedMax) {
      setNotice('En fazla 15 kelime ekleyebilirsin.');
      setInput('');
      return;
    }

    setWords((prev) => [...prev, nextWord]);
    setInput('');
    setNotice(words.length + 1 >= MAX_WORDS ? '15 kelime sınırına ulaştın.' : '');
  };

  const removeWord = (word: string) => {
    setWords((prev) => prev.filter((item) => item !== word));
    setNotice('');
  };

  const createStory = () => {
    if (!canCreate) return;
    const wordObjs = words.map((word) => makeWord(word));
    const session = buildSessionFromWords(wordObjs, LEVEL_NAMES[0]);
    startSession(session);
    router.push('/story-loading');
  };

  return (
    <GradientBackground>
      <ScreenHeader title="Kelimelerden Öğren" onBack={() => router.replace('/home')} />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 138 }]}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: colors.secondary, borderColor: colors.borderStrong }]}>
            <MaterialCommunityIcons name="brain" size={13} color={colors.accent} />
            <Text style={[styles.badgeText, { color: colors.accent }]}>AI HİKAYE MOTORU</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Kendi kelimelerinle hikaye oluştur</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Bildiğin ya da öğrenmek istediğin kelimeleri yaz; gerisini akıllı öğrenme döngüsü halleder.
          </Text>
        </View>

        <GlowCard active style={styles.inputCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Kelime ekleme alanı</Text>
              <Text style={[styles.limitText, { color: colors.mutedForeground }]}>En az 5, en fazla 15 kelime ekle.</Text>
            </View>
            <Text style={[styles.counter, { color: reachedMax ? colors.warning : colors.accent }]}>{words.length} / {MAX_WORDS}</Text>
          </View>

          <View style={[styles.inputRow, { backgroundColor: colors.input, borderColor: colors.borderStrong, shadowColor: colors.primaryGlow }]}>
            <Feather name="edit-3" size={18} color={colors.accent} />
            <TextInput
              value={input}
              onChangeText={(value) => {
                setInput(value);
                if (notice) setNotice('');
              }}
              onSubmitEditing={() => addWord(input)}
              placeholder="Hedef kelime: apple ya da elma yaz"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
              autoCapitalize="none"
              returnKeyType="done"
              editable={!reachedMax}
            />
            <Pressable
              onPress={() => addWord(input)}
              disabled={!input.trim() || reachedMax}
              style={({ pressed }) => [
                styles.addButton,
                {
                  backgroundColor: input.trim() && !reachedMax ? colors.primary : colors.secondary,
                  opacity: pressed ? 0.82 : 1,
                  shadowColor: colors.primaryGlow,
                },
              ]}
            >
              <Feather name="plus" size={21} color={input.trim() && !reachedMax ? colors.primaryForeground : colors.mutedForeground} />
            </Pressable>
          </View>
          {notice ? <Text style={[styles.notice, { color: colors.warning }]}>{notice}</Text> : null}
        </GlowCard>

        <SectionTitle title="Hızlı ekle" />
        <View style={styles.quickRow}>
          {QUICK_WORDS.map((word) => {
            const selected = words.includes(word);
            return (
              <Pressable
                key={word}
                onPress={() => addWord(word)}
                disabled={selected || reachedMax}
                style={({ pressed }) => [
                  styles.quickChip,
                  {
                    backgroundColor: selected ? colors.primary : colors.secondary,
                    borderColor: selected ? colors.primary : colors.border,
                    opacity: selected ? 0.62 : pressed ? 0.82 : 1,
                  },
                ]}
              >
                <Text style={[styles.quickText, { color: selected ? colors.primaryForeground : colors.secondaryForeground }]}>{word}</Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle title="Tema" />
        <View style={styles.themeRow}>
          {THEMES.map((item) => {
            const active = item === theme;
            return (
              <Pressable
                key={item}
                onPress={() => setTheme(item)}
                style={({ pressed }) => [
                  styles.themeChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.accent : colors.border,
                    opacity: pressed ? 0.86 : 1,
                    shadowColor: colors.primaryGlow,
                  },
                ]}
              >
                <Text style={[styles.themeText, { color: active ? colors.primaryForeground : colors.foreground }]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.selectedHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Seçilen Kelimeler</Text>
          <Text style={[styles.counterSmall, { color: colors.accent }]}>{words.length} kelime</Text>
        </View>

        {words.length > 0 ? (
          <View style={styles.wordList}>
            {words.map((word) => (
              <GlowCard key={word} style={styles.wordCard} padded={false}>
                <View style={styles.wordCardInner}>
                  <LinearGradient
                    colors={[colors.primary, colors.glowMagenta]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.wordIcon}
                  >
                    <Feather name="type" size={15} color={colors.primaryForeground} />
                  </LinearGradient>
                  <View style={styles.wordTextBlock}>
                    <Text style={[styles.wordName, { color: colors.foreground }]} numberOfLines={1}>{word}</Text>
                    <Text style={[styles.wordMeta, { color: colors.mutedForeground }]}>Otomatik önerilen: 1</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                    <Text style={[styles.statusText, { color: colors.accent }]}>Dengeli</Text>
                  </View>
                  <Pressable onPress={() => removeWord(word)} hitSlop={8} style={styles.removeButton}>
                    <Feather name="x" size={17} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              </GlowCard>
            ))}
          </View>
        ) : (
          <GlowCard style={styles.emptyCard}>
            <Feather name="box" size={28} color={colors.accent} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Henüz kelime eklemedin.</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>En az 5, en fazla 15 kelime ekleyebilirsin.</Text>
          </GlowCard>
        )}
      </KeyboardAwareScrollViewCompat>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: 'rgba(11, 7, 19, 0.88)' }]}>
        <PrimaryButton
          label="Hikaye Oluştur"
          icon="zap"
          onPress={createStory}
          disabled={!canCreate}
          testID="words-create"
        />
        {!canCreate ? (
          <Text style={[styles.footerHint, { color: colors.mutedForeground }]}>Devam etmek için en az 5 kelime ekle.</Text>
        ) : null}
      </View>
    </GradientBackground>
  );
}

function SectionTitle({ title }: { title: string }) {
  const colors = useColors();
  return <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  hero: {
    gap: 10,
    paddingTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 0.7,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  inputCard: {
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  limitText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 4,
  },
  counter: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 62,
    borderWidth: 1,
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.36,
    shadowRadius: 16,
    elevation: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    height: 52,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.48,
    shadowRadius: 14,
    elevation: 8,
  },
  notice: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  quickText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeChip: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  themeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  counterSmall: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  wordList: {
    gap: 10,
  },
  wordCard: {
    overflow: 'hidden',
  },
  wordCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  wordIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  wordName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  wordMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 3,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 26,
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  footerHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },
});
