import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Chip, ChipRow } from '@/components/Chip';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import {
  buildSessionFromWords,
  LEVEL_NAMES,
  makeWord,
  SAMPLE_WORDS,
} from '@/data/mock';

const MIN_WORDS = 3;

export default function WordsEntryScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { startSession } = useProgress();

  const [words, setWords] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [level, setLevel] = useState<string>(LEVEL_NAMES[0]);

  const addWord = (raw: string) => {
    const w = raw.trim().toLowerCase();
    if (!w) return;
    if (words.includes(w)) {
      setInput('');
      return;
    }
    setWords((prev) => [...prev, w]);
    setInput('');
  };

  const removeWord = (w: string) => {
    setWords((prev) => prev.filter((x) => x !== w));
  };

  const canCreate = words.length >= MIN_WORDS;

  const create = () => {
    const wordObjs = words.map((w) => makeWord(w));
    const session = buildSessionFromWords(wordObjs, level);
    startSession(session);
    router.push('/story-loading');
  };

  return (
    <GradientBackground>
      <ScreenHeader
        title="Kelimelerini Ekle"
        subtitle={`En az ${MIN_WORDS} kelime`}
      />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
      >
        {/* Input */}
        <GlowCard style={styles.inputCard} active>
          <View style={[styles.inputRow, { backgroundColor: colors.input, borderColor: colors.border, borderRadius: colors.radius - 6 }]}>
            <Feather name="plus" size={18} color={colors.mutedForeground} />
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => addWord(input)}
              placeholder="Bir kelime yaz ve ekle"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
              autoCapitalize="none"
              returnKeyType="done"
            />
            <Pressable
              onPress={() => addWord(input)}
              disabled={!input.trim()}
              style={[
                styles.addBtn,
                { backgroundColor: input.trim() ? colors.primary : colors.secondary },
              ]}
            >
              <Feather name="arrow-up" size={18} color={colors.primaryForeground} />
            </Pressable>
          </View>

          {words.length > 0 ? (
            <View style={styles.selectedWrap}>
              <ChipRow>
                {words.map((w) => (
                  <Chip key={w} label={w} selected onRemove={() => removeWord(w)} />
                ))}
              </ChipRow>
              <Text style={[styles.count, { color: colors.mutedForeground }]}>
                {words.length} kelime eklendi
              </Text>
            </View>
          ) : (
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Aşağıdaki önerilerden hızlıca ekleyebilirsin.
            </Text>
          )}
        </GlowCard>

        {/* Suggestions */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Öneriler</Text>
        <ChipRow>
          {SAMPLE_WORDS.filter((w) => !words.includes(w)).map((w) => (
            <Chip key={w} label={w} onPress={() => addWord(w)} />
          ))}
        </ChipRow>

        {/* Level */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Seviye</Text>
        <View style={styles.levels}>
          {LEVEL_NAMES.map((lv) => {
            const active = level === lv;
            return (
              <Pressable
                key={lv}
                onPress={() => setLevel(lv)}
                style={[
                  styles.levelBtn,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.levelText,
                    { color: active ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {lv}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </KeyboardAwareScrollViewCompat>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label={canCreate ? 'Hikaye Oluştur' : `En az ${MIN_WORDS} kelime ekle`}
          icon="zap"
          onPress={create}
          disabled={!canCreate}
          testID="words-create"
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
  inputCard: {
    gap: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    height: 54,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    height: '100%',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedWrap: {
    gap: 10,
  },
  count: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginTop: 2,
  },
  levels: {
    flexDirection: 'row',
    gap: 10,
  },
  levelBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  levelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
