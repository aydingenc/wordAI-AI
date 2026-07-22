import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { phase2aApi, Phase2ARequestError } from '@/lib/phase2a-api';
import type { StoryTranslationStatus } from '@/types/phase2a-api';

const TOKENS = {
  bg: '#08070f',
  panel: '#150f24',
  border: 'rgba(139,92,246,0.28)',
  violet: '#8b5cf6',
  violetLight: '#b39dfb',
  text: '#f6f4fc',
  textDim: '#a89fc2',
  textFaint: '#6f6685',
};

const MIN_PAGES = 2;
const MAX_PAGES = 4;
const MAX_TRANSLATION_ATTEMPTS = 6;

type StoryState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'not-configured' }
  | { status: 'paywall'; message: string }
  | { status: 'error'; message: string }
  | { status: 'ready'; storyEn: string; sourceHash: string; pages: string[] };

type TranslationState =
  | { status: 'locked' }
  | { status: 'loading' }
  | { status: 'ready'; storyTr: string }
  | { status: 'error'; message: string };

/** Splits English story text into 2-4 reading pages without ever cutting a
 * word/sentence — paragraph boundaries first, falling back to sentence
 * boundaries for single-paragraph stories, and finally a word-boundary
 * midpoint split as a last resort for unusually short content. */
function splitStoryIntoPages(storyEn: string): string[] {
  const normalized = storyEn.replace(/\r\n?/g, '\n').trim();
  if (!normalized) return [''];

  const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  if (paragraphs.length >= MIN_PAGES && paragraphs.length <= MAX_PAGES) return paragraphs;

  if (paragraphs.length > MAX_PAGES) {
    const perGroup = Math.ceil(paragraphs.length / MAX_PAGES);
    const groups: string[] = [];
    for (let i = 0; i < paragraphs.length; i += perGroup) {
      groups.push(paragraphs.slice(i, i + perGroup).join('\n\n'));
    }
    return groups;
  }

  // A single paragraph — split on sentence boundaries instead.
  const source = paragraphs[0] ?? normalized;
  const sentences = (source.match(/[^.!?]+[.!?]+(\s+|$)/g) ?? [source]).map((s) => s.trim()).filter(Boolean);

  if (sentences.length <= 1) {
    const words = source.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return [source, ''];
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }

  const targetPages = Math.min(MAX_PAGES, Math.max(MIN_PAGES, Math.ceil(sentences.length / 2)));
  const perPage = Math.ceil(sentences.length / targetPages);
  const grouped: string[] = [];
  for (let i = 0; i < sentences.length; i += perPage) {
    grouped.push(sentences.slice(i, i + perPage).join(' '));
  }
  return grouped;
}

/** Story text marks its target word as `*word*` (same markup the translation
 * preserves) — render every marked span highlighted instead of showing the
 * literal asterisks. */
function renderMarkedStoryText(text: string, color: string) {
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

function stripStoryMarkup(text: string): string {
  return text.replace(/\*/g, '');
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function WordStoryTray({
  visible,
  wordId,
  wordEn,
  onClose,
  onGoPremium,
}: {
  visible: boolean;
  wordId: string | null;
  wordEn: string;
  onClose: () => void;
  onGoPremium: () => void;
}) {
  const [storyState, setStoryState] = useState<StoryState>({ status: 'idle' });
  const [currentPage, setCurrentPage] = useState(0);
  const [translation, setTranslation] = useState<TranslationState>({ status: 'locked' });
  const [trVisible, setTrVisible] = useState(false);
  const [trHint, setTrHint] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const translationRequestId = useRef(0);

  const loadStory = async () => {
    if (!wordId) return;
    setStoryState({ status: 'loading' });
    setCurrentPage(0);
    setTranslation({ status: 'locked' });
    setTrVisible(false);
    setTrHint(null);
    try {
      const result = await phase2aApi.openWordStory(wordId);
      setStoryState({
        status: 'ready',
        storyEn: result.storyEn,
        sourceHash: result.sourceHash,
        pages: splitStoryIntoPages(result.storyEn),
      });
    } catch (err) {
      if (err instanceof Phase2ARequestError) {
        // PAYWALL_REQUIRED is the one code the server already sends a
        // hand-written Turkish message for — every other code arrives as a
        // raw/English string (e.g. message === 'WORD_NOT_IN_LIBRARY', or an
        // English rate-limit sentence), so those get a friendly local message
        // instead of ever showing err.message verbatim.
        if (err.code === 'PAYWALL_REQUIRED') {
          setStoryState({ status: 'paywall', message: err.message || 'Bugünkü ücretsiz hikâye hakkını kullandın.' });
          return;
        }
        if (err.code === 'NETWORK_ERROR') {
          setStoryState({ status: 'not-configured' });
          return;
        }
        if (err.code === 'RATE_LIMITED') {
          setStoryState({
            status: 'error',
            message: err.retryAfterSeconds
              ? `Çok sık istek gönderildi, ${err.retryAfterSeconds} sn sonra tekrar dene.`
              : 'Çok sık istek gönderildi, biraz sonra tekrar dene.',
          });
          return;
        }
        setStoryState({ status: 'error', message: 'Hikâye şu an yüklenemedi.' });
        return;
      }
      setStoryState({ status: 'error', message: 'Hikâye şu an yüklenemedi.' });
    }
  };

  // Load fresh every time the tray opens for a (possibly new) word; stop any
  // speech and reset local state so a previous word's story never leaks in.
  useEffect(() => {
    if (!visible) return;
    Speech.stop();
    setIsSpeaking(false);
    void loadStory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, wordId]);

  useEffect(() => {
    if (!visible) {
      Speech.stop();
      setIsSpeaking(false);
    }
  }, [visible]);

  useEffect(() => {
    Speech.stop();
    setIsSpeaking(false);
    setTrHint(null);
  }, [currentPage]);

  const pages = storyState.status === 'ready' ? storyState.pages : [];
  const isLastPage = pages.length > 0 && currentPage === pages.length - 1;

  const fetchTranslation = async (attempt: number, sourceHash: string) => {
    if (!wordId) return;
    const requestId = translationRequestId.current;
    setTranslation({ status: 'loading' });
    try {
      const result = await phase2aApi.getWordStoryTranslation(wordId, sourceHash);
      if (translationRequestId.current !== requestId) return; // superseded by a newer request
      if (result.translationStatus === 'completed') {
        setTranslation({ status: 'ready', storyTr: result.storyTr });
        setTrVisible(true);
        return;
      }
      if (attempt >= MAX_TRANSLATION_ATTEMPTS) {
        setTranslation({ status: 'error', message: 'Çeviri şu an hazırlanamadı, tekrar dene.' });
        return;
      }
      const retrySeconds = 'retryAfterSeconds' in result ? result.retryAfterSeconds : 2;
      await wait(Math.max(800, Math.min(retrySeconds * 1000, 4000)));
      if (translationRequestId.current !== requestId) return;
      await fetchTranslation(attempt + 1, sourceHash);
    } catch (err) {
      if (translationRequestId.current !== requestId) return;
      if (err instanceof Phase2ARequestError && err.code === 'STALE_SOURCE_HASH') {
        // The English story changed underneath us — reload it silently and
        // retry the translation once against the fresh hash.
        if (!wordId) return;
        try {
          const fresh = await phase2aApi.openWordStory(wordId);
          if (translationRequestId.current !== requestId) return;
          const freshPages = splitStoryIntoPages(fresh.storyEn);
          setStoryState({ status: 'ready', storyEn: fresh.storyEn, sourceHash: fresh.sourceHash, pages: freshPages });
          setCurrentPage(freshPages.length - 1);
          await fetchTranslation(attempt + 1, fresh.sourceHash);
        } catch {
          setTranslation({ status: 'error', message: 'Çeviri şu an hazırlanamadı, tekrar dene.' });
        }
        return;
      }
      setTranslation({ status: 'error', message: 'Çeviri şu an hazırlanamadı, tekrar dene.' });
    }
  };

  const handleTrPress = () => {
    if (!isLastPage) {
      setTrHint('Türkçe çeviri, hikâyenin son sayfasına ulaştığında açılacak.');
      return;
    }
    setTrHint(null);
    if (translation.status === 'ready') {
      setTrVisible((v) => !v);
      return;
    }
    if (translation.status === 'loading') return;
    if (storyState.status !== 'ready') return;
    translationRequestId.current += 1;
    void fetchTranslation(0, storyState.sourceHash);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    if (storyState.status !== 'ready') return;
    const pageText = stripStoryMarkup(storyState.pages[currentPage] ?? '');
    if (!pageText.trim()) return;
    Speech.speak(pageText, {
      language: 'en-US',
      pitch: 0.8,
      rate: 0.85,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
    setIsSpeaking(true);
  };

  const handleClose = () => {
    Speech.stop();
    setIsSpeaking(false);
    onClose();
  };

  const trLocked = !isLastPage;
  const trBusy = translation.status === 'loading';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={styles.tray}>
        <View style={styles.grabber} />

        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEmoji}>📖</Text>
            <Text style={styles.headerWord} numberOfLines={1}>
              {wordEn}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              onPress={toggleSpeech}
              disabled={storyState.status !== 'ready'}
              style={[styles.speakBtn, storyState.status !== 'ready' && styles.iconBtnDisabled]}
              hitSlop={6}
            >
              <Feather name={isSpeaking ? 'pause' : 'volume-2'} size={14} color="#fff" />
            </Pressable>
            <Pressable
              onPress={handleTrPress}
              disabled={trBusy}
              style={[styles.trBtn, trLocked && styles.trBtnLocked, trVisible && !trLocked && styles.trBtnActive]}
              hitSlop={6}
            >
              {trLocked ? <Feather name="lock" size={10} color={TOKENS.textFaint} style={styles.trBtnLockIcon} /> : null}
              <Text style={[styles.trBtnText, trLocked && styles.trBtnTextLocked, trVisible && !trLocked && styles.trBtnTextActive]}>
                TR
              </Text>
            </Pressable>
            <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={6}>
              <Feather name="x" size={14} color={TOKENS.textDim} />
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {storyState.status === 'loading' || storyState.status === 'idle' ? (
            <TrayMessage text="Hikâye yükleniyor…" />
          ) : null}

          {storyState.status === 'not-configured' ? (
            <TrayMessage text="Hikâye şu an yüklenemedi." onRetry={loadStory} />
          ) : null}

          {storyState.status === 'error' ? <TrayMessage text={storyState.message} onRetry={loadStory} /> : null}

          {storyState.status === 'paywall' ? (
            <View style={styles.paywallBox}>
              <Feather name="lock" size={22} color={TOKENS.violetLight} />
              <Text style={styles.paywallTitle}>Günlük ücretsiz hikâye hakkın bitti</Text>
              <Text style={styles.paywallText}>{storyState.message}</Text>
              <Pressable onPress={onGoPremium} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, width: '100%' }]}>
                <LinearGradient colors={['#a78bfa', '#7c3aed']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.paywallBtn}>
                  <Text style={styles.paywallBtnText}>Premium’a Geç</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : null}

          {storyState.status === 'ready' ? (
            <>
              <Text style={styles.storyText}>{renderMarkedStoryText(pages[currentPage] ?? '', TOKENS.violetLight)}</Text>

              {trHint ? <Text style={styles.trHintText}>{trHint}</Text> : null}

              {trVisible && translation.status === 'ready' ? (
                <View style={styles.trBlock}>
                  <Text style={styles.trBlockLabel}>Türkçesi</Text>
                  <Text style={styles.trBlockText}>{renderMarkedStoryText(translation.storyTr, '#f472b6')}</Text>
                </View>
              ) : null}

              {translation.status === 'loading' ? <Text style={styles.trStatusText}>Çeviri hazırlanıyor…</Text> : null}
              {translation.status === 'error' ? (
                <View style={styles.trBlock}>
                  <Text style={styles.trStatusText}>{translation.message}</Text>
                  <Pressable
                    onPress={() => {
                      if (storyState.status === 'ready') {
                        translationRequestId.current += 1;
                        void fetchTranslation(0, storyState.sourceHash);
                      }
                    }}
                    style={styles.trRetryBtn}
                  >
                    <Text style={styles.trRetryBtnText}>Tekrar dene</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>

        {storyState.status === 'ready' && pages.length > 1 ? (
          <View style={styles.pagerRow}>
            <Pressable
              disabled={currentPage === 0}
              onPress={() => setCurrentPage((p) => Math.max(0, p - 1))}
              style={[styles.pagerBtn, currentPage === 0 && styles.pagerBtnDisabled]}
            >
              <Feather name="chevron-left" size={15} color={TOKENS.violetLight} />
            </Pressable>
            <View style={styles.pagerDots}>
              {pages.map((_, i) => (
                <View key={i} style={[styles.pagerDot, i === currentPage && styles.pagerDotActive]} />
              ))}
            </View>
            <Text style={styles.pagerLabel}>
              {currentPage + 1} / {pages.length}
            </Text>
            <Pressable
              disabled={isLastPage}
              onPress={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
              style={[styles.pagerBtn, isLastPage && styles.pagerBtnDisabled]}
            >
              <Feather name="chevron-right" size={15} color={TOKENS.violetLight} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function TrayMessage({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <View style={styles.messageBox}>
      <Text style={styles.messageText}>{text}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.trRetryBtn}>
          <Text style={styles.trRetryBtnText}>Tekrar dene</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// Re-exported only so callers can narrow a raw translationStatus string if
// ever needed elsewhere — not used internally beyond typing fetchTranslation's retry branch.
export type { StoryTranslationStatus };

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,3,10,0.65)' },
  tray: {
    position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '62%',
    backgroundColor: TOKENS.panel, borderTopLeftRadius: 26, borderTopRightRadius: 26,
    borderWidth: 1, borderColor: TOKENS.border, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 22,
  },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.16)', alignSelf: 'center', marginBottom: 14 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  headerEmoji: { fontSize: 18 },
  headerWord: { fontFamily: 'Fraunces_700Bold', fontSize: 16, color: TOKENS.text, flexShrink: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },

  speakBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: TOKENS.violet, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnDisabled: { opacity: 0.4 },
  trBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.16)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)',
  },
  trBtnLocked: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' },
  trBtnActive: { backgroundColor: TOKENS.violet, borderColor: 'rgba(255,255,255,0.2)' },
  trBtnLockIcon: { marginRight: 3 },
  trBtnText: { fontFamily: 'Inter_700Bold', fontSize: 10.5, color: TOKENS.violetLight },
  trBtnTextLocked: { color: TOKENS.textFaint },
  trBtnTextActive: { color: '#fff' },
  closeBtn: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  body: { marginBottom: 6 },
  storyText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, color: '#fff' },

  trHintText: { fontFamily: 'Inter_400Regular', fontSize: 11.5, lineHeight: 16, color: TOKENS.textFaint, marginTop: 10, fontStyle: 'italic' },
  trBlock: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(244,114,182,0.25)', borderStyle: 'dashed' },
  trBlockLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#f472b6', marginBottom: 4 },
  trBlockText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, color: TOKENS.textDim },
  trStatusText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: TOKENS.textDim, marginTop: 10 },
  trRetryBtn: {
    alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.16)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)',
  },
  trRetryBtnText: { fontFamily: 'Inter_700Bold', fontSize: 10.5, color: TOKENS.violetLight },

  messageBox: { paddingVertical: 24, alignItems: 'flex-start' },
  messageText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, color: TOKENS.textDim },

  paywallBox: { alignItems: 'center', gap: 8, paddingVertical: 18 },
  paywallTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: TOKENS.text, textAlign: 'center', marginTop: 4 },
  paywallText: { fontFamily: 'Inter_400Regular', fontSize: 12.5, color: TOKENS.textDim, textAlign: 'center', lineHeight: 18, marginBottom: 6 },
  paywallBtn: { width: '100%', paddingVertical: 12, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  paywallBtnText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' },

  pagerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10 },
  pagerBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.1)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  pagerBtnDisabled: { opacity: 0.3 },
  pagerDots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  pagerDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#6f6685', opacity: 0.35 },
  pagerDotActive: { backgroundColor: '#b39dfb', opacity: 1, width: 6, height: 6, borderRadius: 3 },
  pagerLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, color: TOKENS.textDim, minWidth: 34, textAlign: 'center' },
});
