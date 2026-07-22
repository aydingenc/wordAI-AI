import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const migration = async (name) => readFile(new URL(`migrations/${name}`, root), 'utf8');

test('word_search_aliases lives in private, not public, and has no anon/authenticated grant', async () => {
  const schema = await migration('202607220001_canonical_schema.sql');
  assert.match(schema, /create table if not exists private\.word_search_aliases/i);
  assert.doesNotMatch(schema, /create table if not exists public\.word_search_aliases/i);
  assert.match(schema, /revoke all on private\.word_search_aliases from public, anon, authenticated/i);
  assert.doesNotMatch(schema, /grant select on private\.word_search_aliases to (anon|authenticated)/i);
});

test('word_search_aliases primary key is the (normalized_alias, canonical_word_id) pair, not normalized_alias alone', async () => {
  const schema = await migration('202607220001_canonical_schema.sql');
  assert.match(schema, /primary key \(normalized_alias, canonical_word_id\)/);
  assert.doesNotMatch(schema, /normalized_alias text primary key/);
});

test('Ek not 1: canonical_word_senses uniqueness is the (canonical_word_id, content_hash) pair, never content_hash alone', async () => {
  const schema = await migration('202607220001_canonical_schema.sql');
  assert.match(schema, /unique \(canonical_word_id, content_hash\)/);
  assert.doesNotMatch(schema, /content_hash text not null unique/);
  assert.doesNotMatch(schema, /legacy_metadata_variant_id text unique/);
});

test('the 8 backfill invariants from sec. 5.8 are all asserted before the apply function returns', async () => {
  const sql = await migration('202607220002_backfill_legacy_to_canonical.sql');
  for (const expected of [
    'canonical_words expected=5132',
    'legacy_word_canonical_map expected=8000',
    'canonical_word_example_sets expected=7151',
    'canonical_word_story_variants expected=8000',
    'canonical_word_senses expected=5698',
    'orphan_foreign_keys expected=0',
    'published_without_defaults expected=0',
    'default_count_per_canonical_not_one',
  ]) {
    assert.match(sql, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Ek not 2: the hyphen/space reciprocal alias insert is generic (data-derived), not a hardcoded list of the 11 pairs', async () => {
  const sql = await migration('202607220002_backfill_legacy_to_canonical.sql');
  assert.match(sql, /replace\(a\.normalized_word, '-', ' '\)/);
  assert.match(sql, /replace\(a\.normalized_word, ' ', '-'\)/);
  assert.doesNotMatch(sql, /'date-night'/);
});

test('legacy story_tr never reaches either translation cache from the canonical migrations', async () => {
  const schema = await migration('202607220001_canonical_schema.sql');
  const backfill = await migration('202607220002_backfill_legacy_to_canonical.sql');
  const rpcs = await migration('202607220004_canonical_service_rpcs.sql');
  for (const sql of [schema, backfill]) {
    assert.doesNotMatch(sql, /insert\s+into\s+private\.canonical_story_translations/i);
  }
  // The only writers of canonical_story_translations are the job-claim/complete RPCs,
  // and even there the translated_text always comes from a provider-supplied parameter,
  // never from a literal story_tr / legacy archive column.
  assert.doesNotMatch(rpcs, /\bstory_tr\b/i);
  assert.doesNotMatch(rpcs, /legacy_story_translation_archive/i);
});

test('canonical schema does not touch or drop any Phase 2A V1 table', async () => {
  const schema = await migration('202607220001_canonical_schema.sql');
  const remap = await migration('202607220003_remap_user_data_and_grants.sql');
  for (const sql of [schema, remap]) {
    assert.doesNotMatch(sql, /drop\s+table/i);
    assert.doesNotMatch(sql, /drop\s+column/i);
    assert.doesNotMatch(sql, /alter\s+table\s+public\.user_words/i);
    assert.doesNotMatch(sql, /alter\s+table\s+public\.words\b/i);
  }
});

test('user_words/grant remap is additive (new canonical_* tables) and idempotent (on conflict everywhere it upserts)', async () => {
  const sql = await migration('202607220003_remap_user_data_and_grants.sql');
  assert.match(sql, /create table if not exists public\.canonical_user_words/);
  assert.match(sql, /create table if not exists private\.canonical_daily_access_buckets/);
  assert.match(sql, /create table if not exists private\.canonical_daily_word_access_grants/);
  assert.match(sql, /remap_user_words_to_canonical_service/);
  assert.match(sql, /remap_daily_grants_to_canonical_service/);
  assert.match(sql, /on conflict \(user_id, canonical_word_id\) do update/);
});

test('daily grant used_count is recomputed from distinct canonical grants, not carried over from the legacy per-word count', async () => {
  const sql = await migration('202607220003_remap_user_data_and_grants.sql');
  assert.match(sql, /select user_id, access_date, feature, count\(\*\)/);
  assert.match(sql, /group by user_id, access_date, feature/);
});

test('all new SECURITY DEFINER functions across the canonical migrations lock search_path and are service_role-only', async () => {
  const files = [
    '202607220001_canonical_schema.sql',
    '202607220002_backfill_legacy_to_canonical.sql',
    '202607220003_remap_user_data_and_grants.sql',
    '202607220004_canonical_service_rpcs.sql',
    '202607220005_word_content_build_queue.sql',
  ];
  const sql = (await Promise.all(files.map(migration))).join('\n');
  const definerCount = (sql.match(/security definer/gi) ?? []).length;
  const lockedPathCount = (sql.match(/set search_path = ''/gi) ?? []).length;
  assert.ok(definerCount >= 10, `expected at least 10 SECURITY DEFINER functions, found ${definerCount}`);
  assert.equal(lockedPathCount, definerCount);
  // claim_canonical_word_feature_access is the one function authenticated may call directly
  // (mirrors Phase 2A's claim_word_feature_access); everything else is service_role only.
  assert.match(sql, /grant execute on function public\.claim_canonical_word_feature_access\(text, text\) to authenticated/);
  const serviceRoleGrantCount = (sql.match(/to service_role/g) ?? []).length;
  assert.ok(serviceRoleGrantCount >= 10);
});

test('the content build queue never calls a real provider or writes a real API key -- only mock/testable RPC contracts', async () => {
  const sql = await migration('202607220005_word_content_build_queue.sql');
  assert.doesNotMatch(sql, /https?:\/\//);
  assert.doesNotMatch(sql, /gemini|openai|google.*api.*key/i);
  assert.match(sql, /publish_canonical_content_build_result_service/);
  assert.match(sql, /reject_canonical_content_build_job_service/);
});

test('claim_canonical_content_build_job_service checks the live DB before leasing (skip-existing) and uses skip locked for concurrency', async () => {
  const sql = await migration('202607220005_word_content_build_queue.sql');
  assert.match(sql, /for update skip locked/);
  assert.match(sql, /skipped_existing/);
});

test('publish_canonical_content_build_result_service re-checks the live DB immediately before writing (second check, sec. 8.8)', async () => {
  const sql = await migration('202607220005_word_content_build_queue.sql');
  const publishFnMatch = sql.match(/create or replace function public\.publish_canonical_content_build_result_service[\s\S]*?\n\$\$;/);
  assert.ok(publishFnMatch, 'publish function body not found');
  assert.match(publishFnMatch[0], /select 1 from public\.canonical_words cw where cw\.normalized_word = v_normalized_word/);
  assert.match(publishFnMatch[0], /skipped_existing/);
});
