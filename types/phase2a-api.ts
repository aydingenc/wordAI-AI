export type WordLabAccessMode = 'full' | 'preview';
export type StoryTranslationStatus = 'missing' | 'processing' | 'completed' | 'failed';

export interface DailyUsage {
  used: number;
  limit: number;
  resetAt: string;
}

export interface BilingualExample {
  en?: string;
  tr?: string;
}

export interface WordMetadata {
  id: string;
  text: string;
  category: string;
  pronunciation?: string;
  meaning?: string;
  level?: string;
  wordType?: string;
}

export interface FullWordLabResponse {
  accessMode: 'full';
  isPremium: boolean;
  dailyUsage: DailyUsage;
  allowedTabs: {
    wordDna: ['basic', 'mid', 'advanced'];
    sentenceLab: ['present', 'present_continuous', 'past', 'future', 'present_perfect'];
  };
  word: WordMetadata;
  content: {
    wordDna: {
      basic?: BilingualExample;
      mid?: BilingualExample;
      advanced?: BilingualExample;
    };
    sentenceLab: {
      present?: BilingualExample;
      presentContinuous?: BilingualExample;
      past?: BilingualExample;
      future?: BilingualExample;
      presentPerfect?: BilingualExample;
    };
  };
}

export interface PreviewWordLabResponse {
  accessMode: 'preview';
  reason: 'DAILY_LIMIT_REACHED';
  isPremium: false;
  dailyUsage: DailyUsage;
  allowedTabs: {
    wordDna: ['basic'];
    sentenceLab: ['present'];
  };
  word: WordMetadata;
  content: {
    wordDna: { basic?: BilingualExample };
    sentenceLab: { present?: BilingualExample };
  };
}

export type WordLabResponse = FullWordLabResponse | PreviewWordLabResponse;

export interface OpenWordStoryResponse {
  storyAccess: 'allowed';
  storyEn: string;
  sourceHash: string;
  translationStatus: StoryTranslationStatus;
  translateUnlockRule: 'reach_last_page';
  retryAfterSeconds?: number;
}

export type WordStoryTranslationResponse =
  | { translationStatus: 'completed'; storyTr: string }
  | { translationStatus: 'processing'; retryAfterSeconds: number }
  | { translationStatus: 'failed'; retryAfterSeconds: number };

export interface Phase2AApiError {
  error: {
    code:
      | 'AUTH_REQUIRED'
      | 'INVALID_REQUEST'
      | 'WORD_NOT_IN_LIBRARY'
      | 'CONTENT_NOT_FOUND'
      | 'PAYWALL_REQUIRED'
      | 'STALE_SOURCE_HASH'
      | 'RATE_LIMITED'
      | 'INTERNAL_ERROR';
    message: string;
    retryAfterSeconds?: number;
  };
}
