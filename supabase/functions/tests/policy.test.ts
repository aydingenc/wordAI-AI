// @ts-nocheck -- Executed by Node 24 with type stripping; no Edge network calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWordLabResponse,
  normalizeStory,
  sha256Hex,
  validateTranslation,
} from '../_shared/policy.ts';
import {
  chunkTranslationText,
  MockTranslationProvider,
  TRANSLATION_LLM_MAX_CODE_POINTS,
} from '../_shared/translation-provider.ts';

const payload = {
  word: { id: 'science-null', text: 'null', category: 'Science' },
  wordDna: {
    basic: { en: 'basic-en', tr: 'basic-tr' },
    mid: { en: 'mid-en', tr: 'mid-tr' },
    advanced: { en: 'advanced-en', tr: 'advanced-tr' },
  },
  sentenceLab: {
    present: { en: 'present-en', tr: 'present-tr' },
    presentContinuous: { en: 'continuous-en', tr: 'continuous-tr' },
    past: { en: 'past-en', tr: 'past-tr' },
    future: { en: 'future-en', tr: 'future-tr' },
    presentPerfect: { en: 'perfect-en', tr: 'perfect-tr' },
  },
};

test('preview response physically omits every locked field', () => {
  const response = buildWordLabResponse(
    {
      decision: 'preview',
      is_premium: false,
      daily_used: 3,
      daily_limit: 3,
      reset_at: '2026-07-22T00:00:00+03:00',
    },
    payload,
  );

  assert.deepEqual(Object.keys(response.content.wordDna), ['basic']);
  assert.deepEqual(Object.keys(response.content.sentenceLab), ['present']);
  const serialized = JSON.stringify(response);
  for (const protectedValue of [
    'mid-en',
    'advanced-en',
    'continuous-en',
    'past-en',
    'future-en',
    'perfect-en',
  ]) {
    assert.equal(serialized.includes(protectedValue), false);
  }
});

test('full response includes all WordDNA and SentenceLab tabs', () => {
  const response = buildWordLabResponse(
    {
      decision: 'full',
      is_premium: true,
      daily_used: 3,
      daily_limit: 3,
      reset_at: '2026-07-22T00:00:00+03:00',
    },
    payload,
  );
  assert.equal(response.accessMode, 'full');
  assert.deepEqual(Object.keys(response.content.wordDna), ['basic', 'mid', 'advanced']);
  assert.deepEqual(Object.keys(response.content.sentenceLab), [
    'present',
    'presentContinuous',
    'past',
    'future',
    'presentPerfect',
  ]);
});

test('story normalization is stable across line endings and repeated spaces', async () => {
  const windows = ' First   *word*\r\n\r\nSecond\tline. ';
  const unix = 'First *word*\n\nSecond line.';
  assert.equal(normalizeStory(windows), unix);
  assert.equal(await sha256Hex(normalizeStory(windows)), await sha256Hex(normalizeStory(unix)));
});

test('translation validation preserves balanced target markup', () => {
  const source = 'A long story about *warm* feelings. '.repeat(8);
  const translated = 'Bu, *sıcak* duygular hakkında yeterince uzun bir hikâyedir. '.repeat(8);
  assert.equal(validateTranslation(source, translated), translated.trim());
  assert.throws(
    () => validateTranslation(source, translated.replace('*sıcak*', '*sıcak')),
    { code: 'MARKUP_MISMATCH' },
  );
  assert.throws(
    () => validateTranslation(source, '*x*'.repeat(8)),
    { code: 'TRANSLATION_TOO_SHORT' },
  );
});

test('mock provider is deterministic and never calls fetch', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error('network must not be called');
  };
  try {
    const provider = new MockTranslationProvider('Hazır *çeviri* metni yeterince uzundur.');
    const output = await provider.translate({
      sourceText: 'A *translation* story.',
      sourceLanguage: 'en',
      targetLanguage: 'tr',
    });
    assert.equal(output, 'Hazır *çeviri* metni yeterince uzundur.');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Translation LLM request chunks stay within v3 limits and preserve paragraphs', () => {
  const paragraphs = [
    'First *warm* paragraph. '.repeat(180),
    'Second paragraph keeps its own context. '.repeat(170),
    'Final paragraph.',
  ];
  const chunks = chunkTranslationText(paragraphs.join('\n\n'));
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => [...chunk].length <= TRANSLATION_LLM_MAX_CODE_POINTS));
  assert.equal(chunks.join('\n\n').replace(/\s+/g, ' ').trim(), paragraphs.join(' ').replace(/\s+/g, ' ').trim());
});
