import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline';

export const CATALOG_COLUMNS = Object.freeze([
  'id', 'word', 'category', 'pronunciation', 'meaning', 'level', 'word_type',
  'ex_basic_en', 'ex_basic_tr', 'ex_mid_en', 'ex_mid_tr', 'ex_adv_en', 'ex_adv_tr',
  'sp_present_en', 'sp_present_tr', 'pres_cont_en', 'pres_cont_tr', 'future_en',
  'future_tr', 'past_en', 'past_tr', 'pres_perf_en', 'pres_perf_tr', 'story_en',
  'story_tr', 'ai_context',
]);

const REQUIRED_SOURCE_ROWS = 7_999;
const EXPECTED_CATEGORY_COUNT = 16;
const WORD_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

function fail(message) {
  throw new Error(`CATALOG_VALIDATION_FAILED: ${message}`);
}

export function parseCsvLine(line, lineNumber = 0) {
  const fields = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      fields.push(value);
      value = '';
    } else value += character;
  }
  if (quoted) fail(`line ${lineNumber} has an unterminated quoted field`);
  fields.push(value);
  return fields;
}

export async function validateCatalogCsv(inputPath) {
  const absolutePath = resolve(inputPath);
  const input = createReadStream(absolutePath, { encoding: 'utf8' });
  const lines = createInterface({ input, crlfDelay: Infinity });
  const ids = new Set();
  const categoryCounts = new Map();
  let lineNumber = 0;
  let sourceRows = 0;
  let storyRows = 0;
  let archivedTranslationRows = 0;

  for await (const line of lines) {
    lineNumber += 1;
    const values = parseCsvLine(line, lineNumber);
    if (lineNumber === 1) {
      values[0] = values[0].replace(/^\uFEFF/, '');
      if (values.length !== CATALOG_COLUMNS.length) fail(`header has ${values.length} columns; expected ${CATALOG_COLUMNS.length}`);
      CATALOG_COLUMNS.forEach((column, index) => {
        if (values[index] !== column) fail(`header column ${index + 1} must be ${column}`);
      });
      continue;
    }
    if (values.length !== CATALOG_COLUMNS.length) fail(`line ${lineNumber} has ${values.length} columns; expected ${CATALOG_COLUMNS.length}`);
    const id = values[0].trim();
    const word = values[1].trim();
    const category = values[2].trim();
    const storyEn = values[23].trim();
    const storyTr = values[24].trim();
    if (!id || !word || !category) fail(`line ${lineNumber} is missing id, word, or category`);
    if (!WORD_ID_PATTERN.test(id)) fail(`line ${lineNumber} has an invalid word id`);
    if (!storyEn) fail(`line ${lineNumber} is missing story_en`);
    if (ids.has(id)) fail(`duplicate id ${id}`);
    ids.add(id);
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    sourceRows += 1;
    storyRows += 1;
    if (storyTr) archivedTranslationRows += 1;
  }

  if (lineNumber === 0) fail('file is empty');
  if (sourceRows !== REQUIRED_SOURCE_ROWS) fail(`source row count is ${sourceRows}; expected ${REQUIRED_SOURCE_ROWS}`);
  if (categoryCounts.size !== EXPECTED_CATEGORY_COUNT) fail(`category count is ${categoryCounts.size}; expected ${EXPECTED_CATEGORY_COUNT}`);
  if (ids.has('science-null')) fail('science-null must be supplied only by migration 0004');
  for (const [category, count] of categoryCounts) {
    const expected = category === 'Science' ? 499 : 500;
    if (count !== expected) fail(`${category} has ${count} rows; expected ${expected}`);
  }
  return {
    absolutePath, sourceRows, storyRows, categoryCount: categoryCounts.size,
    archivedTranslationRows, finalRowsAfterScienceRepair: sourceRows + 1,
  };
}

export async function buildSeedFile(inputPath, outputPath) {
  const report = await validateCatalogCsv(inputPath);
  const source = await readFile(report.absolutePath, 'utf8');
  const checksum = createHash('sha256').update(source).digest('hex');
  const destination = resolve(outputPath);
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  const records = lines.slice(1).map((line, index) => parseCsvLine(line, index + 2));
  if (records.length !== report.sourceRows) fail('source row count changed while building seed');
  const sqlLiteral = (value) => {
    if (value.includes('\u0000')) fail('source contains a null byte');
    return `'${value.replaceAll("'", "''")}'`;
  };
  const batches = [];
  for (let offset = 0; offset < records.length; offset += 50) {
    const values = records.slice(offset, offset + 50)
      .map((record) => `  (${record.map(sqlLiteral).join(', ')})`).join(',\n');
    batches.push(`insert into private.word_import_staging (${CATALOG_COLUMNS.join(', ')}) values\n${values};`);
  }
  const sql = [
    '-- GENERATED by scripts/build-phase2a-seed.mjs. Do not edit or commit.',
    `-- source_sha256=${checksum}`, '', 'begin;', 'set local statement_timeout = 0;',
    'set local standard_conforming_strings = on;', 'truncate table private.word_import_staging;',
    ...batches, 'select public.apply_word_import_staging_service(7999);', 'commit;', '',
  ].join('\n');
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, sql, { encoding: 'utf8', mode: 0o600 });
  return { ...report, destination, checksum, outputBytes: Buffer.byteLength(sql) };
}
