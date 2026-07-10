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
            <Text style={[styles.screenTitle, { color: colors.foreground }]}>Kelimelerini Gir</Text>
            <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>Senin kelimelerin, senin hikayen.</Text>
          </View>
          <Pressable style={styles.howButton}>
            <MaterialCommunityIcons name="help-circle-outline" size={18} color="#F15DFF" />
            <Text style={styles.howText}>Nasıl çalışır?</Text>
          </Pressable>
        </View>

        <LinearGradient colors={['#1C0A3C', '#070711', '#12091F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.aiBanner}>
          <View style={styles.aiArt}>
            <View style={styles.aiOrb}>
              <MaterialCommunityIcons name="brain" size={48} color="#E879F9" />
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
          <View style={styles.inputIconCircle}><Feather name="edit-3" size={30} color="#EC5DFF" /></View>
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
            <Feather name="plus" size={34} color="#F6EEFF" />
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
          <MaterialCommunityIcons name="target" size={58} color="#C76BFF" />
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
    <MaterialCommunityIcons name={item.icon} size={30} color={active ? '#ED5BFF' : '#DDD6FE'} />
    <View style={styles.themeTextBlock}><Text style={styles.choiceTitle}>{item.title}</Text><Text style={styles.choiceSub}>{item.subtitle}</Text></View>
    {active ? <View style={styles.check}><Feather name="check" size={13} color="#230433" /></View> : null}
  </Pressable>;
}

function OptionCard({ item, active, onPress }: { item: (typeof REPEAT_OPTIONS)[number]; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.optionCard, active && styles.activeCard]}>
    <Text style={styles.choiceTitle}>{item.title}</Text><Text style={styles.choiceSub}>{item.subtitle}</Text>{active ? <View style={styles.optionCheck}><Feather name="check" size={12} color="#230433" /></View> : null}
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
  content: { paddingHorizontal: 22, gap: 14 },
  topBar: { minHeight: 76, justifyContent: 'center' },
  circleButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#6D28D9', backgroundColor: 'rgba(17,10,31,0.8)', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOpacity: 0.4, shadowRadius: 14 },
  backButton: { position: 'absolute', left: 0, top: 4 },
  headingBlock: { alignItems: 'center', paddingHorizontal: 86 },
  screenTitle: { fontFamily: 'Inter_700Bold', fontSize: 31, lineHeight: 38, textAlign: 'center' },
  screenSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 17, textAlign: 'center', marginTop: 3 },
  howButton: { position: 'absolute', right: 0, top: 4, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#6D28D9', borderRadius: 16, paddingHorizontal: 12, height: 48, backgroundColor: 'rgba(13,8,22,0.85)' },
  howText: { color: '#DDD6FE', fontFamily: 'Inter_500Medium', fontSize: 15 },
  aiBanner: { minHeight: 154, borderRadius: 18, borderWidth: 1, borderColor: '#3B1974', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 18, shadowColor: '#7C3AED', shadowOpacity: 0.35, shadowRadius: 26 },
  aiArt: { width: '34%', alignItems: 'center', justifyContent: 'center' },
  aiOrb: { width: 112, height: 112, borderRadius: 56, borderWidth: 2, borderColor: '#7C3AED', backgroundColor: 'rgba(91,0,255,0.22)', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOpacity: 0.9, shadowRadius: 26 },
  aiLabel: { color: '#F0ABFC', fontFamily: 'Inter_700Bold', fontSize: 28, marginTop: -4 },
  aiCopy: { flex: 1, gap: 10, paddingLeft: 14 },
  aiTitle: { color: '#F05DFF', fontFamily: 'Inter_700Bold', fontSize: 24 },
  aiDescription: { fontFamily: 'Inter_400Regular', fontSize: 17, lineHeight: 28 },
  rowTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionTitle: { fontFamily: 'Inter_500Medium', fontSize: 21 },
  pinkCounter: { color: '#F05DFF', fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  neonInputWrap: { height: 92, borderRadius: 20, borderWidth: 1.5, borderColor: '#8B5CF6', backgroundColor: 'rgba(8,7,18,0.92)', flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 24, shadowColor: '#8B5CF6', shadowOpacity: 0.95, shadowRadius: 18, elevation: 12 },
  inputIconCircle: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(91,0,255,0.18)' },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 20, height: 70 },
  addCircle: { width: 58, height: 58, borderRadius: 29, borderWidth: 1.5, borderColor: '#9E72FF', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(91,0,255,0.22)', shadowColor: '#9E72FF', shadowOpacity: 0.8, shadowRadius: 14 },
  notice: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: -4 },
  panel: { borderRadius: 18, borderWidth: 1, borderColor: '#261449', backgroundColor: 'rgba(7,7,18,0.75)', padding: 14, gap: 12 },
  panelTitle: { fontFamily: 'Inter_500Medium', fontSize: 19 },
  themeGrid: { flexDirection: 'row', gap: 12 },
  themeCard: { flex: 1, minHeight: 72, borderRadius: 16, borderWidth: 1, borderColor: '#19172B', backgroundColor: '#0B0D1C', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 8 },
  activeCard: { borderColor: '#8B5CF6', backgroundColor: 'rgba(74,22,150,0.76)', shadowColor: '#8B5CF6', shadowOpacity: 0.9, shadowRadius: 16, elevation: 10 },
  themeTextBlock: { minWidth: 0 },
  choiceTitle: { color: '#F5F3FF', fontFamily: 'Inter_500Medium', fontSize: 16, textAlign: 'center' },
  choiceSub: { color: '#B8B0C9', fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 4, textAlign: 'center' },
  check: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#D774FF', alignItems: 'center', justifyContent: 'center' },
  emptyCard: { minHeight: 188, borderRadius: 18, borderWidth: 1, borderColor: '#201246', backgroundColor: 'rgba(6,8,20,0.78)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  magicBox: { width: 210, height: 96, alignItems: 'center', justifyContent: 'flex-end' },
  floatChip: { position: 'absolute', color: '#F5D0FE', borderWidth: 1, borderColor: '#7C3AED', backgroundColor: 'rgba(60,12,115,0.85)', borderRadius: 5, paddingHorizontal: 9, paddingVertical: 4, fontFamily: 'Inter_500Medium', fontSize: 14, transform: [{ rotate: '-9deg' }] },
  floatOne: { top: 2, left: 52 }, floatTwo: { top: 16, right: 38, transform: [{ rotate: '12deg' }] }, floatThree: { top: 42, left: 16, color: '#FDE047', borderColor: '#A16207' },
  emptyTitle: { color: '#F5F3FF', fontFamily: 'Inter_500Medium', fontSize: 21, marginTop: 10 },
  emptyText: { color: '#B8B0C9', fontFamily: 'Inter_400Regular', fontSize: 16, marginTop: 5 },
  hot: { color: '#F05DFF', fontFamily: 'Inter_700Bold' },
  wordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, borderRadius: 18, borderWidth: 1, borderColor: '#201246', backgroundColor: 'rgba(6,8,20,0.78)', padding: 14 },
  wordChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, borderWidth: 1, borderColor: '#7C3AED', backgroundColor: 'rgba(46,16,101,0.9)', paddingHorizontal: 14, paddingVertical: 10 },
  wordText: { color: '#F5F3FF', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  reasonCard: { borderRadius: 18, borderWidth: 1, borderColor: '#6D28D9', backgroundColor: 'rgba(13,8,25,0.82)', padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reasonCopy: { flex: 1, paddingRight: 18 },
  reasonTitle: { color: '#F05DFF', fontFamily: 'Inter_600SemiBold', fontSize: 21, marginBottom: 8 },
  reasonText: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 24 },
  repeatGrid: { flexDirection: 'row', gap: 12 },
  optionCard: { flex: 1, minHeight: 70, borderRadius: 15, borderWidth: 1, borderColor: '#19172B', backgroundColor: '#0B0D1C', alignItems: 'center', justifyContent: 'center' },
  optionCheck: { position: 'absolute', top: 9, right: 9, width: 19, height: 19, borderRadius: 9.5, backgroundColor: '#D774FF', alignItems: 'center', justifyContent: 'center' },
  tipCard: { borderRadius: 15, borderWidth: 1, borderColor: '#1B1B38', backgroundColor: 'rgba(13,17,39,0.86)', paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  star: { fontSize: 27 },
  tipText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  tipLead: { color: '#FACC15', fontFamily: 'Inter_600SemiBold' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 12, backgroundColor: 'rgba(5,5,10,0.72)' },
  cta: { borderRadius: 16, shadowColor: '#8B5CF6', shadowOpacity: 0.9, shadowRadius: 20, elevation: 12 },
  ctaGradient: { minHeight: 62, borderRadius: 16, borderWidth: 1, borderColor: '#A855F7', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 80 },
  ctaText: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 24 },
});
