import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useProgress } from '@/context/ProgressContext';
import { useDialog, type ShowDialogOptions } from '@/context/DialogContext';
import { getWordDetail, WordStatus } from '@/data/mock';
import { isSupabaseConfigured } from '@/lib/supabase';
import { phase2aApi, Phase2ARequestError } from '@/lib/phase2a-api';
import { ensurePhase2aWordMembership, resolvePhase2aWordId } from '@/lib/phase2a-word-access';
import type { BilingualExample, WordLabResponse } from '@/types/phase2a-api';
import { WordStoryTray } from '@/components/WordStoryTray';

export const TOKENS = {
  bg: '#08070f',
  panel: 'rgba(19,17,32,0.72)',
  border: 'rgba(139,92,246,0.16)',
  borderStrong: 'rgba(139,92,246,0.38)',
  violet: '#8b5cf6',
  violetLight: '#b39dfb',
  text: '#f6f4fc',
  textDim: '#a89fc2',
  textFaint: '#6f6685',
  pink: '#f472b6',
};

const STATUS_META: Record<WordStatus, { label: string; color: string; bg: string; border: string }> = {
  new: { label: 'Yeni', color: '#c4b5fd', bg: 'rgba(139,92,246,0.14)', border: 'rgba(139,92,246,0.35)' },
  learning: { label: 'Öğreniliyor', color: '#facc15', bg: 'rgba(250,204,21,0.14)', border: 'rgba(250,204,21,0.35)' },
  mastered: { label: 'Mastered', color: '#4ade80', bg: 'rgba(74,222,128,0.14)', border: 'rgba(74,222,128,0.35)' },
};

type LevelKey = 'basic' | 'mid' | 'advanced';
type TenseKey = 'present' | 'presentContinuous' | 'past' | 'future' | 'presentPerfect';

const LEVELS: { key: LevelKey; label: string; color: string }[] = [
  { key: 'basic', label: 'Basit', color: '#c4b5fd' },
  { key: 'mid', label: 'Orta', color: '#facc15' },
  { key: 'advanced', label: 'İleri', color: '#4ade80' },
];

const TENSES: { key: TenseKey; label: string }[] = [
  { key: 'present', label: 'Simple Present' },
  { key: 'presentContinuous', label: 'Present Continuous' },
  { key: 'future', label: 'Future' },
  { key: 'past', label: 'Simple Past' },
  { key: 'presentPerfect', label: 'Present Perfect' },
];

/** Only 'basic'/'present' are unlocked in preview mode (free daily limit reached). */
function isTabLocked(access: WordLabAccess | null, kind: 'level', key: LevelKey): boolean;
function isTabLocked(access: WordLabAccess | null, kind: 'tense', key: TenseKey): boolean;
function isTabLocked(access: WordLabAccess | null, _kind: 'level' | 'tense', key: LevelKey | TenseKey): boolean {
  if (!access || access.status !== 'ready' || access.data.accessMode !== 'preview') return false;
  return key !== 'basic' && key !== 'present';
}

/** The backend sends raw/English error codes as `message` for most codes
 * (e.g. message === 'WORD_NOT_IN_LIBRARY', or the English rate-limit copy)
 * — only PAYWALL_REQUIRED already carries a hand-written Turkish message.
 * Never show `err.message` to the user directly; map by `code` instead. */
function friendlyPhase2aErrorMessage(err: Phase2ARequestError): string {
  switch (err.code) {
    case 'WORD_NOT_IN_LIBRARY':
      return 'Bu kelime kütüphanende yok.';
    case 'RATE_LIMITED':
      return err.retryAfterSeconds
        ? `Çok sık istek gönderildi, ${err.retryAfterSeconds} sn sonra tekrar dene.`
        : 'Çok sık istek gönderildi, biraz sonra tekrar dene.';
    case 'CONTENT_NOT_FOUND':
      return 'Bu kelime için içerik bulunamadı.';
    case 'PAYWALL_REQUIRED':
      return err.message || 'Bugünkü ücretsiz hakkını kullandın.';
    default:
      return 'İçerik şu an yüklenemedi.';
  }
}

function promptPremiumUpgrade(showDialog: (options: ShowDialogOptions) => void, goToProfile: () => void) {
  showDialog({
    variant: 'confirm',
    title: 'Kilitli içerik',
    message: 'Bu içeriği görmek için Premium’a geçebilirsin.',
    cancelText: 'Vazgeç',
    confirmText: 'Premium’a Git',
    onConfirm: goToProfile,
  });
}

/** Renders inline text with every `*word*`-marked span highlighted — used for
 * WordDNA/SentenceLab example sentences straight from the backend, which
 * mark the target word the same way the story text does. */
function renderMarkedText(text: string, color: string) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      return (
        <Text key={i} style={{ color, fontWeight: '700' }}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

type WordLabAccess =
  | { status: 'loading' }
  | { status: 'not-configured' }
  | { status: 'not-in-catalog' }
  | { status: 'error'; code: string; message: string; retryAfterSeconds?: number }
  | { status: 'ready'; data: WordLabResponse };

interface ContextTheme {
  name: string;
  color: string;
  keys: string[];
  keysTr: string[];
}

/** Same 16 topics as Canlı Kelime Ağı / Kelime Kartları hub, same order. */
const CONTEXTS: ContextTheme[] = [
  { name: 'Seyahat', color: '#a78bfa', keys: ['the coastal town', 'her passport photo', 'the mountain trail', 'the airport lounge', 'the old harbor'], keysTr: ['kıyı kasabası', 'pasaport fotoğrafı', 'dağ patikası', 'havaalanı salonu', 'eski liman'] },
  { name: 'Eğlence', color: '#f472b6', keys: ['the concert lights', 'the movie soundtrack', 'the theme park at night', 'the street performance', 'the fireworks show'], keysTr: ['konser ışıkları', 'filmin müzikleri', 'gece temalı park', 'sokak gösterisi', 'havai fişek gösterisi'] },
  { name: 'Sanat', color: '#fb923c', keys: ['the museum exhibit', 'her brushstrokes', 'the sculpture garden', 'the gallery lighting', 'his latest painting'], keysTr: ['müze sergisi', 'fırça darbeleri', 'heykel bahçesi', 'galeri aydınlatması', 'son tablosu'] },
  { name: 'Politika', color: '#60a5fa', keys: ['the speech she gave', 'the old parliament hall', 'the unity in the crowd', 'her closing statement', 'the historic agreement'], keysTr: ['yaptığı konuşma', 'eski meclis binası', 'kalabalıktaki birlik', 'kapanış konuşması', 'tarihi anlaşma'] },
  { name: 'Doğa', color: '#4ade80', keys: ['the sunrise over the valley', 'the wildflower field', 'the quiet forest trail', 'the autumn leaves', 'the calm lake'], keysTr: ['vadinin üzerindeki gün doğumu', 'kır çiçeği tarlası', 'sessiz orman patikası', 'sonbahar yaprakları', 'sakin göl'] },
  { name: 'Günlük Hayat', color: '#fbbf24', keys: ['her morning routine', 'the quiet Sunday afternoon', 'the small balcony garden', 'the neighborhood bakery', 'the walk home'], keysTr: ['sabah rutini', 'sessiz pazar öğleden sonrası', 'küçük balkon bahçesi', 'mahalledeki fırın', 'eve yürüyüş'] },
  { name: 'İş', color: '#60a5fa', keys: ['the finished presentation', 'the new office design', 'her leadership', "the team's teamwork", 'the product launch'], keysTr: ['tamamlanan sunum', 'yeni ofis tasarımı', 'liderliği', 'takımın uyumu', 'ürün lansmanı'] },
  { name: 'Sağlık', color: '#fb7185', keys: ['her recovery', 'the peaceful clinic garden', 'the morning yoga session', 'his steady progress', 'the fresh mountain air'], keysTr: ['iyileşme süreci', 'kliniğin sakin bahçesi', 'sabah yoga seansı', 'istikrarlı ilerlemesi', 'temiz dağ havası'] },
  { name: 'Duygular', color: '#f472b6', keys: ['the way she smiled', 'his quiet gratitude', 'the reunion moment', 'the letter she wrote', 'their friendship'], keysTr: ['gülümseyiş şekli', 'sessiz minnettarlığı', 'kavuşma anı', 'yazdığı mektup', 'arkadaşlıkları'] },
  { name: 'İlişkiler', color: '#e879f9', keys: ['their first date', 'the wedding ceremony', "her partner's support", 'the family dinner', 'their long friendship'], keysTr: ['ilk buluşmaları', 'düğün töreni', 'partnerinin desteği', 'aile yemeği', 'uzun süredir devam eden arkadaşlıkları'] },
  { name: 'Yemek', color: '#facc15', keys: ['the homemade pasta', 'the fresh bread', 'the spice market', 'the family recipe', 'the dessert table'], keysTr: ['ev yapımı makarna', 'taze ekmek', 'baharat pazarı', 'aile tarifi', 'tatlı masası'] },
  { name: 'Bilim', color: '#2dd4bf', keys: ["the lab's new discovery", "the telescope's image", 'the research results', 'the crystal structure', "the experiment's outcome"], keysTr: ['laboratuvarın yeni keşfi', 'teleskobun görüntüsü', 'araştırma sonuçları', 'kristal yapısı', 'deneyin sonucu'] },
  { name: 'Teknoloji', color: '#818cf8', keys: ["the app's new interface", "the device's design", 'the software update', "the robot's movement", 'the website layout'], keysTr: ['uygulamanın yeni arayüzü', 'cihazın tasarımı', 'yazılım güncellemesi', 'robotun hareketi', 'web sitesi düzeni'] },
  { name: 'Alışveriş', color: '#38bdf8', keys: ['the window display', 'the handmade jewelry', 'the vintage store', 'the new collection', 'the gift she picked'], keysTr: ['vitrin düzeni', 'el yapımı takılar', 'vintage mağaza', 'yeni koleksiyon', 'seçtiği hediye'] },
  { name: 'Spor', color: '#4ade80', keys: ['the winning goal', 'the stadium atmosphere', 'her final sprint', "the team's comeback", 'the championship trophy'], keysTr: ['galibiyet golü', 'stadyum atmosferi', 'son sprinti', 'takımın geri dönüşü', 'şampiyonluk kupası'] },
  { name: 'Eğitim', color: '#fbbf24', keys: ['the graduation ceremony', 'her handwriting', 'the school library', 'the science fair project', "the professor's lecture"], keysTr: ['mezuniyet töreni', 'el yazısı', 'okul kütüphanesi', 'bilim fuarı projesi', 'profesörün dersi'] },
];

const MAX_SELECTED_THEMES = 5;

function capFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface GeneratedItem {
  theme: ContextTheme;
  en: string;
  tr: string;
}

function buildGenerated(selected: ContextTheme[], wordEn: string, wordTr: string): GeneratedItem[] {
  const n = selected.length;
  const base = Math.floor(5 / n);
  const remainder = 5 % n;
  const items: GeneratedItem[] = [];
  selected.forEach((theme, tIdx) => {
    const count = base + (tIdx < remainder ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const key = theme.keys[i % theme.keys.length];
      const keyTr = theme.keysTr[i % theme.keysTr.length];
      items.push({
        theme,
        en: `${capFirst(key)} truly captured the feeling of "${wordEn}".`,
        tr: `${capFirst(keyTr)}, gerçekten "${wordTr}" hissini yansıtıyordu.`,
      });
    }
  });
  return items;
}

export default function WordDnaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recentWords } = useProgress();
  const { showDialog } = useDialog();
  const params = useLocalSearchParams<{ word?: string; returnTo?: string; returnWords?: string }>();

  const word = useMemo(
    () => getWordDetail(params.word ?? recentWords[0]?.en ?? 'beautiful'),
    [params.word, recentWords],
  );

  // router.back() can't reliably return to a tab-less root screen (like flashcards-practice)
  // once this tab-nested route has taken focus, since that pops the root stack back to it —
  // so callers that need a guaranteed return path pass returnTo/returnWords explicitly.
  const handleBack = () => {
    if (params.returnTo === 'flashcards-practice') {
      router.replace({ pathname: '/flashcards-practice', params: { source: 'raw', value: params.returnWords ?? '' } });
      return;
    }
    if (params.returnTo === 'learn-flashcards') {
      // learn/flashcards.tsx reads currentSession.targetWords directly (no route
      // params needed) — same cross-tree issue, same replace()-based fix.
      router.replace('/learn/flashcards');
      return;
    }
    router.back();
  };

  const [level, setLevel] = useState<LevelKey>('basic');
  const [tense, setTense] = useState<TenseKey>('present');
  const [labTrOpen, setLabTrOpen] = useState(false);
  const [selectedThemes, setSelectedThemes] = useState<number[]>([0]);
  const [generated, setGenerated] = useState<GeneratedItem[] | null>(null);
  const [openGenTr, setOpenGenTr] = useState<Set<number>>(new Set());

  // Phase 2A: real WordDNA/SentenceLab content + the word_id it lives under
  // (resolved once per word — see lib/phase2a-word-access.ts for why a
  // lookup is needed instead of a route param).
  const [wordId, setWordId] = useState<string | null | 'loading'>('loading');
  const [labAccess, setLabAccess] = useState<WordLabAccess>({ status: 'loading' });
  const [labReloadKey, setLabReloadKey] = useState(0);
  const [storyTrayOpen, setStoryTrayOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setWordId('loading');
    setLabAccess({ status: 'loading' });
    setLevel('basic');
    setTense('present');

    (async () => {
      if (!isSupabaseConfigured) {
        if (!cancelled) {
          setWordId(null);
          setLabAccess({ status: 'not-configured' });
        }
        return;
      }
      const resolvedId = await resolvePhase2aWordId(word.en);
      if (cancelled) return;
      setWordId(resolvedId);
      if (!resolvedId) {
        setLabAccess({ status: 'not-in-catalog' });
        return;
      }
      try {
        await ensurePhase2aWordMembership(resolvedId);
        const data = await phase2aApi.getWordLab(resolvedId);
        if (!cancelled) setLabAccess({ status: 'ready', data });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Phase2ARequestError) {
          setLabAccess({
            status: 'error',
            code: err.code,
            message: friendlyPhase2aErrorMessage(err),
            retryAfterSeconds: err.retryAfterSeconds,
          });
        } else {
          setLabAccess({ status: 'error', code: 'UNKNOWN', message: 'İçerik şu an yüklenemedi.' });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [word.en, labReloadKey]);

  const goToPremium = () => router.push('/profile');

  const handleLevelPress = (key: LevelKey) => {
    if (isTabLocked(labAccess, 'level', key)) {
      promptPremiumUpgrade(showDialog, goToPremium);
      return;
    }
    setLevel(key);
  };

  const handleTensePress = (key: TenseKey) => {
    if (isTabLocked(labAccess, 'tense', key)) {
      promptPremiumUpgrade(showDialog, goToPremium);
      return;
    }
    setTense(key);
  };

  const renderTenseChip = (t: { key: TenseKey; label: string }) => {
    const active = tense === t.key;
    const locked = isTabLocked(labAccess, 'tense', t.key);
    return (
      <Pressable
        key={t.key}
        onPress={() => handleTensePress(t.key)}
        style={[styles.tenseChip, active && !locked && styles.tenseChipActive]}
      >
        {locked ? <Feather name="lock" size={9} color={TOKENS.textFaint} style={styles.tenseChipLockIcon} /> : null}
        <Text
          style={[
            styles.tenseChipText,
            active && !locked && styles.tenseChipTextActive,
            locked && { color: TOKENS.textFaint },
          ]}
          numberOfLines={2}
        >
          {t.label}
        </Text>
      </Pressable>
    );
  };

  const openStoryTray = () => {
    if (typeof wordId !== 'string') {
      showDialog({
        variant: 'info',
        title: wordId === 'loading' ? 'Bir saniye…' : 'Hikâye mevcut değil',
        message:
          wordId === 'loading'
            ? 'Kelime bilgileri yükleniyor, lütfen tekrar dene.'
            : 'Bu kelime için hikâye içeriği şu an mevcut değil.',
      });
      return;
    }
    setStoryTrayOpen(true);
  };

  const wordDnaContent: Partial<Record<LevelKey, BilingualExample>> =
    labAccess.status === 'ready' ? labAccess.data.content.wordDna : {};
  const sentenceLabContent: Partial<Record<TenseKey, BilingualExample>> =
    labAccess.status === 'ready' ? labAccess.data.content.sentenceLab : {};
  const activeLevelExample = wordDnaContent[level];
  const activeTenseExample = sentenceLabContent[tense];
  const statusMeta = STATUS_META[word.status];
  const wordTrShort = word.tr.split(' / ')[0].split(' ')[0];

  const ringCircumference = 2 * Math.PI * 24;
  const ringOffset = ringCircumference * (1 - word.strength / 100);

  const toggleTheme = (idx: number) => {
    setSelectedThemes((prev) => {
      if (prev.includes(idx)) {
        if (prev.length <= 1) return prev;
        return prev.filter((i) => i !== idx);
      }
      if (prev.length >= MAX_SELECTED_THEMES) return prev;
      return [...prev, idx];
    });
  };

  const handleGenerate = () => {
    const selected = selectedThemes.map((i) => CONTEXTS[i]);
    setGenerated(buildGenerated(selected, word.en, wordTrShort));
    setOpenGenTr(new Set());
  };

  const closeGenerated = () => {
    setGenerated(null);
    setOpenGenTr(new Set());
  };

  const toggleGenTr = (idx: number) => {
    setOpenGenTr((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectedThemeNames = selectedThemes.map((i) => CONTEXTS[i].name).join(' + ');

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
            <Feather name="chevron-left" size={13} color={TOKENS.textDim} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            WordDNA ve SentenceLab
          </Text>
        </View>

        <Panel>
          <View style={styles.wordTop}>
            <BrainIcon size={60} />
            <View style={styles.wordMain}>
              <Text style={styles.wordTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>
                {word.en}
              </Text>
              <Text style={styles.wordPhon} numberOfLines={1}>
                {word.phonetic || ' '}
              </Text>
              <View style={styles.speakBtn}>
                <Feather name="volume-2" size={12} color="#fff" />
              </View>
            </View>
            <View style={styles.wordSide}>
              <View style={styles.wordSideRow}>
                <Text style={styles.wordSideLbl}>Durum</Text>
                <View style={[styles.statusPill, { backgroundColor: statusMeta.bg, borderColor: statusMeta.border }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusMeta.color, shadowColor: statusMeta.color }]} />
                  <Text
                    style={[styles.statusPillText, { color: statusMeta.color }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {statusMeta.label}
                  </Text>
                </View>
              </View>
              <View style={styles.wordSideRow}>
                <Text style={styles.wordSideLbl}>Anlam</Text>
                <Text style={styles.wordSideVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {word.tr}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.exampleBox}>
            <View style={styles.levelSelect}>
              {LEVELS.map((l) => {
                const active = level === l.key;
                const locked = isTabLocked(labAccess, 'level', l.key);
                return (
                  <Pressable
                    key={l.key}
                    onPress={() => handleLevelPress(l.key)}
                    style={[
                      styles.levelSeg,
                      active && !locked && {
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        shadowColor: l.color,
                        shadowOpacity: 0.5,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 0 },
                      },
                    ]}
                  >
                    {locked ? (
                      <Feather name="lock" size={11} color={TOKENS.textFaint} />
                    ) : (
                      <LevelSegIcon segKey={l.key} color={active ? l.color : TOKENS.textDim} />
                    )}
                    <Text style={[styles.levelSegText, { color: locked ? TOKENS.textFaint : active ? l.color : TOKENS.textDim }]}>
                      {l.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.exampleLabelRow}>
              <Feather name="target" size={11} color={TOKENS.violetLight} />
              <Text style={styles.exampleLabel}>Örnek Cümle</Text>
              {labAccess.status === 'ready' ? (
                <Text style={styles.dailyUsageText} numberOfLines={1}>
                  Bugün {labAccess.data.dailyUsage.used}/{labAccess.data.dailyUsage.limit} kelime
                </Text>
              ) : null}
            </View>
            {labAccess.status === 'ready' && activeLevelExample?.en ? (
              <>
                <Text style={styles.exampleEn}>
                  {renderMarkedText(activeLevelExample.en, LEVELS.find((l) => l.key === level)!.color)}
                </Text>
                <Text style={styles.exampleTrLabel}>Türkçesi</Text>
                <Text style={styles.exampleTr}>{activeLevelExample.tr ?? ''}</Text>
              </>
            ) : (
              <LabStatusMessage access={labAccess} onRetry={() => setLabReloadKey((k) => k + 1)} />
            )}
          </View>
        </Panel>

        <Panel>
          <View style={styles.storyPromoRow}>
            <Text style={styles.storyPromoIcon}>💡</Text>
            <Text style={styles.storyPromoText}>
              Biliyor muydunuz? Her kelimenin ilginç bir bilgisi ve bir hikayesi var!
            </Text>
          </View>
          <Pressable
            onPress={openStoryTray}
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : typeof wordId === 'string' ? 1 : 0.5 }]}
          >
            <LinearGradient
              colors={['#a78bfa', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.storyPromoBtn}
            >
              <Feather name="book-open" size={13} color="#fff" />
              <Text style={styles.storyPromoBtnText}>Kelimenin Hikayesi &amp; İlginç Bilgisi</Text>
            </LinearGradient>
          </Pressable>
        </Panel>

        <Panel>
          <Text style={styles.kbTitle}>Kelime Bilgileri</Text>
          <View style={styles.kbRow}>
            <View style={styles.kbStats}>
              <KbStat icon="calendar" val={word.lastSeenLabel} lbl="Son Görülme" />
              <KbStat icon="repeat" val={String(word.totalCount)} lbl="Total Count" />
              <KbStat icon="bar-chart-2" val={word.cefr} lbl="Zorluk Seviyesi" />
              <KbStat icon="book-open" val={String(word.reviewCount)} lbl="Review Count" />
            </View>
            <View>
              {/* No real spaced-repetition/memory algorithm exists yet (WL-004
                  Memory Engine sınırı) — labelled "Örnek" per the audit's own
                  suggested microcopy so this ring isn't read as a computed score. */}
              <Text style={styles.memoryScoreLbl}>Örnek Skor</Text>
              <View style={styles.memoryRingWrap}>
                <View style={styles.memoryRingGlow} />
                <Svg width={60} height={60} viewBox="0 0 58 58" style={{ transform: [{ rotate: '-90deg' }] }}>
                  <Defs>
                    <SvgLinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0%" stopColor="#c4b5fd" />
                      <Stop offset="100%" stopColor="#7c3aed" />
                    </SvgLinearGradient>
                  </Defs>
                  <Circle cx={29} cy={29} r={24} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
                  <Circle
                    cx={29}
                    cy={29}
                    r={24}
                    fill="none"
                    stroke="url(#ringGrad)"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeDasharray={`${ringCircumference}`}
                    strokeDashoffset={ringOffset}
                  />
                </Svg>
                <View style={styles.memoryRingLabel} pointerEvents="none">
                  <Text style={styles.memoryRingLabelText}>{word.strength}%</Text>
                </View>
              </View>
            </View>
          </View>
        </Panel>

        <Panel>
          <View style={styles.labTitleRow}>
            <View style={styles.labIcon}>
              <Feather name="git-branch" size={15} color={TOKENS.violetLight} />
            </View>
            <Text style={styles.labTitle}>Cümle laboratuvarı</Text>
          </View>

          <Text style={styles.labLabel}>Zaman Seç</Text>
          <View style={styles.tenseRows}>
            <View style={styles.tenseRowLine}>{TENSES.slice(0, 2).map(renderTenseChip)}</View>
            <View style={styles.tenseRowLine}>{TENSES.slice(2).map(renderTenseChip)}</View>
          </View>

          <View style={styles.labLabelRow}>
            <Text style={styles.labLabel}>Örnek</Text>
            <Pressable
              onPress={() => setLabTrOpen((v) => !v)}
              style={[styles.trToggleBtn, labTrOpen && styles.trToggleBtnActive]}
            >
              <Text style={[styles.trToggleBtnText, labTrOpen && styles.trToggleBtnTextActive]}>TR</Text>
            </Pressable>
          </View>
          <View style={styles.labExampleBox}>
            {labAccess.status === 'ready' && activeTenseExample?.en ? (
              <>
                <Text style={styles.labExampleText}>{renderMarkedText(activeTenseExample.en, TOKENS.violetLight)}</Text>
                {labTrOpen ? <Text style={styles.labExampleTr}>{activeTenseExample.tr ?? ''}</Text> : null}
              </>
            ) : (
              <LabStatusMessage access={labAccess} onRetry={() => setLabReloadKey((k) => k + 1)} />
            )}
          </View>

          <Text style={styles.labLabel}>Bağlam Seç</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.contextRow}
          >
            {CONTEXTS.map((c, i) => {
              const active = selectedThemes.includes(i);
              return (
                <Pressable key={c.name} onPress={() => toggleTheme(i)} style={styles.contextItem}>
                  <View
                    style={[
                      styles.contextIcon,
                      active
                        ? {
                            backgroundColor: `${c.color}3d`,
                            borderColor: c.color,
                            borderWidth: 2,
                            shadowColor: c.color,
                            shadowOpacity: 0.6,
                            shadowRadius: 10,
                            shadowOffset: { width: 0, height: 0 },
                          }
                        : { backgroundColor: `${c.color}14`, borderColor: `${c.color}30`, borderWidth: 1 },
                    ]}
                  >
                    <ContextGlyph index={i} size={19} color={c.color} />
                    {active ? (
                      <View style={styles.contextCheckBadge}>
                        <Feather name="check" size={8} color="#0a2e1a" />
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.contextLabel} numberOfLines={2}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable onPress={handleGenerate} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
            <LinearGradient
              colors={['#a78bfa', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.generateBtn}
            >
              <Feather name="zap" size={13} color="#fff" />
              <Text style={styles.generateBtnText}>AI 5 Yeni Örnek Üret</Text>
            </LinearGradient>
          </Pressable>

          {generated ? (
            <View style={styles.generatedList}>
              <View style={styles.genHeaderRow}>
                <Text style={styles.generatedThemeTag} numberOfLines={2}>
                  {selectedThemeNames} bağlamında 5 yeni örnek:
                </Text>
                <Pressable onPress={closeGenerated} style={styles.genCloseBtn} hitSlop={6}>
                  <Feather name="x" size={11} color={TOKENS.textDim} />
                </Pressable>
              </View>
              {generated.map((item, i) => {
                const open = openGenTr.has(i);
                return (
                  <View key={i} style={styles.generatedItem}>
                    <View style={styles.genRow}>
                      <Text style={styles.genNum}>{i + 1}.</Text>
                      <Text style={styles.genSentence}>
                        <HighlightedSentence text={item.en} word={word.en} color={TOKENS.violetLight} />
                      </Text>
                      <Pressable onPress={() => toggleGenTr(i)} style={[styles.genTrBtn, open && styles.genTrBtnActive]}>
                        <Text style={[styles.genTrBtnText, open && styles.genTrBtnTextActive]}>TR</Text>
                      </Pressable>
                    </View>
                    {open ? <Text style={styles.genTrText}>{item.tr}</Text> : null}
                    <View style={styles.genThemeFooter}>
                      <View style={[styles.genThemePill, { borderColor: `${item.theme.color}55` }]}>
                        <Text style={[styles.genThemePillText, { color: item.theme.color }]}>{item.theme.name}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
        </Panel>

        <View style={styles.footerQuote}>
          <BrainIcon size={40} noPulse />
          <Text style={styles.footerText}>
            Bir kelimeyi bilmek, <Text style={styles.footerTextBold}>onu farklı bağlamlarda kullanabilmektir.</Text>
          </Text>
        </View>
      </ScrollView>

      <WordStoryTray
        visible={storyTrayOpen}
        wordId={typeof wordId === 'string' ? wordId : null}
        wordEn={word.en}
        onClose={() => setStoryTrayOpen(false)}
        onGoPremium={goToPremium}
      />
    </View>
  );
}

/** Glass panel with a subtle top highlight, matching the reference's inset-highlight glassmorphism. */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <LinearGradient
        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

/** Renders inline inside a parent <Text>, inheriting its font size/color — only the matched word gets its own color/weight. */
function HighlightedSentence({ text, word, color }: { text: string; word: string; color: string }) {
  const re = new RegExp(`\\b${word}\\b`, 'i');
  const match = text.match(re);
  if (!match) return <>{text}</>;
  const idx = match.index ?? 0;
  const before = text.slice(0, idx);
  const hit = match[0];
  const after = text.slice(idx + hit.length);
  return (
    <>
      {before}
      <Text style={{ color, fontWeight: '700' }}>{hit}</Text>
      {after}
    </>
  );
}

/** Shared loading/unconfigured/not-in-catalog/error states for the two
 * backend-driven panels (WordDNA level box + SentenceLab tense box). */
function LabStatusMessage({ access, onRetry }: { access: WordLabAccess; onRetry: () => void }) {
  if (access.status === 'loading') {
    return <Text style={styles.labStatusText}>Yükleniyor…</Text>;
  }
  if (access.status === 'not-configured' || access.status === 'not-in-catalog') {
    return (
      <Text style={styles.labStatusText}>
        {access.status === 'not-configured'
          ? 'İçerik şu an yüklenemedi.'
          : 'Bu kelime için WordDNA/SentenceLab içeriği henüz eklenmedi.'}
      </Text>
    );
  }
  if (access.status === 'error') {
    // access.message is already a friendly, fully-formed Turkish sentence
    // (see friendlyPhase2aErrorMessage) — including retryAfterSeconds for
    // RATE_LIMITED — so it's shown as-is, no extra suffix needed.
    return (
      <View>
        <Text style={styles.labStatusText}>{access.message || 'İçerik şu an yüklenemedi.'}</Text>
        <Pressable onPress={onRetry} style={styles.labRetryBtn}>
          <Text style={styles.labRetryBtnText}>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }
  // access.status === 'ready' but this specific level/tense has no example
  // filled in yet (every content column is nullable) — never a crash, just
  // an honest "not written yet" note instead of a silently blank box.
  return <Text style={styles.labStatusText}>Bu seçim için örnek cümle henüz eklenmedi.</Text>;
}

function KbStat({ icon, val, lbl }: { icon: keyof typeof Feather.glyphMap; val: string; lbl: string }) {
  return (
    <View style={styles.kbStat}>
      <View style={styles.kbStatIcon}>
        <Feather name={icon} size={15} color={TOKENS.violetLight} />
      </View>
      <View style={styles.kbStatText}>
        <Text style={styles.kbStatVal} numberOfLines={1}>
          {val}
        </Text>
        <Text style={styles.kbStatLbl} numberOfLines={1}>
          {lbl}
        </Text>
      </View>
    </View>
  );
}

function BrainIcon({ size = 60, noPulse = false }: { size?: number; noPulse?: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (noPulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, noPulse]);

  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.95] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

  return (
    <View style={{ width: size, height: size }}>
      {!noPulse ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
              borderRadius: size / 2,
              backgroundColor: 'rgba(139,92,246,0.4)',
              shadowColor: '#8b5cf6',
              shadowOpacity: 0.8,
              shadowRadius: 12,
            },
          ]}
        />
      ) : null}
      <Svg width={size} height={size} viewBox="0 0 64 64" style={{ position: 'relative' }}>
        <Defs>
          <RadialGradient id="brainGlow" cx="50%" cy="45%" r="60%">
            <Stop offset="0%" stopColor="#c4b5fd" />
            <Stop offset="100%" stopColor="#4c1d95" />
          </RadialGradient>
        </Defs>
        <Path
          d="M32 8c-9 0-15 6-15 14 0 3 1 5 2 7-3 2-5 5-5 9 0 6 5 10 11 10h1c1 4 4 7 8 7s7-3 8-7h1c6 0 11-4 11-10 0-4-2-7-5-9 1-2 2-4 2-7 0-8-6-14-15-14z"
          fill="url(#brainGlow)"
          opacity={0.9}
        />
        <Circle cx={24} cy={22} r={1.3} fill="#fff" />
        <Circle cx={34} cy={18} r={1} fill="#fff" />
        <Circle cx={40} cy={28} r={1.3} fill="#fff" />
        <Circle cx={22} cy={34} r={1} fill="#fff" />
        <Circle cx={30} cy={40} r={1.3} fill="#fff" />
        <Circle cx={38} cy={38} r={1} fill="#fff" />
        <Path
          d="M24 22L34 18M34 18L40 28M40 28L38 38M22 34L30 40M30 40L38 38"
          stroke="#e9d5ff"
          strokeWidth={0.6}
          opacity={0.7}
          fill="none"
        />
      </Svg>
    </View>
  );
}

function LevelSegIcon({ segKey, color }: { segKey: 'basic' | 'mid' | 'advanced'; color: string }) {
  if (segKey === 'basic') {
    return (
      <Svg width={13} height={13} viewBox="0 0 16 16">
        <Path d="M8 1.8l1.1 3.9 3.9 1.1-3.9 1.1L8 11.8l-1.1-3.9-3.9-1.1 3.9-1.1L8 1.8z" fill={color} stroke="none" />
      </Svg>
    );
  }
  if (segKey === 'mid') {
    return (
      <Svg width={13} height={13} viewBox="0 0 16 16">
        <Circle cx={8} cy={8} r={5.5} fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeDasharray="2 2" />
      </Svg>
    );
  }
  return (
    <Svg width={13} height={13} viewBox="0 0 16 16">
      <Circle cx={8} cy={8} r={5.5} fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M5.5 8l1.8 1.8 3.2-3.6" stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ContextGlyph({ index, size = 19, color }: { index: number; size?: number; color: string }) {
  const dark = '#1a1230';
  switch (index) {
    case 0: // Seyahat
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M14 2L2 7.5l4.5 1.5L8 14l2-3.5L14 2zM7 9l3.5-3.5" fill={color} stroke="none" />
        </Svg>
      );
    case 1: // Eğlence
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M3 6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H9l-1.5 2L6 11H5a2 2 0 0 1-2-2V6z" fill={color} stroke="none" />
          <Circle cx={6} cy={7.3} r={0.8} fill={dark} stroke="none" />
          <Circle cx={10} cy={7.3} r={0.8} fill={dark} stroke="none" />
        </Svg>
      );
    case 2: // Sanat
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M8 2C4.5 2 2 4.5 2 8c0 2.5 2 4 4 4h1c.6 0 1-.4 1-1s-.4-1-1-1-1-.4-1-1 .4-1 1-1h2.5c1.9 0 3.5-1.6 3.5-3.5C13 3.8 10.8 2 8 2z" fill={color} stroke="none" />
          <Circle cx={5.5} cy={6} r={0.8} fill={dark} stroke="none" />
          <Circle cx={8} cy={4.7} r={0.8} fill={dark} stroke="none" />
          <Circle cx={10.3} cy={6} r={0.8} fill={dark} stroke="none" />
        </Svg>
      );
    case 3: // Politika
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Rect x={3} y={12} width={10} height={1.6} rx={0.5} fill={color} stroke="none" />
          <Rect x={4} y={7} width={1.6} height={5} fill={color} stroke="none" />
          <Rect x={7.2} y={7} width={1.6} height={5} fill={color} stroke="none" />
          <Rect x={10.4} y={7} width={1.6} height={5} fill={color} stroke="none" />
          <Path d="M8 2L2.5 5.5h11L8 2z" fill={color} stroke="none" />
        </Svg>
      );
    case 4: // Doğa
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M3 13c6 1 10-3 10-10-7 0-10 4-10 10z" fill={color} stroke="none" />
        </Svg>
      );
    case 5: // Günlük Hayat
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M2 7.5L8 2l6 5.5V14a1 1 0 0 1-1 1h-3v-4H6v4H3a1 1 0 0 1-1-1V7.5z" fill={color} stroke="none" />
        </Svg>
      );
    case 6: // İş
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M2 5.5a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 14 5.5V11a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11V5.5z" fill={color} stroke="none" />
          <Path d="M6 4V3.2A1.2 1.2 0 0 1 7.2 2h1.6A1.2 1.2 0 0 1 10 3.2V4" stroke={color} strokeWidth={1.3} fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 7: // Sağlık
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M8 14s-5.5-3.2-5.5-7A3 3 0 0 1 8 4.8 3 3 0 0 1 13.5 7c0 3.8-5.5 7-5.5 7z" fill={color} stroke="none" />
          <Path d="M6.7 7h1v-1.4h.6V7h1v1h-1v1.4h-.6V8h-1z" fill={dark} stroke="none" />
        </Svg>
      );
    case 8: // Duygular
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M8 13.5s-5.5-3.4-5.5-7.2C2.5 4 4.2 2.5 6.2 2.5c1.1 0 2.1.5 2.8 1.3.7-.8 1.7-1.3 2.8-1.3 2 0 3.7 1.5 3.7 3.8 0 3.8-5.5 7.2-5.5 7.2z" fill={color} stroke="none" />
        </Svg>
      );
    case 9: // İlişkiler
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M5 8.3S2 6.3 2 4.2C2 3 2.9 2.2 4 2.2c.7 0 1.3.3 1.7.8.4-.5 1-.8 1.7-.8 1.1 0 2 .8 2 2 0 2.1-3 4.1-4.4 4.1z" fill={color} stroke="none" />
          <Path d="M10.5 13.5s-3-2-3-4.1c0-1.2.9-2 2-2 .7 0 1.3.3 1.7.8.4-.5 1-.8 1.7-.8 1.1 0 2 .8 2 2 0 2.1-3 4.1-4.4 4.1z" fill={color} stroke="none" />
        </Svg>
      );
    case 10: // Yemek
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M5 2v5.2c0 .5-.4.9-.9.9H4v6h1V2zM6.3 2v3.5M7.3 2v3.5M6.3 5.5c0 1.4.4 2.6 1 2.6s1-1.2 1-2.6V2h-1v3.5zM7.3 8.1V14h-1V8.1" fill="none" stroke={color} strokeWidth={1} />
          <Path d="M11 2c-1.1 0-2 1.8-2 4s.9 3.6 2 3.9V14h1V2z" fill={color} stroke="none" />
        </Svg>
      );
    case 11: // Bilim
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M6.5 2h3M7 2v3.5l-3 6.5c-.4.9.3 1.8 1.2 1.8h5.6c.9 0 1.6-.9 1.2-1.8L9 5.5V2" fill={color} stroke="none" />
        </Svg>
      );
    case 12: // Teknoloji
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Rect x={4} y={4} width={8} height={8} rx={1.5} fill={color} stroke="none" />
          <Path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M13 3l-1.4 1.4M4.4 11.6L3 13" stroke={color} strokeWidth={1} strokeLinecap="round" />
        </Svg>
      );
    case 13: // Alışveriş
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M4 5h8l-.6 8.2a1 1 0 0 1-1 .8H5.6a1 1 0 0 1-1-.8L4 5z" fill={color} stroke="none" />
          <Path d="M6 5V4a2 2 0 0 1 4 0v1" fill="none" stroke={color} strokeWidth={1.2} />
        </Svg>
      );
    case 14: // Spor
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2z" fill={color} stroke="none" />
          <Path d="M8 5.3l1.3 1 1.4-.2.3 1.4 1.2.8-.8 1.2.2 1.4-1.4.1-.9 1.1-1.3-.6-1.3.6-.9-1.1-1.4-.1.2-1.4-.8-1.2 1.2-.8.3-1.4 1.4.2z" fill="#12331f" stroke="none" />
        </Svg>
      );
    default: // Eğitim
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M1.5 5.5L8 2.8l6.5 2.7L8 8.2 1.5 5.5z" fill={color} stroke="none" />
          <Path d="M4 6.8V10c0 1.1 1.8 2 4 2s4-.9 4-2V6.8" fill="none" stroke={color} strokeWidth={1.2} />
          <Path d="M14 5.8V9.5" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
        </Svg>
      );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TOKENS.bg },
  scroll: { paddingHorizontal: 18 },

  headerRow: { position: 'relative', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 42, marginBottom: 18 },
  backBtn: {
    position: 'absolute', left: 0, top: '50%', marginTop: -13,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Fraunces_700Bold', fontSize: 15.5, color: TOKENS.text, textAlign: 'center' },

  panel: {
    backgroundColor: TOKENS.panel, borderWidth: 1, borderColor: TOKENS.border,
    borderRadius: 18, padding: 16, marginBottom: 14, overflow: 'hidden',
  },

  wordTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 14 },
  wordMain: { flex: 1, minWidth: 0 },
  wordTitle: {
    fontFamily: 'Fraunces_700Bold', fontSize: 21, color: TOKENS.text, marginBottom: 3, letterSpacing: 0.2,
  },
  wordPhon: { fontFamily: 'Inter_400Regular', fontStyle: 'italic', fontSize: 12.5, color: TOKENS.violetLight, opacity: 0.75, marginBottom: 10 },
  speakBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#8b5cf6', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7c3aed', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  wordSide: { flexShrink: 0, maxWidth: 90, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: 'rgba(139,92,246,0.18)', alignItems: 'flex-end' },
  wordSideRow: { marginBottom: 20, alignItems: 'flex-end' },
  wordSideLbl: { fontFamily: 'Inter_400Regular', fontSize: 8.5, color: TOKENS.textFaint, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  wordSideVal: { fontFamily: 'Inter_700Bold', fontSize: 12, color: TOKENS.text },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, maxWidth: '100%' },
  statusDot: { width: 7, height: 7, borderRadius: 4, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  statusPillText: { fontFamily: 'Inter_700Bold', fontSize: 10, flexShrink: 1 },

  exampleBox: {
    backgroundColor: 'rgba(139,92,246,0.06)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)',
    borderRadius: 13, padding: 12,
  },
  levelSelect: {
    flexDirection: 'row', gap: 6, marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 11, padding: 4,
  },
  levelSeg: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8 },
  levelSegText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  exampleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  exampleLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, color: TOKENS.violetLight },
  dailyUsageText: { marginLeft: 'auto', fontFamily: 'Inter_600SemiBold', fontSize: 9.5, color: TOKENS.textFaint },
  exampleEn: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#fff', lineHeight: 18, marginBottom: 8 },
  exampleTrLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, color: TOKENS.pink, marginBottom: 3 },
  exampleTr: { fontFamily: 'Inter_400Regular', fontSize: 12.5, color: TOKENS.textDim, lineHeight: 17 },
  labStatusText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: TOKENS.textDim, lineHeight: 17 },
  labRetryBtn: {
    alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.16)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)',
  },
  labRetryBtnText: { fontFamily: 'Inter_700Bold', fontSize: 10.5, color: TOKENS.violetLight },

  storyPromoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  storyPromoIcon: { fontSize: 20, lineHeight: 22 },
  storyPromoText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12.5, lineHeight: 18, color: TOKENS.text },
  storyPromoBtn: {
    width: '100%', paddingVertical: 12, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    shadowColor: '#7c3aed', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  storyPromoBtnText: { fontFamily: 'Inter_700Bold', fontSize: 12.5, color: '#fff' },

  kbTitle: { fontFamily: 'Inter_700Bold', fontSize: 12, color: TOKENS.text, marginBottom: 16 },
  kbRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  kbStats: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, columnGap: 8 },
  kbStat: { flexBasis: '45%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  kbStatIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kbStatText: { minWidth: 0, flexShrink: 1 },
  kbStatVal: { fontFamily: 'Inter_700Bold', fontSize: 12, color: TOKENS.textDim, lineHeight: 15 },
  kbStatLbl: { fontFamily: 'Inter_400Regular', fontSize: 9.5, color: TOKENS.textFaint, marginTop: 4 },

  memoryScoreLbl: { fontFamily: 'Inter_700Bold', fontSize: 8, color: TOKENS.violetLight, textAlign: 'center', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  memoryRingWrap: { width: 60, height: 60 },
  memoryRingGlow: {
    position: 'absolute', top: -8, left: -8, right: -8, bottom: -8, borderRadius: 38,
    backgroundColor: 'rgba(139,92,246,0.35)', opacity: 0.7,
  },
  memoryRingLabel: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  memoryRingLabelText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' },

  labTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  labIcon: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: 'rgba(167,139,250,0.2)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8b5cf6', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
  },
  labTitle: { fontFamily: 'Fraunces_700Bold', fontSize: 15, color: TOKENS.text },
  labLabel: { fontFamily: 'Inter_700Bold', fontSize: 10.5, color: TOKENS.textDim, marginBottom: 8 },
  labLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  trToggleBtn: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, backgroundColor: 'rgba(139,92,246,0.16)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)' },
  trToggleBtnActive: { backgroundColor: '#8b5cf6', borderColor: 'rgba(255,255,255,0.2)' },
  trToggleBtnText: { fontFamily: 'Inter_700Bold', fontSize: 9.5, color: TOKENS.violetLight },
  trToggleBtnTextActive: { color: '#fff' },

  tenseRows: { gap: 6, marginBottom: 14 },
  tenseRowLine: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  tenseChip: {
    flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 3,
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tenseChipActive: { backgroundColor: 'rgba(139,92,246,0.22)', borderColor: 'rgba(139,92,246,0.55)' },
  tenseChipLockIcon: { marginRight: 2, flexShrink: 0 },
  tenseChipText: { flexShrink: 1, fontFamily: 'Inter_700Bold', fontSize: 9.5, color: TOKENS.textDim, textAlign: 'center' },
  tenseChipTextActive: { color: '#fff' },

  labExampleBox: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 12, marginBottom: 14,
  },
  labExampleText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, color: '#fff' },
  labExampleTr: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: TOKENS.pink, lineHeight: 17,
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(244,114,182,0.25)', borderStyle: 'dashed',
  },

  contextRow: { gap: 9, paddingVertical: 2, paddingBottom: 6, marginBottom: 16 },
  contextItem: { alignItems: 'center', gap: 6, width: 56 },
  contextIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  contextCheckBadge: {
    position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#4ade80', borderWidth: 2, borderColor: TOKENS.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  contextLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, color: TOKENS.textDim, textAlign: 'center', lineHeight: 11 },

  generateBtn: {
    width: '100%', paddingVertical: 13, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    shadowColor: '#7c3aed', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  generateBtnText: { fontFamily: 'Inter_700Bold', fontSize: 12.5, color: '#fff' },

  generatedList: { marginTop: 12, gap: 8 },
  genHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  generatedThemeTag: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 10, color: TOKENS.violetLight },
  genCloseBtn: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  generatedItem: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, padding: 10,
  },
  genRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  genNum: { fontFamily: 'Inter_700Bold', fontSize: 11, color: TOKENS.violetLight, marginTop: 1 },
  genSentence: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: TOKENS.textDim },
  genTrBtn: { flexShrink: 0, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, backgroundColor: 'rgba(139,92,246,0.16)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)', marginLeft: 6 },
  genTrBtnActive: { backgroundColor: '#8b5cf6', borderColor: 'rgba(255,255,255,0.2)' },
  genTrBtnText: { fontFamily: 'Inter_700Bold', fontSize: 8.5, color: TOKENS.violetLight },
  genTrBtnTextActive: { color: '#fff' },
  genTrText: {
    fontFamily: 'Inter_400Regular', fontSize: 11, color: TOKENS.pink, lineHeight: 16,
    marginTop: 6, paddingTop: 6, marginLeft: 19, borderTopWidth: 1, borderTopColor: 'rgba(244,114,182,0.25)', borderStyle: 'dashed',
  },
  genThemeFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 },
  genThemePill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 6, paddingVertical: 1 },
  genThemePillText: { fontFamily: 'Inter_700Bold', fontSize: 8 },

  footerQuote: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8, marginTop: 10 },
  footerText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, color: TOKENS.textDim },
  footerTextBold: { fontFamily: 'Inter_700Bold', color: TOKENS.violetLight },
});
