import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
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

const MIN_WORDS = 5;
const MAX_WORDS = 15;

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
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 112 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.replace('/home')} style={[styles.circleButton, styles.backButton]}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </Pressable>
          <View style={styles.headingBlock}>
            <Text style={[styles.screenTitle, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>Kelimelerini Gir</Text>
            <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>Senin kelimelerin, senin hikayen.</Text>
          </View>
          <Pressable style={styles.howButton}>
            <MaterialCommunityIcons name="help-circle-outline" size={18} color="#F15DFF" />
            <Text style={styles.howText}>Nasıl çalışır?</Text>
          </Pressable>
        </View>

        <LinearGradient colors={['#1C0A3C', '#070711', '#12091F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.aiBanner}>
          <View style={styles.aiArt}>
            <View style={styles.aiOrb}>
              <MaterialCommunityIcons name="brain" size={34} color="#E879F9" />
              <Text style={styles.aiLabel}>AI</Text>
            </View>
          </View>
          <View style={styles.aiCopy}>
            <Text style={styles.aiTitle}>AI Learning Engine</Text>
            <Text style={[styles.aiDescription, { color: colors.foreground }]}>Girdiğin kelimeleri seviyene ve akışına göre hikayelere dönüştürüyoruz.</Text>
          </View>
        </LinearGradient>

        <View style={styles.rowTitle}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Kelime Giriş Alanı</Text>
          <Text style={styles.pinkCounter}>{words.length} / {MAX_WORDS} kelime</Text>
        </View>

        <View style={styles.neonInputWrap}>
          <View style={styles.inputIconCircle}><Feather name="edit-3" size={22} color="#EC5DFF" /></View>
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
            <Feather name="plus" size={28} color="#F6EEFF" />
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
        {words.length === 0 ? <EmptyWordsCard /> : <View style={styles.wordWrap}>{words.map((word) => <WordChip key={word} word={word} onRemove={() => removeWord(word)} />)}</View>}

        <View style={styles.reasonCard}>
          <View style={styles.reasonCopy}>
            <Text style={styles.reasonTitle}>Neden 5–15 kelime?</Text>
            <Text style={[styles.reasonText, { color: colors.foreground }]}>Bu aralık, kelimelerin hikâyede doğal ve etkili bir şekilde tekrar etmesini sağlar.</Text>
          </View>
          <MaterialCommunityIcons name="target" size={46} color="#C76BFF" />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Kelime Geçiş Sayısı</Text>
        <View style={styles.repeatGrid}>
          {REPEAT_OPTIONS.map((item) => <OptionCard key={item.id} item={item} active={repeatCount === item.id} onPress={() => setRepeatCount(item.id)} />)}
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.star}>⭐</Text>
          <Text style={[styles.tipText, { color: colors.mutedForeground }]}><Text style={styles.tipLead}>Tavsiye:</Text> Otomatik modda kelime geçişleri senin öğrenme hızına göre en verimli şekilde ayarlanır.</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable onPress={createStory} disabled={!canCreate} style={({ pressed }) => [styles.cta, { opacity: canCreate ? (pressed ? 0.86 : 1) : 0.45 }]}>
          <LinearGradient colors={['#5B00FF', '#8B22FF', '#5F00C8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
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
    <MaterialCommunityIcons name={item.icon} size={22} color={active ? '#ED5BFF' : '#DDD6FE'} />
    <View style={styles.themeTextBlock}><Text style={styles.choiceTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{item.title}</Text><Text style={styles.choiceSub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{item.subtitle}</Text></View>
    {active ? <View style={styles.check}><Feather name="check" size={13} color="#230433" /></View> : null}
  </Pressable>;
}

function OptionCard({ item, active, onPress }: { item: (typeof REPEAT_OPTIONS)[number]; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.optionCard, active && styles.activeCard]}>
    <Text style={styles.choiceTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{item.title}</Text><Text style={styles.choiceSub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{item.subtitle}</Text>{active ? <View style={styles.optionCheck}><Feather name="check" size={12} color="#230433" /></View> : null}
  </Pressable>;
}

function EmptyWordsCard() {
  return <View style={styles.emptyCard}>
    <View style={styles.magicBox}>
      <Text style={[styles.floatChip, styles.floatOne]}>dream</Text><Text style={[styles.floatChip, styles.floatTwo]}>travel</Text><Text style={[styles.floatChip, styles.floatThree]}>sunset</Text>
      <MaterialCommunityIcons name="cube-outline" size={72} color="#7C3AED" />
    </View>
    <Text style={styles.emptyTitle}>Henüz kelime eklemedin.</Text>
    <Text style={styles.emptyText}>En az <Text style={styles.hot}>5</Text>, en fazla <Text style={styles.hot}>15</Text> kelime ekleyebilirsin.</Text>
  </View>;
}

function WordChip({ word, onRemove }: { word: string; onRemove: () => void }) {
  return <View style={styles.wordChip}><Text style={styles.wordText}>{word}</Text><Pressable onPress={onRemove}><Feather name="x" size={16} color="#C4B5FD" /></Pressable></View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 12 },
  topBar: { minHeight: 68, justifyContent: 'center' },
  circleButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(139,92,246,0.7)', backgroundColor: 'rgba(17,10,31,0.72)', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOpacity: 0.32, shadowRadius: 12 },
  backButton: { position: 'absolute', left: 0, top: 4 },
  headingBlock: { alignItems: 'center', paddingHorizontal: 70 },
  screenTitle: { fontFamily: 'Inter_700Bold', fontSize: 25, lineHeight: 31, textAlign: 'center' },
  screenSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 19, textAlign: 'center', marginTop: 3 },
  howButton: { position: 'absolute', right: 0, top: 7, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(139,92,246,0.65)', borderRadius: 14, paddingHorizontal: 10, height: 36, backgroundColor: 'rgba(13,8,22,0.78)' },
  howText: { color: '#DDD6FE', fontFamily: 'Inter_500Medium', fontSize: 12 },
  aiBanner: { minHeight: 128, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(139,92,246,0.32)', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 16, shadowColor: '#7C3AED', shadowOpacity: 0.22, shadowRadius: 18 },
  aiArt: { width: 104, alignItems: 'center', justifyContent: 'center' },
  aiOrb: { width: 88, height: 88, borderRadius: 44, borderWidth: 1.5, borderColor: '#7C3AED', backgroundColor: 'rgba(91,0,255,0.20)', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOpacity: 0.65, shadowRadius: 20 },
  aiLabel: { color: '#F0ABFC', fontFamily: 'Inter_700Bold', fontSize: 22, marginTop: -5 },
  aiCopy: { flex: 1, gap: 7, paddingLeft: 12 },
  aiTitle: { color: '#F05DFF', fontFamily: 'Inter_700Bold', fontSize: 20, lineHeight: 25 },
  aiDescription: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 22 },
  rowTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, lineHeight: 22 },
  pinkCounter: { color: '#F05DFF', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  neonInputWrap: { height: 74, borderRadius: 20, borderWidth: 1.2, borderColor: '#8B5CF6', backgroundColor: 'rgba(8,7,18,0.90)', flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, shadowColor: '#8B5CF6', shadowOpacity: 0.46, shadowRadius: 16, elevation: 9 },
  inputIconCircle: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(139,92,246,0.72)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(91,0,255,0.16)' },
  input: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 16, height: 56 },
  addCircle: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.2, borderColor: '#9E72FF', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(91,0,255,0.20)', shadowColor: '#9E72FF', shadowOpacity: 0.48, shadowRadius: 12 },
  notice: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: -4 },
  panel: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(139,92,246,0.22)', backgroundColor: 'rgba(7,7,18,0.72)', padding: 14, gap: 12 },
  panelTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  themeGrid: { flexDirection: 'row', gap: 8 },
  themeCard: { flex: 1, minHeight: 68, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(42,35,66,0.78)', backgroundColor: 'rgba(11,13,28,0.92)', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 5, paddingVertical: 8 },
  activeCard: { borderColor: '#8B5CF6', backgroundColor: 'rgba(74,22,150,0.64)', shadowColor: '#8B5CF6', shadowOpacity: 0.48, shadowRadius: 14, elevation: 8 },
  themeTextBlock: { minWidth: 0 },
  choiceTitle: { color: '#F5F3FF', fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 16, textAlign: 'center' },
  choiceSub: { color: '#B8B0C9', fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 14, marginTop: 2, textAlign: 'center' },
  check: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#D774FF', alignItems: 'center', justifyContent: 'center' },
  emptyCard: { minHeight: 170, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(139,92,246,0.22)', backgroundColor: 'rgba(6,8,20,0.76)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingVertical: 16 },
  magicBox: { width: 188, height: 86, alignItems: 'center', justifyContent: 'flex-end' },
  floatChip: { position: 'absolute', color: '#F5D0FE', borderWidth: 1, borderColor: '#7C3AED', backgroundColor: 'rgba(60,12,115,0.85)', borderRadius: 5, paddingHorizontal: 9, paddingVertical: 4, fontFamily: 'Inter_500Medium', fontSize: 14, transform: [{ rotate: '-9deg' }] },
  floatOne: { top: 2, left: 52 }, floatTwo: { top: 16, right: 38, transform: [{ rotate: '12deg' }] }, floatThree: { top: 42, left: 16, color: '#FDE047', borderColor: '#A16207' },
  emptyTitle: { color: '#F5F3FF', fontFamily: 'Inter_600SemiBold', fontSize: 18, marginTop: 8 },
  emptyText: { color: '#B8B0C9', fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 4 },
  hot: { color: '#F05DFF', fontFamily: 'Inter_700Bold' },
  wordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, borderRadius: 18, borderWidth: 1, borderColor: '#201246', backgroundColor: 'rgba(6,8,20,0.78)', padding: 14 },
  wordChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, borderWidth: 1, borderColor: '#7C3AED', backgroundColor: 'rgba(46,16,101,0.9)', paddingHorizontal: 14, paddingVertical: 10 },
  wordText: { color: '#F5F3FF', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  reasonCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(139,92,246,0.62)', backgroundColor: 'rgba(13,8,25,0.78)', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reasonCopy: { flex: 1, paddingRight: 18 },
  reasonTitle: { color: '#F05DFF', fontFamily: 'Inter_600SemiBold', fontSize: 17, marginBottom: 7 },
  reasonText: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 21 },
  repeatGrid: { flexDirection: 'row', gap: 8 },
  optionCard: { flex: 1, minHeight: 58, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(42,35,66,0.78)', backgroundColor: 'rgba(11,13,28,0.92)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  optionCheck: { position: 'absolute', top: 9, right: 9, width: 19, height: 19, borderRadius: 9.5, backgroundColor: '#D774FF', alignItems: 'center', justifyContent: 'center' },
  tipCard: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(42,35,66,0.70)', backgroundColor: 'rgba(13,17,39,0.74)', paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  star: { fontSize: 27 },
  tipText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  tipLead: { color: '#FACC15', fontFamily: 'Inter_600SemiBold' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 10, backgroundColor: 'rgba(5,5,10,0.72)' },
  cta: { borderRadius: 16, shadowColor: '#8B5CF6', shadowOpacity: 0.9, shadowRadius: 20, elevation: 12 },
  ctaGradient: { minHeight: 56, borderRadius: 18, borderWidth: 1, borderColor: '#A855F7', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 60 },
  ctaText: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 18 },
});
