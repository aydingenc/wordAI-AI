// @ts-nocheck -- Executed by Node 24 with type stripping; no Edge network calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertCanonicalWordId,
  assertOptionalStoryVariantId,
  assertStoryVariantId,
  buildWordLabResponse,
} from '../_shared/policy.ts';

test('assertCanonicalWordId accepts real workbook-shaped ids and rejects the rest', () => {
  assert.equal(assertCanonicalWordId('cw-experience-53e5e7c5'), 'cw-experience-53e5e7c5');
  assert.equal(assertCanonicalWordId('cw-3d-da0568a2'), 'cw-3d-da0568a2');
  for (const bad of ['experience-53e5e7c5', 'cw-experience', 'cw-experience-zzzzzzzz', '', null, 42, 'stv-experience-1a2b3c4d5e']) {
    assert.throws(() => assertCanonicalWordId(bad), { message: 'INVALID_CANONICAL_WORD_ID' });
  }
});

test('assertStoryVariantId accepts real workbook-shaped ids and rejects the rest', () => {
  assert.equal(assertStoryVariantId('stv-experience-1a2b3c4d5e'), 'stv-experience-1a2b3c4d5e');
  assert.equal(assertStoryVariantId('stv-3d-efee61d062'), 'stv-3d-efee61d062');
  for (const bad of ['cw-experience-53e5e7c5', 'stv-experience', 'stv-experience-zz', '']) {
    assert.throws(() => assertStoryVariantId(bad), { message: 'INVALID_STORY_VARIANT_ID' });
  }
});

test('assertOptionalStoryVariantId passes through undefined/null and validates otherwise', () => {
  assert.equal(assertOptionalStoryVariantId(undefined), undefined);
  assert.equal(assertOptionalStoryVariantId(null), undefined);
  assert.equal(assertOptionalStoryVariantId('stv-experience-1a2b3c4d5e'), 'stv-experience-1a2b3c4d5e');
  assert.throws(() => assertOptionalStoryVariantId('not-a-variant'), { message: 'INVALID_STORY_VARIANT_ID' });
});

test('buildWordLabResponse is payload-shape agnostic and works for canonical V2 payloads too', () => {
  const canonicalPayload = {
    word: { id: 'cw-experience-53e5e7c5', text: 'experience', meaning: 'deneyim' },
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

  const preview = buildWordLabResponse(
    { decision: 'preview', is_premium: false, daily_used: 3, daily_limit: 3, reset_at: '2026-07-23T00:00:00+03:00' },
    canonicalPayload,
  );
  assert.deepEqual(Object.keys(preview.content.wordDna), ['basic']);
  assert.deepEqual(Object.keys(preview.content.sentenceLab), ['present']);
  assert.equal(JSON.stringify(preview).includes('mid-en'), false);

  const full = buildWordLabResponse(
    { decision: 'full', is_premium: true, daily_used: 1, daily_limit: 3, reset_at: '2026-07-23T00:00:00+03:00' },
    canonicalPayload,
  );
  assert.equal(full.accessMode, 'full');
  assert.deepEqual(Object.keys(full.content.wordDna), ['basic', 'mid', 'advanced']);
});
