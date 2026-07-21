import type {
  OpenWordStoryResponse,
  Phase2AApiError,
  WordLabResponse,
  WordStoryTranslationResponse,
} from '@/types/phase2a-api';
import { ensureAnonymousSession, supabase } from './supabase';

export class Phase2ARequestError extends Error {
  readonly code: Phase2AApiError['error']['code'] | 'NETWORK_ERROR';
  readonly status?: number;
  readonly retryAfterSeconds?: number;

  constructor(
    code: Phase2ARequestError['code'],
    message: string,
    options: { status?: number; retryAfterSeconds?: number } = {},
  ) {
    super(message);
    this.name = 'Phase2ARequestError';
    this.code = code;
    this.status = options.status;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

async function readFunctionError(error: unknown): Promise<Phase2ARequestError> {
  const context = typeof error === 'object' && error && 'context' in error
    ? (error as { context?: unknown }).context
    : null;
  const response = context instanceof Response ? context : null;
  if (response) {
    try {
      const body = await response.clone().json() as Phase2AApiError;
      if (body?.error?.code && body.error.message) {
        return new Phase2ARequestError(body.error.code, body.error.message, {
          status: response.status,
          retryAfterSeconds: body.error.retryAfterSeconds,
        });
      }
    } catch {
      // Fall through to a deliberately generic network error.
    }
  }
  return new Phase2ARequestError('NETWORK_ERROR', 'İstek tamamlanamadı. Lütfen tekrar dene.', {
    status: response?.status,
  });
}

async function invoke<T>(functionName: string, body: Record<string, string>): Promise<T> {
  if (!supabase) throw new Phase2ARequestError('NETWORK_ERROR', 'Supabase henüz yapılandırılmadı.');
  await ensureAnonymousSession();
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) throw await readFunctionError(error);
  return data as T;
}

export const phase2aApi = {
  getWordLab(wordId: string) {
    return invoke<WordLabResponse>('get-word-lab', { word_id: wordId });
  },
  openWordStory(wordId: string) {
    return invoke<OpenWordStoryResponse>('open-word-story', { word_id: wordId });
  },
  getWordStoryTranslation(wordId: string, sourceHash: string) {
    return invoke<WordStoryTranslationResponse>('get-word-story-translation', {
      word_id: wordId,
      source_hash: sourceHash,
    });
  },
};
