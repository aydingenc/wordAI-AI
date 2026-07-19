import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashcardsPractice } from '@/components/FlashcardsPractice';
import { NETWORK_THEMES } from '@/app/word-network';
import {
  ALL_WORD_ENTRIES,
  RECENT_WORDS,
  WordLevelKey,
  wordsByLevel,
  wordsByStatus,
  wordsByType,
} from '@/data/mock';

type Source = 'all' | 'level' | 'theme' | 'status' | 'type' | 'raw';

function resolveWords(source: string | undefined, value: string | undefined): string[] {
  switch (source as Source) {
    case 'raw':
      return (value ?? '').split(',').filter(Boolean);
    case 'all':
      return ALL_WORD_ENTRIES.map((w) => w.en);
    case 'level':
      return wordsByLevel((value as WordLevelKey) ?? 'beginner').map((w) => w.en);
    case 'theme': {
      const theme = NETWORK_THEMES.find((t) => t.name === value);
      return theme ? theme.words : ALL_WORD_ENTRIES.slice(0, 10).map((w) => w.en);
    }
    case 'status':
      return wordsByStatus((value as 'new' | 'learning' | 'mastered') ?? 'new').map((w) => w.en);
    case 'type':
      return wordsByType((value as 'verb' | 'noun' | 'adjective' | 'adverb' | 'pronoun') ?? 'verb').map((w) => w.en);
    default:
      return RECENT_WORDS.slice(0, 10).map((w) => w.en);
  }
}

export default function FlashcardsPracticeRoute() {
  const router = useRouter();
  const { source, value } = useLocalSearchParams<{ source?: string; value?: string }>();

  const words = resolveWords(source, value);
  const safeWords = words.length > 0 ? words : RECENT_WORDS.slice(0, 10).map((w) => w.en);

  return (
    <FlashcardsPractice
      words={safeWords}
      onBack={() => router.back()}
      onClose={() => router.back()}
      onComplete={() => router.back()}
    />
  );
}
