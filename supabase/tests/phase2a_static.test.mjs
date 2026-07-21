import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const migration = async (name) => readFile(new URL(`migrations/${name}`, root), 'utf8');

test('legacy protected columns are moved and physically dropped from public.words', async () => {
  const sql = await migration('202607210002_move_legacy_content.sql');
  for (const column of ['ex_mid_en', 'ex_adv_en', 'past_en', 'future_en', 'story_en', 'story_tr']) {
    assert.match(sql, new RegExp(`drop column if exists ${column}`));
  }
  assert.match(sql, /revoke all on public\.words from anon, authenticated/i);
  assert.match(sql, /grant select on public\.words to anon, authenticated/i);
});

test('rejected story_tr values never seed the new translation cache', async () => {
  const moveSql = await migration('202607210002_move_legacy_content.sql');
  const jobsSql = await migration('202607210003_translation_jobs_and_rate_limits.sql');
  const importSql = await migration('202607210005_controlled_word_import.sql');
  assert.doesNotMatch(moveSql, /insert\s+into\s+private\.story_translations/i);
  assert.doesNotMatch(jobsSql, /select[\s\S]{0,200}\bstory_tr\b/i);
  assert.doesNotMatch(importSql, /insert\s+into\s+private\.story_translations/i);
});

test('all exposed privileged functions lock search_path and revoke public execution', async () => {
  const sql = [
    await migration('202607210001_phase2a_foundation.sql'),
    await migration('202607210002_move_legacy_content.sql'),
    await migration('202607210003_translation_jobs_and_rate_limits.sql'),
    await migration('202607210005_controlled_word_import.sql'),
  ].join('\n');
  const functionCount = (sql.match(/security definer/gi) ?? []).length;
  const lockedPathCount = (sql.match(/set search_path = ''/gi) ?? []).length;
  assert.ok(functionCount >= 8);
  assert.ok(lockedPathCount >= functionCount);
  assert.match(sql, /revoke all on function public\.claim_word_feature_access/i);
  assert.match(sql, /to service_role/i);
});

test('science-null repair has a clean target story and no Turkish cache insert', async () => {
  const sql = await migration('202607210004_repair_science_null.sql');
  assert.match(sql, /'science-null', 'null', 'Science'/);
  assert.doesNotMatch(sql, /\*nan\*/i);
  assert.match(sql, /\*null\* hypothesis/i);
  assert.doesNotMatch(sql, /private\.story_translations/i);
});

test('Google provider remains opt-in while local example defaults to mock', async () => {
  const provider = await readFile(new URL('functions/_shared/translation-provider.ts', root), 'utf8');
  const envExample = await readFile(new URL('functions/.env.example', root), 'utf8');
  assert.match(envExample, /^TRANSLATION_PROVIDER=mock$/m);
  assert.match(provider, /configured === 'google'/);
  assert.match(provider, /TRANSLATION_PROVIDER_NOT_CONFIGURED/);
  assert.doesNotMatch(provider, /AIza[0-9A-Za-z_-]{20,}/);
});
