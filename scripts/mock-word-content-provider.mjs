// Deterministic, network-free mock provider for the Canonical 12.000 content
// build queue (Teknik Şartname sec. 8). Mirrors the style of
// supabase/functions/_shared/translation-provider.ts's MockTranslationProvider:
// same shape as a real provider response, zero network calls, fully
// deterministic so tests are repeatable. Never used against a real API key --
// this is the ONLY provider allowed to drive publish_canonical_content_build_
// result_service in tests, per the spec's explicit "gerçek provider çağrısı
// yapma" constraint.

const CATEGORIES = ['General', 'Daily Life', 'Technology', 'Nature', 'Relationships'];

function pick(list, seed) {
  return list[seed % list.length];
}

function hashSeed(word) {
  let seed = 0;
  for (let i = 0; i < word.length; i += 1) seed = (seed * 31 + word.charCodeAt(i)) >>> 0;
  return seed;
}

// Generates a schema-shaped payload for one candidate. Every field is
// deterministically derived from the word itself, so the same input always
// produces the same output (useful for idempotent test re-runs).
export function generateMockWordContentPayload(canonicalWord) {
  const word = canonicalWord.trim();
  const normalizedWord = word.toLowerCase();
  const seed = hashSeed(normalizedWord);
  const category = pick(CATEGORIES, seed);

  const sentenceWith = (label) => `This is the ${label} example sentence about *${word}* used in context.`;
  const sentenceTr = (label) => `Bu, *${word}* kelimesinin bağlam içinde kullanıldığı ${label} örnek cümledir.`;

  return {
    word,
    normalizedWord,
    pronunciation: `/${normalizedWord}/`,
    meaningTr: `${word} için örnek Türkçe anlam`,
    level: pick(['A2', 'B1', 'B2', 'C1'], seed),
    wordType: pick(['noun', 'verb', 'adjective', 'adverb'], seed),
    categories: [category],
    wordDna: {
      basic: { en: sentenceWith('basic'), tr: sentenceTr('temel') },
      mid: { en: sentenceWith('mid-level'), tr: sentenceTr('orta seviye') },
      advanced: { en: sentenceWith('advanced'), tr: sentenceTr('ileri seviye') },
    },
    sentenceLab: {
      present: { en: sentenceWith('present tense'), tr: sentenceTr('şimdiki zaman') },
      presentContinuous: { en: sentenceWith('present continuous'), tr: sentenceTr('şimdiki zaman sürekli') },
      past: { en: sentenceWith('past tense'), tr: sentenceTr('geçmiş zaman') },
      future: { en: sentenceWith('future tense'), tr: sentenceTr('gelecek zaman') },
      presentPerfect: { en: sentenceWith('present perfect'), tr: sentenceTr('yakın geçmiş zaman') },
    },
    storyEn: [
      `In a quiet town, someone discovered the true meaning of *${word}* through a small, everyday moment.`,
      `The idea of *${word}* kept returning as the story unfolded, tying its scenes together.`,
      `By the end, *${word}* had become the one word that explained everything that happened.`,
    ].join('\n\n'),
    aiContext: `A short story illustrating ${word} in three connected everyday scenes.`,
  };
}

const TENSE_FIELDS = ['present', 'presentContinuous', 'past', 'future', 'presentPerfect'];
const DNA_FIELDS = ['basic', 'mid', 'advanced'];

// Sec. 8.5 schema/content validation. Throws a WordContentValidationError with
// a stable `code` on the first violation found.
export class WordContentValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'WordContentValidationError';
  }
}

function fail(code, message) {
  throw new WordContentValidationError(code, message);
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') fail('MISSING_FIELD', `${fieldName} is missing or empty`);
}

function requireWordAppears(text, word, fieldName) {
  if (!text.toLowerCase().includes(word.toLowerCase())) {
    fail('TARGET_WORD_MISSING', `${fieldName} does not contain the target word "${word}"`);
  }
}

export function validateWordContentPayload(payload, expectedNormalizedWord) {
  if (!payload || typeof payload !== 'object') fail('INVALID_PAYLOAD', 'payload must be an object');

  requireNonEmptyString(payload.word, 'word');
  requireNonEmptyString(payload.normalizedWord, 'normalizedWord');
  if (payload.normalizedWord !== expectedNormalizedWord) {
    fail('NORMALIZED_WORD_MISMATCH', `expected normalizedWord=${expectedNormalizedWord}, got ${payload.normalizedWord}`);
  }
  requireNonEmptyString(payload.meaningTr, 'meaningTr');
  requireNonEmptyString(payload.pronunciation, 'pronunciation');
  if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(payload.level)) fail('INVALID_LEVEL', `invalid level ${payload.level}`);
  requireNonEmptyString(payload.wordType, 'wordType');
  if (!Array.isArray(payload.categories) || payload.categories.length === 0) fail('MISSING_CATEGORIES', 'categories must be a non-empty array');

  if (!payload.wordDna || typeof payload.wordDna !== 'object') fail('MISSING_FIELD', 'wordDna is missing');
  for (const field of DNA_FIELDS) {
    const entry = payload.wordDna[field];
    requireNonEmptyString(entry?.en, `wordDna.${field}.en`);
    requireNonEmptyString(entry?.tr, `wordDna.${field}.tr`);
    requireWordAppears(entry.en, payload.word, `wordDna.${field}.en`);
  }

  if (!payload.sentenceLab || typeof payload.sentenceLab !== 'object') fail('MISSING_FIELD', 'sentenceLab is missing');
  for (const field of TENSE_FIELDS) {
    const entry = payload.sentenceLab[field];
    requireNonEmptyString(entry?.en, `sentenceLab.${field}.en`);
    requireNonEmptyString(entry?.tr, `sentenceLab.${field}.tr`);
    requireWordAppears(entry.en, payload.word, `sentenceLab.${field}.en`);
  }

  requireNonEmptyString(payload.storyEn, 'storyEn');
  requireWordAppears(payload.storyEn, payload.word, 'storyEn');
  requireNonEmptyString(payload.aiContext, 'aiContext');

  if (/\d{3,}/.test(payload.storyEn)) fail('SUSPICIOUS_NUMERIC_CONTENT', 'storyEn contains an unexpected long digit run');

  const placeholderPattern = /\{\{|<placeholder>|\bTODO\b/i;
  const textFields = [
    payload.meaningTr, payload.storyEn, payload.aiContext,
    ...DNA_FIELDS.flatMap((field) => [payload.wordDna?.[field]?.en, payload.wordDna?.[field]?.tr]),
    ...TENSE_FIELDS.flatMap((field) => [payload.sentenceLab?.[field]?.en, payload.sentenceLab?.[field]?.tr]),
  ];
  if (textFields.some((text) => typeof text === 'string' && placeholderPattern.test(text))) {
    fail('PLACEHOLDER_CONTENT', 'payload contains placeholder markup');
  }

  return true;
}
