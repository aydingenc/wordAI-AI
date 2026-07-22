// Validates the Canonical 12.000 source files against every number in
// WordLoop_Canonical_12000_Teknik_Sartname.md section 2 (plus the "experience"
// control example and the Ek not 2 hyphen/space pairs) before any backfill SQL
// is generated. Run manually with explicit paths -- the source files live
// outside the repo, so this is not part of the network-free `node --test` suite.
//
// Usage:
//   node scripts/canonical-preflight.mjs \
//     --words-import <path/to/words_import.csv> \
//     --legacy-map <path/to/WordLoop_Legacy_8000_Canonical_Map.csv> \
//     --canonical-5132 <path/to/WordLoop_Canonical_5132.csv> \
//     --queue <path/to/WordLoop_6868_Yeni_500_Yedek_Kuyruk.csv>

import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { buildCanonicalBackfillDataset } from './canonical-catalog.mjs';
import { parseCsvLine } from './phase2a-catalog.mjs';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

async function readCsvRows(path) {
  const source = await readFile(path, 'utf8');
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  const header = parseCsvLine(lines[0].replace(/^﻿/, ''), 1);
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line, index + 2);
    return Object.fromEntries(header.map((column, columnIndex) => [column, values[columnIndex]]));
  });
}

function expect(label, actual, expected) {
  const pass = actual === expected;
  const marker = pass ? 'OK' : 'FAIL';
  console.log(`[${marker}] ${label}: got ${actual}, expected ${expected}`);
  return pass;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const required = ['words-import', 'legacy-map', 'canonical-5132', 'queue'];
  for (const key of required) {
    if (!args[key]) {
      console.error(`Missing --${key}`);
      process.exit(2);
    }
  }

  let allPass = true;

  console.log('== Building joined dataset from words_import.csv + legacy map ==');
  const { records, stats } = await buildCanonicalBackfillDataset({
    wordsImportCsvPath: args['words-import'],
    legacyMapCsvPath: args['legacy-map'],
  });

  allPass = expect('Toplam legacy satır', stats.legacyRows, 8000) && allPass;
  allPass = expect('Benzersiz canonical İngilizce başlık', stats.distinctCanonicalWords, 5132) && allPass;
  allPass = expect('Benzersiz tam örnek/zaman seti', stats.distinctExampleSets, 7151) && allPass;
  allPass = expect('Benzersiz İngilizce hikâye (story variant)', stats.distinctStoryVariants, 8000) && allPass;
  allPass = expect('Benzersiz anlam/metadata varyantı ((canonical,mdv) çifti — Ek not 1)', stats.distinctSensePairs, 5698) && allPass;

  const distinctMetadataVariantIdsAlone = new Set(records.map((r) => r.metadata_variant_id)).size;
  console.log(`[INFO] metadata_variant_id tek başına farklı değer sayısı (Ek not 1 karşılaştırması): ${distinctMetadataVariantIdsAlone} (beklenen 5693, çift sayımdan 5 az olmalı)`);
  if (distinctMetadataVariantIdsAlone !== 5693) {
    console.log('[FAIL] Ek not 1 beklenen 5693 farkı doğrulanamadı');
    allPass = false;
  } else {
    console.log('[OK] Ek not 1: distinct metadata_variant_id (5693) != distinct (canonical,mdv) pair (5698), sense unique key doğru şekilde çift olmalı');
  }

  console.log('\n== canonical_id determinism sanity check (workbook remains authoritative) ==');
  console.log(`[INFO] ${stats.canonicalIdMismatches.length} / ${records.length} rows: computed canonical_id != workbook canonical_id`);
  if (stats.canonicalIdMismatches.length > 0) {
    console.log('[INFO] sample mismatches (workbook ID is still used as source of truth):');
    for (const mismatch of stats.canonicalIdMismatches.slice(0, 5)) console.log('  ', mismatch);
  }

  console.log('\n== experience control example (spec sec. 2) ==');
  const experienceRows = records.filter((r) => r.word.trim().toLowerCase() === 'experience');
  const experienceCanonicalIds = new Set(experienceRows.map((r) => r.canonical_id));
  const experienceExampleSets = new Set(experienceRows.map((r) => r.example_set_id));
  const experienceStoryVariants = new Set(experienceRows.map((r) => r.story_variant_id));
  const experienceSenses = new Set(experienceRows.map((r) => `${r.canonical_id} ${r.metadata_variant_id}`));
  allPass = expect('experience: legacy kayıt', experienceRows.length, 15) && allPass;
  allPass = expect('experience: canonical kelime', experienceCanonicalIds.size, 1) && allPass;
  allPass = expect('experience: tam örnek/zaman seti', experienceExampleSets.size, 8) && allPass;
  allPass = expect('experience: İngilizce hikâye varyantı', experienceStoryVariants.size, 15) && allPass;
  allPass = expect('experience: anlam/metadata varyantı', experienceSenses.size, 4) && allPass;

  console.log('\n== Ek not 2: 11 hyphen/space reciprocal canonical pairs ==');
  const canonical5132Rows = await readCsvRows(args['canonical-5132']);
  allPass = expect('WordLoop_Canonical_5132.csv satır sayısı', canonical5132Rows.length, 5132) && allPass;
  const wordToCanonicalId = new Map(canonical5132Rows.map((r) => [r.word, r.canonical_id]));
  const pairs = [];
  const seenPairKeys = new Set();
  for (const [word, canonicalId] of wordToCanonicalId) {
    if (!word.includes('-')) continue;
    const spaceVariant = word.replace(/-/g, ' ');
    if (spaceVariant === word || !wordToCanonicalId.has(spaceVariant)) continue;
    const key = [word, spaceVariant].sort().join('|');
    if (seenPairKeys.has(key)) continue;
    seenPairKeys.add(key);
    pairs.push({ hyphen: word, hyphenId: canonicalId, space: spaceVariant, spaceId: wordToCanonicalId.get(spaceVariant) });
  }
  allPass = expect('tire/boşluk çift sayısı', pairs.length, 11) && allPass;
  for (const pair of pairs) console.log(`  ${pair.hyphen} (${pair.hyphenId})  <->  ${pair.space} (${pair.spaceId})`);

  console.log('\n== new-word / reserve queue ==');
  const queueRows = await readCsvRows(args.queue);
  const targetRows = queueRows.filter((r) => r.queue_type === 'TARGET');
  const reserveRows = queueRows.filter((r) => r.queue_type === 'RESERVE');
  allPass = expect('Yeni benzersiz canonical hedef (TARGET)', targetRows.length, 6868) && allPass;
  allPass = expect('Benzersiz yedek aday (RESERVE)', reserveRows.length, 500) && allPass;
  const queueIds = new Set(queueRows.map((r) => r.canonical_id));
  allPass = expect('kuyruk içindeki benzersiz canonical_id', queueIds.size, queueRows.length) && allPass;
  const existingIds = new Set(records.map((r) => r.canonical_id));
  const overlap = [...queueIds].filter((id) => existingIds.has(id));
  allPass = expect('mevcut 5.132 ile yeni 6.868+500 arasındaki exact çakışma', overlap.length, 0) && allPass;
  const finalTarget = stats.distinctCanonicalWords + targetRows.length;
  allPass = expect('nihai benzersiz hedef (5.132 + 6.868)', finalTarget, 12000) && allPass;

  console.log(`\n${allPass ? 'TÜM KONTROLLER GEÇTİ' : 'BAZI KONTROLLER BAŞARISIZ'}`);
  process.exit(allPass ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
