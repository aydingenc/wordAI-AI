// Network/file-free unit tests for the pure functions in
// scripts/canonical-catalog.mjs. The end-to-end join against the real source
// files is covered by scripts/canonical-preflight.mjs, which is run manually
// with explicit paths (the source files live outside the repo) -- see the
// canonical:preflight report in the PR description for that run's output.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCanonicalId,
  computeExampleSetContentHash,
  computeSenseContentHash,
  computeStorySourceHash,
  normalizeCanonicalWord,
} from '../../scripts/canonical-catalog.mjs';

test('normalizeCanonicalWord applies NFKC, trim, lowercase, smart-quote/dash folding, and space collapsing', () => {
  assert.equal(normalizeCanonicalWord('  Airport  '), 'airport');
  assert.equal(normalizeCanonicalWord('3D Printing'), '3d printing');
  assert.equal(normalizeCanonicalWord('date-night'), 'date-night');
  assert.equal(normalizeCanonicalWord('date‑night'), 'date-night'); // non-breaking hyphen
  assert.equal(normalizeCanonicalWord('teacher’s'), "teacher's"); // curly apostrophe
  assert.equal(normalizeCanonicalWord('a   b'), 'a b');
});

test('computeCanonicalId reproduces real workbook IDs for plain words', () => {
  assert.equal(computeCanonicalId(normalizeCanonicalWord('experience')), 'cw-experience-53e5e7c5');
  assert.equal(computeCanonicalId(normalizeCanonicalWord('3d')), 'cw-3d-da0568a2');
  assert.equal(computeCanonicalId(normalizeCanonicalWord('airport')), 'cw-airport-ccc9ff05');
});

test('computeSenseContentHash is stable for equal content and sensitive to any field change', () => {
  const base = { pronunciation: '/nʌl/', meaning_tr: 'geçersiz, boş', level: 'C1', word_type: 'adjective' };
  const hash = computeSenseContentHash(base);
  assert.equal(hash.length, 64);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(computeSenseContentHash({ ...base }), hash);
  assert.notEqual(computeSenseContentHash({ ...base, level: 'C2' }), hash);
});

test('computeExampleSetContentHash covers all 16 fields', () => {
  const fields = [
    'ex_basic_en', 'ex_basic_tr', 'ex_mid_en', 'ex_mid_tr', 'ex_adv_en', 'ex_adv_tr',
    'sp_present_en', 'sp_present_tr', 'pres_cont_en', 'pres_cont_tr', 'future_en',
    'future_tr', 'past_en', 'past_tr', 'pres_perf_en', 'pres_perf_tr',
  ];
  const base = Object.fromEntries(fields.map((f) => [f, `${f}-value`]));
  const hash = computeExampleSetContentHash(base);
  for (const field of fields) {
    const changed = { ...base, [field]: `${field}-different` };
    assert.notEqual(computeExampleSetContentHash(changed), hash, `${field} must affect the hash`);
  }
});

test('computeStorySourceHash is stable across CRLF/whitespace variation, matching private.story_source_hash()', () => {
  const unix = 'First *word*\n\nSecond line.';
  const windows = ' First   *word*\r\n\r\nSecond\tline. ';
  assert.equal(computeStorySourceHash(unix), computeStorySourceHash(windows));
  assert.match(computeStorySourceHash(unix), /^[0-9a-f]{64}$/);
});
