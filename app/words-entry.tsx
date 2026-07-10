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
import { GradientBackground } from '@/components/GradientBackground';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import { buildSessionFromWords, LEVEL_NAMES, makeWord } from '@/data/mock';

const MIN_WORDS = 3;
const MAX_WORDS = 10;

const THEMES = [
  { id: 'travel', title: 'Travel', subtitle: 'Seyahat', icon: 'airplane' as const },
  { id: 'daily', title: 'Daily Life', subtitle: 'Günlük Yaşam', icon: 'coffee-outline' as const },
  { id: 'coffee', title: 'Coffee', subtitle: 'Kahve', icon: 'coffee' as const },
  { id: 'nature', title: 'Nature', subtitle: 'Doğa', icon: 'leaf' as const },
];

const REPEAT_OPTIONS = [
  { id: 'auto', title: 'Otomatik', subtitle: 'Önerilen' },
  { id: 'once', title: '1 Kere', subtitle: 'Minimum' },
  { id: 'twice', title: '2 Kere', subtitle: 'Dengeli' },
  { id: 'triple', title: '3 Kere', subtitle: 'Yoğun' },
];

export default function WordsEntryScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { startSession } = useProgress();

  const [words, setWords] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [theme, setTheme] = useState(THEMES[0].id);
  const [repeatCount, setRepeatCount] = useState('once');
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
      setNotice('En fazla 10 kelime ekleyebilirsin.');
      setInput('');
      return;
    }

    setWords((prev) => [...prev, nextWord]);
    setInput('');
    setNotice(words.length + 1 >= MAX_WORDS ? '10 kelime sınırına ulaştın.' : '');
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
      <View style={[styles.content, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 74 }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.replace('/home')} style={[styles.circleButton, styles.backButton]}>
            <Feather name="arrow-left" size={19} color={colors.foreground} />
          </Pressable>
          <View style={styles.headingBlock}>
            <Text style={[styles.screenTitle, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>Kelimelerini Gir</Text>
            <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>Senin kelimelerin, senin hikayen.</Text>
          </View>
          <Pressable style={styles.howButton}>
            <MaterialCommunityIcons name="help-circle-outline" size={13} color="#F15DFF" />
            <Text style={styles.howText}>Nasıl çalışır?</Text>
          </Pressable>
        </View>

        <LinearGradient colors={['#1C0A3C', '#070711', '#12091F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.aiBanner}>
          <View style={styles.aiArt}>
            <LinearGradient
              colors={['rgba(124,58,237,0.58)', 'rgba(20,10,44,0.92)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiOrb}
            >
              <View style={styles.aiOrbit} />
              <View style={[styles.aiDot, styles.aiDotTop]} />
              <View style={[styles.aiDot, styles.aiDotBottom]} />
              <MaterialCommunityIcons name="brain" size={20} color="#F0ABFC" />
              <Text style={styles.aiLabel}>AI</Text>
            </LinearGradient>
          </View>
          <View style={styles.aiCopy}>
            <Text style={styles.aiTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>AI Learning Engine</Text>
            <Text style={[styles.aiDescription, { color: colors.foreground }]} numberOfLines={2}>Kelimelerini seviyene göre hikayeye dönüştürüyoruz.</Text>
          </View>
          <View pointerEvents="none" style={styles.aiBook}>
            <MaterialCommunityIcons name="book-open-page-variant" size={42} color="rgba(139,92,246,0.28)" />
          </View>
        </LinearGradient>

        <View style={styles.rowTitle}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Kelime Giriş Alanı</Text>
          <Text style={styles.pinkCounter}>{words.length} / {MAX_WORDS} kelime</Text>
        </View>

        <View style={styles.neonInputWrap}>
          <View style={styles.inputIconCircle}><Feather name="edit-3" size={17} color="#EC5DFF" /></View>
          <TextInput
            value={input}
            onChangeText={(value) => {
              setInput(value);
              if (notice) setNotice('');
            }}
            onSubmitEditing={() => addWord(input)}
            placeholder="Hedef kelime: Apple"
            placeholderTextColor="#A49AB9"
            style={[styles.input, { color: colors.foreground }]}
            autoCapitalize="none"
            returnKeyType="done"
            editable={!reachedMax}
          />
          <Pressable onPress={() => addWord(input)} disabled={!input.trim() || reachedMax} style={({ pressed }) => [styles.addCircle, { opacity: !input.trim() || reachedMax ? 0.55 : pressed ? 0.8 : 1 }]}>
            <Feather name="plus" size={20} color="#F6EEFF" />
          </Pressable>
        </View>
        {notice ? <Text style={[styles.notice, { color: colors.warning }]}>{notice}</Text> : null}

        <Panel title="Tema Seçimi">
          <View style={styles.themeGrid}>
            {THEMES.map((item) => <ThemeCard key={item.id} item={item} active={theme === item.id} onPress={() => setTheme(item.id)} />)}
          </View>
        </Panel>

        <View style={styles.rowTitle}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Eklediğin Kelimeler</Text>
          <Text style={styles.pinkCounter}>{words.length} kelime</Text>
        </View>
        <MagicWordsCard words={words} onRemove={removeWord} />

        <View style={styles.reasonCard}>
          <View style={styles.reasonCopy}>
            <Text style={styles.reasonTitle}>Neden 3–10 kelime?</Text>
            <Text style={[styles.reasonText, { color: colors.foreground }]}>Bu aralık, kelimelerin hikâyede doğal ve etkili bir şekilde tekrar etmesini sağlar.</Text>
          </View>
          <MaterialCommunityIcons name="target" size={32} color="#C76BFF" />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Kelime Geçiş Sayısı</Text>
        <View style={styles.repeatGrid}>
          {REPEAT_OPTIONS.map((item) => <OptionCard key={item.id} item={item} active={repeatCount === item.id} onPress={() => setRepeatCount(item.id)} />)}
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.star}>⭐</Text>
          <Text style={[styles.tipText, { color: colors.mutedForeground }]}><Text style={styles.tipLead}>Tavsiye:</Text> Otomatik modda kelime geçişleri senin öğrenme hızına göre en verimli şekilde ayarlanır.</Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable onPress={createStory} disabled={!canCreate} style={({ pressed }) => [styles.cta, { opacity: canCreate ? (pressed ? 0.9 : 1) : 0.82 }]}>
          <LinearGradient colors={['#4C1DFF', '#7C3AED', '#5B10C8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
            <Text style={styles.ctaText}>Hikaye Oluştur</Text>
            <Feather name="arrow-right" size={28} color="#DAC8FF" />
          </LinearGradient>
        </Pressable>
      </View>
    </GradientBackground>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return <View style={styles.panel}><Text style={[styles.panelTitle, { color: colors.foreground }]}>{title}</Text>{children}</View>;
}

function ThemeCard({ item, active, onPress }: { item: (typeof THEMES)[number]; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.themeCard, active && styles.activeCard]}>
    <View style={styles.themeLabelRow}>
      <MaterialCommunityIcons name={item.icon} size={15} color={active ? '#F0ABFC' : '#DDD6FE'} />
      <Text style={styles.choiceTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>{item.title}</Text>
    </View>
    <Text style={styles.choiceSub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>{item.subtitle}</Text>
    {active ? <View style={styles.check}><Feather name="check" size={12} color="#230433" /></View> : null}
  </Pressable>;
}

function OptionCard({ item, active, onPress }: { item: (typeof REPEAT_OPTIONS)[number]; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.optionCard, active && styles.activeCard]}>
    <Text style={styles.choiceTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{item.title}</Text><Text style={styles.choiceSub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{item.subtitle}</Text>{active ? <View style={styles.optionCheck}><Feather name="check" size={12} color="#230433" /></View> : null}
  </Pressable>;
}

const PREVIEW_WORDS = ['dream', 'travel', 'sunset'];
const FLOAT_STYLE_KEYS = ['floatOne', 'floatTwo', 'floatThree', 'floatFour', 'floatFive', 'floatSix'] as const;

function MagicWordsCard({ words, onRemove }: { words: string[]; onRemove: (word: string) => void }) {
  const hasWords = words.length > 0;
  const displayWords = (hasWords ? words : PREVIEW_WORDS).slice(0, FLOAT_STYLE_KEYS.length);

  return <View style={[styles.emptyCard, hasWords && styles.filledCard]}>
    <View style={styles.magicBox}>
      <View style={styles.boxGlow} />
      <Text style={[styles.sparkle, styles.sparkleLeft]}>✦</Text>
      <Text style={[styles.sparkle, styles.sparkleRight]}>✦</Text>
      <Text style={[styles.sparkle, styles.sparkleTop]}>✧</Text>
      {!hasWords ? displayWords.map((word, index) => (
        <React.Fragment key={word}>
          <Text style={[styles.floatChip, styles[FLOAT_STYLE_KEYS[index]]]} numberOfLines={1}>{word}</Text>
        </React.Fragment>
      )) : null}
      <LinearGradient
        colors={['rgba(124,58,237,0.95)', 'rgba(91,33,182,0.88)', 'rgba(44,12,94,0.94)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.magicCore, hasWords && styles.magicCoreFilled]}
      >
        <MaterialCommunityIcons name="cube-outline" size={hasWords ? 26 : 34} color="#D8B4FE" />
      </LinearGradient>
      {hasWords ? (
        <View style={styles.realWordsCloud}>
          {words.slice(0, MAX_WORDS).map((word) => (
            <Pressable key={word} onPress={() => onRemove(word)} hitSlop={5} style={styles.realWordChip}>
              <Text style={styles.realWordText} numberOfLines={1}>{word}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
    <Text style={styles.emptyTitle}>{hasWords ? `${words.length} kelime eklendi.` : 'Henüz kelime eklemedin.'}</Text>
    <Text style={styles.emptyText}>
      {hasWords ? 'Kelimeye dokunarak kaldırabilirsin.' : <>En az <Text style={styles.hot}>3</Text>, en fazla <Text style={styles.hot}>10</Text> kelime ekleyebilirsin.</>}
    </Text>
  </View>;
}

function WordChip({ word, onRemove }: { word: string; onRemove: () => void }) {
  return <View style={styles.wordChip}><Text style={styles.wordText}>{word}</Text><Pressable onPress={onRemove}><Feather name="x" size={16} color="#C4B5FD" /></Pressable></View>;
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20, gap: 7 },
  topBar: { minHeight: 48, justifyContent: 'center' },
  circleButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(168,85,247,0.72)', backgroundColor: 'rgba(18,12,31,0.74)', alignItems: 'center', justifyContent: 'center', shadowColor: '#A855F7', shadowOpacity: 0.36, shadowRadius: 12, elevation: 7, zIndex: 2 },
  backButton: { position: 'absolute', left: 0, top: 4 },
  headingBlock: { position: 'absolute', left: 52, right: 104, top: 4, alignItems: 'center' },
  screenTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, lineHeight: 23, textAlign: 'center', letterSpacing: -0.2 },
  screenSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 15, textAlign: 'center', marginTop: 0 },
  howButton: { position: 'absolute', right: 0, top: 8, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(139,92,246,0.50)', borderRadius: 12, paddingHorizontal: 8, height: 28, backgroundColor: 'rgba(13,8,22,0.66)', zIndex: 2 },
  howText: { color: '#DDD6FE', fontFamily: 'Inter_500Medium', fontSize: 10.5 },
  aiBanner: { height: 98, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(139,92,246,0.30)', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, shadowColor: '#7C3AED', shadowOpacity: 0.22, shadowRadius: 16 },
  aiArt: { width: 108, alignItems: 'center', justifyContent: 'center' },
  aiOrb: { width: 68, height: 68, borderRadius: 34, borderWidth: 1, borderColor: 'rgba(192,132,252,0.78)', alignItems: 'center', justifyContent: 'center', shadowColor: '#A855F7', shadowOpacity: 0.58, shadowRadius: 18, overflow: 'hidden' },
  aiOrbit: { position: 'absolute', width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: 'rgba(240,171,252,0.22)' },
  aiDot: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#E879F9', shadowColor: '#E879F9', shadowOpacity: 0.9, shadowRadius: 5 },
  aiDotTop: { top: 12, right: 19 },
  aiDotBottom: { bottom: 12, left: 18 },
  aiLabel: { color: '#F0ABFC', fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: -5 },
  aiCopy: { flex: 1, gap: 4, paddingLeft: 6, paddingRight: 30, zIndex: 1 },
  aiTitle: { color: '#F05DFF', fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 19 },
  aiDescription: { fontFamily: 'Inter_400Regular', fontSize: 11.5, lineHeight: 17 },
  aiBook: { position: 'absolute', right: 16, bottom: 14, opacity: 0.9 },
  rowTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 19 },
  pinkCounter: { color: '#F05DFF', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  neonInputWrap: { height: 58, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(139,92,246,0.82)', backgroundColor: 'rgba(8,7,18,0.88)', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, shadowColor: '#8B5CF6', shadowOpacity: 0.28, shadowRadius: 12, elevation: 7 },
  inputIconCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(139,92,246,0.62)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(91,0,255,0.12)' },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, height: 48 },
  addCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(158,114,255,0.78)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(91,0,255,0.14)', shadowColor: '#9E72FF', shadowOpacity: 0.3, shadowRadius: 8 },
  notice: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: -4 },
  panel: { borderRadius: 18, borderWidth: 1, borderColor: 'rgba(139,92,246,0.20)', backgroundColor: 'rgba(7,7,18,0.66)', padding: 9, gap: 7 },
  panelTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  themeGrid: { flexDirection: 'row', gap: 6 },
  themeCard: { flex: 1, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(42,35,66,0.70)', backgroundColor: 'rgba(11,13,28,0.86)', alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4, paddingVertical: 5 },
  activeCard: { borderColor: 'rgba(192,132,252,0.95)', backgroundColor: 'rgba(72,24,137,0.72)', shadowColor: '#A855F7', shadowOpacity: 0.46, shadowRadius: 12, elevation: 8 },
  themeTextBlock: { minWidth: 0 },
  themeLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, maxWidth: '100%' },
  choiceTitle: { color: '#F5F3FF', fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 13, textAlign: 'center' },
  choiceSub: { color: '#B8B0C9', fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 12, marginTop: 0, textAlign: 'center' },
  check: { position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(245,208,254,0.85)', backgroundColor: '#D774FF', alignItems: 'center', justifyContent: 'center', shadowColor: '#E879F9', shadowOpacity: 0.55, shadowRadius: 7, elevation: 7 },
  emptyCard: { height: 142, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(139,92,246,0.22)', backgroundColor: 'rgba(5,7,18,0.78)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingVertical: 10, shadowColor: '#7C3AED', shadowOpacity: 0.16, shadowRadius: 14 },
  filledCard: { height: 148, borderColor: 'rgba(192,132,252,0.36)', backgroundColor: 'rgba(8,7,22,0.82)', shadowOpacity: 0.24 },
  magicBox: { width: '100%', height: 84, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 2 },
  boxGlow: { position: 'absolute', bottom: 4, width: 150, height: 56, borderRadius: 75, backgroundColor: '#7C3AED', opacity: 0.22, shadowColor: '#A855F7', shadowOpacity: 0.8, shadowRadius: 28 },
  magicCore: { width: 66, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-1deg' }], shadowColor: '#8B5CF6', shadowOpacity: 0.78, shadowRadius: 18, elevation: 10 },
  magicCoreFilled: { position: 'absolute', top: 24, opacity: 0.58, width: 48, height: 34, borderRadius: 11 },
  sparkle: { position: 'absolute', color: '#F5D0FE', fontFamily: 'Inter_700Bold', fontSize: 12, textShadowColor: '#E879F9', textShadowRadius: 8 },
  sparkleLeft: { left: 42, bottom: 24 },
  sparkleRight: { right: 44, bottom: 32 },
  sparkleTop: { top: 22, right: 72 },
  floatChip: { position: 'absolute', color: '#F5D0FE', borderWidth: 1, borderColor: 'rgba(124,58,237,0.92)', backgroundColor: 'rgba(43,13,87,0.88)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, fontFamily: 'Inter_500Medium', fontSize: 12, letterSpacing: 0.2, transform: [{ rotate: '-9deg' }], shadowColor: '#7C3AED', shadowOpacity: 0.5, shadowRadius: 8 },
  floatOne: { top: 8, left: 42 }, floatTwo: { top: 18, right: 32, transform: [{ rotate: '12deg' }] }, floatThree: { top: 38, left: 18, color: '#FDE047', borderColor: '#A16207', backgroundColor: 'rgba(68,35,9,0.86)' },
  floatFour: { top: 42, right: 10, transform: [{ rotate: '-8deg' }] },
  floatFive: { top: 2, right: 70, transform: [{ rotate: '8deg' }] },
  floatSix: { top: 30, left: 78, transform: [{ rotate: '5deg' }] },
  realFloatChip: { color: '#FFFFFF', borderColor: 'rgba(216,180,254,0.95)', backgroundColor: 'rgba(88,28,135,0.92)' },
  realWordsCloud: { position: 'absolute', left: 12, right: 12, top: 5, minHeight: 72, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 4, paddingVertical: 5 },
  realWordChip: { maxWidth: 76, borderWidth: 1, borderColor: 'rgba(216,180,254,0.72)', backgroundColor: 'rgba(67,24,126,0.88)', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3, shadowColor: '#8B5CF6', shadowOpacity: 0.26, shadowRadius: 7 },
  realWordText: { color: '#F8F4FF', fontFamily: 'Inter_600SemiBold', fontSize: 10, lineHeight: 12 },
  emptyTitle: { color: '#F5F3FF', fontFamily: 'Inter_500Medium', fontSize: 15, marginTop: 2 },
  emptyText: { color: '#B8B0C9', fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  hot: { color: '#F05DFF', fontFamily: 'Inter_700Bold' },
  wordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, borderRadius: 18, borderWidth: 1, borderColor: '#201246', backgroundColor: 'rgba(6,8,20,0.78)', padding: 14 },
  wordChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, borderWidth: 1, borderColor: '#7C3AED', backgroundColor: 'rgba(46,16,101,0.9)', paddingHorizontal: 14, paddingVertical: 10 },
  wordText: { color: '#F5F3FF', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  reasonCard: { borderRadius: 18, borderWidth: 1, borderColor: 'rgba(139,92,246,0.38)', backgroundColor: 'rgba(13,8,25,0.68)', padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reasonCopy: { flex: 1, paddingRight: 18 },
  reasonTitle: { color: '#F05DFF', fontFamily: 'Inter_600SemiBold', fontSize: 14, marginBottom: 4 },
  reasonText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  repeatGrid: { flexDirection: 'row', gap: 8 },
  optionCard: { flex: 1, minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(42,35,66,0.70)', backgroundColor: 'rgba(11,13,28,0.86)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  optionCheck: { position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(245,208,254,0.85)', backgroundColor: '#D774FF', alignItems: 'center', justifyContent: 'center', shadowColor: '#E879F9', shadowOpacity: 0.55, shadowRadius: 7, elevation: 7 },
  tipCard: { marginTop: 'auto', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.34)', backgroundColor: 'rgba(21,18,45,0.82)', paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#8B5CF6', shadowOpacity: 0.22, shadowRadius: 12, elevation: 6 },
  star: { fontSize: 24, textShadowColor: 'rgba(251,191,36,0.55)', textShadowRadius: 8 },
  tipText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11.5, lineHeight: 16, textAlign: 'center' },
  tipLead: { color: '#FACC15', fontFamily: 'Inter_600SemiBold' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 8, backgroundColor: 'rgba(5,5,10,0.58)' },
  cta: { borderRadius: 18, shadowColor: '#A855F7', shadowOpacity: 0.78, shadowRadius: 22, elevation: 14 },
  ctaGradient: { minHeight: 56, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(216,180,254,0.72)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 56 },
  ctaText: { color: '#F8F4FF', fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.2 },
});
