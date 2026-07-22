// WordLoop Canonical 12.000: joins the Phase 2A content source with the
// workbook's legacy->canonical mapping and produces the flat dataset the
// canonical backfill staging table expects.
//
// Source of truth: WordLoop_Canonical_12000_Teknik_Sartname.md (secs. 2-5) plus
// the user's "Ek not 1/2" corrections. Two independent files supply the data:
//   - words_import.csv (Phase 2A's original 8,000-row catalog minus science-null)
//     is where the real EN+TR content lives. WordLoop_Legacy_8000_Canonical_Map.csv
//     is the workbook's deterministic ID/grouping layer -- confirmed by its own
//     `source` column, which reads "words_import.csv" for 7,999 rows and
//     "repair_migration_202607210004" for the remaining one (science-null).
//   - The science-null row is not re-read from the migration file (parsing SQL
//     would be fragile); it is inlined below and must be kept in sync with
//     supabase/migrations/202607210004_repair_science_null.sql if that ever changes.

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseCsvLine, CATALOG_COLUMNS } from './phase2a-catalog.mjs';

export const SCIENCE_NULL_ROW = Object.freeze({
  id: 'science-null',
  word: 'null',
  category: 'Science',
  pronunciation: '/nʌl/',
  meaning: 'geçersiz, boş',
  level: 'C1',
  word_type: 'adjective',
  ex_basic_en: 'The experiment had a null result.',
  ex_basic_tr: 'Deneyin sonucu geçersizdi.',
  ex_mid_en: 'In statistics, a null hypothesis is a statement that there is no effect.',
  ex_mid_tr: 'İstatistikte, null hipotezi etkisiz olduğunu belirten bir ifadedir.',
  ex_adv_en: 'The researchers concluded that the null findings challenge the existing theories in the field.',
  ex_adv_tr: 'Araştırmacılar, geçersiz bulguların alandaki mevcut teorileri sorguladığını belirtti.',
  sp_present_en: 'The null value indicates no data.',
  sp_present_tr: 'Geçersiz değer veri olmadığını gösterir.',
  pres_cont_en: 'The scientists are testing the null hypothesis in their study.',
  pres_cont_tr: 'Bilim insanları, çalışmalarında null hipotezini test ediyorlar.',
  future_en: 'They will reject the null hypothesis if the results are significant.',
  future_tr: 'Sonuçlar önemliyse, null hipotezini reddedecekler.',
  past_en: 'The team found that the null results were unexpected.',
  past_tr: 'Ekip, geçersiz sonuçların beklenmedik olduğunu buldu.',
  pres_perf_en: 'The researchers have published their findings on the null effects.',
  pres_perf_tr: 'Araştırmacılar, geçersiz etkilerle ilgili bulgularını yayımladı.',
  story_en: [
    'In a statistics lab, Elif began with the *null* hypothesis: the new treatment had no measurable effect. While checking the dataset, she also found a *null* value from a disconnected sensor. She marked that value as missing instead of treating it as zero.',
    '',
    'After the data was cleaned, the evidence no longer supported the *null* hypothesis. The difference between the two groups was large enough for the team to reject the *null* and investigate why the treatment worked.',
    '',
    'In her report, Elif explained the distinction carefully. In a database, *null* can mean that a value is absent or unknown; in statistics, the *null* describes a starting claim of no effect. The same word appeared in two scientific settings, but its precise meaning depended on the context.',
  ].join('\n'),
  ai_context: 'The story contrasts null as a missing database value with the statistical null hypothesis.',
});

const LEGACY_MAP_COLUMNS = [
  'legacy_word_id', 'canonical_id', 'word', 'legacy_category', 'example_set_id',
  'story_variant_id', 'metadata_variant_id', 'is_canonical_default', 'source',
];

function fail(message) {
  throw new Error(`CANONICAL_CATALOG_FAILED: ${message}`);
}

async function readCsvRecords(path, expectedColumns) {
  const absolutePath = resolve(path);
  const source = await readFile(absolutePath, 'utf8');
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  if (lines.length === 0) fail(`${absolutePath} is empty`);
  const header = parseCsvLine(lines[0].replace(/^﻿/, ''), 1);
  if (expectedColumns) {
    if (header.length !== expectedColumns.length) {
      fail(`${absolutePath} header has ${header.length} columns; expected ${expectedColumns.length}`);
    }
    expectedColumns.forEach((column, index) => {
      if (header[index] !== column) fail(`${absolutePath} header column ${index + 1} must be ${column}, got ${header[index]}`);
    });
  }
  const rows = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line, index + 2);
    if (values.length !== header.length) fail(`${absolutePath} line ${index + 2} has ${values.length} columns; expected ${header.length}`);
    const record = {};
    header.forEach((column, columnIndex) => { record[column] = values[columnIndex]; });
    return record;
  });
  return { absolutePath, header, rows };
}

export function normalizeCanonicalWord(word) {
  return word
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[‘’‚‛′‵]/g, "'")
    .replace(/[‐‑‒–—―−]/g, '-')
    .replace(/\s+/g, ' ');
}

function slugify(normalizedWord, maxLength = 42) {
  const slug = normalizedWord
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.slice(0, maxLength).replace(/-+$/g, '') || 'w';
}

export function computeCanonicalId(normalizedWord) {
  const slug = slugify(normalizedWord);
  const hash = createHash('sha256').update(normalizedWord, 'utf8').digest('hex').slice(0, 8);
  return `cw-${slug}-${hash}`;
}

function normalizeForHash(value) {
  return (value ?? '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .replace(/[ \t]+/g, ' ');
}

function sha256Hex(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

const EXAMPLE_SET_FIELDS = [
  'ex_basic_en', 'ex_basic_tr', 'ex_mid_en', 'ex_mid_tr', 'ex_adv_en', 'ex_adv_tr',
  'sp_present_en', 'sp_present_tr', 'pres_cont_en', 'pres_cont_tr', 'future_en',
  'future_tr', 'past_en', 'past_tr', 'pres_perf_en', 'pres_perf_tr',
];

export function computeExampleSetContentHash(row) {
  return sha256Hex(JSON.stringify(EXAMPLE_SET_FIELDS.map((field) => normalizeForHash(row[field]))));
}

export function computeSenseContentHash({ pronunciation, meaning_tr: meaningTr, level, word_type: wordType }) {
  return sha256Hex(JSON.stringify([pronunciation, meaningTr, level, wordType].map(normalizeForHash)));
}

// Mirrors private.story_source_hash() in supabase/migrations/202607210002_move_legacy_content.sql
// so a JS-side sanity check can compare against the value Postgres will compute
// at apply time (the migration itself is the authoritative computation).
export function computeStorySourceHash(storyEn) {
  const normalized = normalizeForHash(storyEn).replace(/[ \t]+/g, ' ');
  return sha256Hex(normalized);
}

export async function loadContentSource(wordsImportCsvPath) {
  const { rows } = await readCsvRecords(wordsImportCsvPath, CATALOG_COLUMNS);
  const byId = new Map();
  for (const row of rows) {
    if (byId.has(row.id)) fail(`duplicate id ${row.id} in words_import.csv`);
    byId.set(row.id, row);
  }
  if (byId.has(SCIENCE_NULL_ROW.id)) fail('science-null must not already be present in words_import.csv');
  byId.set(SCIENCE_NULL_ROW.id, SCIENCE_NULL_ROW);
  if (byId.size !== 8000) fail(`content source has ${byId.size} rows; expected 8000 (7999 + science-null)`);
  return byId;
}

export async function loadLegacyMap(legacyMapCsvPath) {
  const { rows } = await readCsvRecords(legacyMapCsvPath, LEGACY_MAP_COLUMNS);
  if (rows.length !== 8000) fail(`legacy map has ${rows.length} rows; expected 8000`);
  return rows.map((row) => ({ ...row, is_canonical_default: row.is_canonical_default === 'true' }));
}

// Joins the two sources into one flat, staging-table-shaped dataset and runs
// every cross-file consistency check the backfill depends on. Throws loudly on
// any mismatch instead of silently trusting either file.
export async function buildCanonicalBackfillDataset({ wordsImportCsvPath, legacyMapCsvPath }) {
  const content = await loadContentSource(wordsImportCsvPath);
  const legacyRows = await loadLegacyMap(legacyMapCsvPath);

  const seenLegacyIds = new Set();
  const exampleSetGroups = new Map();
  const storyVariantGroups = new Map();
  const senseGroups = new Map();
  const canonicalDefaults = new Map();
  const canonicalIdMismatches = [];
  const records = [];

  for (const legacyRow of legacyRows) {
    const legacyWordId = legacyRow.legacy_word_id;
    if (seenLegacyIds.has(legacyWordId)) fail(`duplicate legacy_word_id ${legacyWordId} in legacy map`);
    seenLegacyIds.add(legacyWordId);

    const contentRow = content.get(legacyWordId);
    if (!contentRow) fail(`legacy_word_id ${legacyWordId} has no matching content row`);
    if (contentRow.word.trim().toLowerCase() !== legacyRow.word.trim().toLowerCase()) {
      fail(`word mismatch for ${legacyWordId}: content="${contentRow.word}" map="${legacyRow.word}"`);
    }

    const normalizedWord = normalizeCanonicalWord(contentRow.word);
    const computedCanonicalId = computeCanonicalId(normalizedWord);
    if (computedCanonicalId !== legacyRow.canonical_id) {
      canonicalIdMismatches.push({ legacyWordId, word: contentRow.word, expected: legacyRow.canonical_id, computed: computedCanonicalId });
    }

    const senseContentHash = computeSenseContentHash({
      pronunciation: contentRow.pronunciation,
      meaning_tr: contentRow.meaning,
      level: contentRow.level,
      word_type: contentRow.word_type,
    });
    const exampleSetContentHash = computeExampleSetContentHash(contentRow);

    const record = {
      legacy_word_id: legacyWordId,
      canonical_id: legacyRow.canonical_id,
      normalized_word: normalizedWord,
      word: contentRow.word,
      legacy_category: legacyRow.legacy_category,
      example_set_id: legacyRow.example_set_id,
      story_variant_id: legacyRow.story_variant_id,
      metadata_variant_id: legacyRow.metadata_variant_id,
      is_canonical_default: legacyRow.is_canonical_default,
      source: legacyRow.source,
      pronunciation: contentRow.pronunciation || null,
      meaning_tr: contentRow.meaning,
      level: contentRow.level || null,
      word_type: contentRow.word_type || null,
      sense_content_hash: senseContentHash,
      example_set_content_hash: exampleSetContentHash,
      story_en: contentRow.story_en,
      ai_context: contentRow.ai_context || null,
      ...Object.fromEntries(EXAMPLE_SET_FIELDS.map((field) => [field, contentRow[field]])),
    };
    records.push(record);

    // --- cross-row consistency checks -------------------------------------
    const exsGroup = exampleSetGroups.get(record.example_set_id) ?? { canonicalIds: new Set(), hashes: new Set() };
    exsGroup.canonicalIds.add(record.canonical_id);
    exsGroup.hashes.add(record.example_set_content_hash);
    exampleSetGroups.set(record.example_set_id, exsGroup);

    const stvGroup = storyVariantGroups.get(record.story_variant_id) ?? { canonicalIds: new Set(), count: 0 };
    stvGroup.canonicalIds.add(record.canonical_id);
    stvGroup.count += 1;
    storyVariantGroups.set(record.story_variant_id, stvGroup);

    const senseKey = `${record.canonical_id} ${record.metadata_variant_id}`;
    const senseGroup = senseGroups.get(senseKey) ?? { hashes: new Set() };
    senseGroup.hashes.add(record.sense_content_hash);
    senseGroups.set(senseKey, senseGroup);

    if (record.is_canonical_default) {
      if (canonicalDefaults.has(record.canonical_id)) {
        fail(`canonical ${record.canonical_id} has more than one is_canonical_default row`);
      }
      canonicalDefaults.set(record.canonical_id, record);
    }
  }

  for (const [exampleSetId, group] of exampleSetGroups) {
    if (group.canonicalIds.size !== 1) fail(`example_set_id ${exampleSetId} spans more than one canonical`);
    if (group.hashes.size !== 1) fail(`example_set_id ${exampleSetId} has divergent content across its legacy rows`);
  }
  for (const [storyVariantId, group] of storyVariantGroups) {
    if (group.canonicalIds.size !== 1) fail(`story_variant_id ${storyVariantId} spans more than one canonical`);
  }
  for (const [senseKey, group] of senseGroups) {
    if (group.hashes.size !== 1) fail(`sense group ${senseKey} has divergent metadata across its legacy rows`);
  }

  const distinctCanonicalIds = new Set(records.map((r) => r.canonical_id));
  for (const canonicalId of distinctCanonicalIds) {
    if (!canonicalDefaults.has(canonicalId)) fail(`canonical ${canonicalId} has no is_canonical_default row`);
  }

  const stats = {
    legacyRows: records.length,
    distinctCanonicalWords: distinctCanonicalIds.size,
    distinctExampleSets: exampleSetGroups.size,
    distinctStoryVariants: storyVariantGroups.size,
    distinctSensePairs: senseGroups.size,
    canonicalIdMismatches,
  };

  return { records, stats };
}
