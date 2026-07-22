export type TranslationStatus = 'missing' | 'processing' | 'completed' | 'failed' | 'stale';

export interface AccessClaim {
  decision: 'full' | 'preview' | 'allowed' | 'paywall';
  is_premium: boolean;
  daily_used: number;
  daily_limit: number;
  reset_at: string;
}

export interface LabPayload {
  word: Record<string, unknown>;
  wordDna: {
    basic?: Record<string, unknown>;
    mid?: Record<string, unknown>;
    advanced?: Record<string, unknown>;
  };
  sentenceLab: {
    present?: Record<string, unknown>;
    presentContinuous?: Record<string, unknown>;
    past?: Record<string, unknown>;
    future?: Record<string, unknown>;
    presentPerfect?: Record<string, unknown>;
  };
}

export function firstRpcRow<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function assertWordId(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value)) {
    throw new Error('INVALID_WORD_ID');
  }
  return value;
}

// Canonical 12.000: cw-{slug}-{8 hex}, e.g. cw-experience-53e5e7c5.
export function assertCanonicalWordId(value: unknown): string {
  if (typeof value !== 'string' || !/^cw-[a-z0-9](?:[a-z0-9-]{0,60})?-[0-9a-f]{8}$/.test(value)) {
    throw new Error('INVALID_CANONICAL_WORD_ID');
  }
  return value;
}

// stv-{slug}-{10 hex}, e.g. stv-experience-1a2b3c4d5e.
export function assertStoryVariantId(value: unknown): string {
  if (typeof value !== 'string' || !/^stv-[a-z0-9](?:[a-z0-9-]{0,60})?-[0-9a-f]{10}$/.test(value)) {
    throw new Error('INVALID_STORY_VARIANT_ID');
  }
  return value;
}

export function assertOptionalStoryVariantId(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return assertStoryVariantId(value);
}

export function assertSourceHash(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error('INVALID_SOURCE_HASH');
  }
  return value;
}

export function buildWordLabResponse(claim: AccessClaim, payload: LabPayload) {
  const dailyUsage = {
    used: claim.daily_used,
    limit: claim.daily_limit,
    resetAt: claim.reset_at,
  };

  if (claim.decision === 'preview') {
    return {
      accessMode: 'preview' as const,
      reason: 'DAILY_LIMIT_REACHED' as const,
      isPremium: false as const,
      dailyUsage,
      allowedTabs: {
        wordDna: ['basic'] as ['basic'],
        sentenceLab: ['present'] as ['present'],
      },
      word: payload.word,
      content: {
        wordDna: payload.wordDna.basic ? { basic: payload.wordDna.basic } : {},
        sentenceLab: payload.sentenceLab.present ? { present: payload.sentenceLab.present } : {},
      },
    };
  }

  if (claim.decision !== 'full') throw new Error('INVALID_LAB_ACCESS_DECISION');

  return {
    accessMode: 'full' as const,
    isPremium: claim.is_premium,
    dailyUsage,
    allowedTabs: {
      wordDna: ['basic', 'mid', 'advanced'] as ['basic', 'mid', 'advanced'],
      sentenceLab: [
        'present',
        'present_continuous',
        'past',
        'future',
        'present_perfect',
      ] as ['present', 'present_continuous', 'past', 'future', 'present_perfect'],
    },
    word: payload.word,
    content: {
      wordDna: payload.wordDna,
      sentenceLab: payload.sentenceLab,
    },
  };
}

export function normalizeStory(value: string): string {
  return value.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim();
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export class TranslationValidationError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'TranslationValidationError';
  }
}

function asteriskCount(value: string): number {
  return [...value].filter((character) => character === '*').length;
}

export function validateTranslation(source: string, translated: string): string {
  const cleanSource = normalizeStory(source);
  const cleanTranslation = normalizeStory(translated);

  if (!cleanTranslation) {
    throw new TranslationValidationError('EMPTY_TRANSLATION', 'Translation output was empty.');
  }

  const sourceStars = asteriskCount(cleanSource);
  const translatedStars = asteriskCount(cleanTranslation);
  if (translatedStars % 2 !== 0 || translatedStars !== sourceStars) {
    throw new TranslationValidationError(
      'MARKUP_MISMATCH',
      'Translation did not preserve balanced target-word emphasis.',
    );
  }

  if (cleanTranslation.length < Math.max(40, cleanSource.length * 0.25)) {
    throw new TranslationValidationError(
      'TRANSLATION_TOO_SHORT',
      'Translation output was unexpectedly short.',
    );
  }

  return cleanTranslation;
}
