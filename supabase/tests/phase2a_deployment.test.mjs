import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseCsvLine } from '../../scripts/phase2a-catalog.mjs';

test('catalog parser preserves quoted commas and escaped quotes', () => {
  assert.deepEqual(parseCsvLine('"word-id","hello, world","She said ""hello""."', 2),
    ['word-id', 'hello, world', 'She said "hello".']);
});
test('staging plan is local-only unless the explicit execute gate is supplied', () => {
  const plan = spawnSync(process.execPath, [
    'scripts/deploy-phase2a-staging.mjs', '--project-ref', 'abcdefghijklmnopqrst',
    '--catalog', '/not-read-in-plan.csv',
  ], { encoding: 'utf8' });
  assert.equal(plan.status, 0);
  assert.match(plan.stdout, /no command executed/i);
  const blocked = spawnSync(process.execPath, [
    'scripts/deploy-phase2a-staging.mjs', '--project-ref', 'abcdefghijklmnopqrst',
    '--catalog', '/not-read-without-confirmation.csv', '--execute',
  ], { encoding: 'utf8', env: { ...process.env, PHASE2A_DEPLOY_CONFIRM: '' } });
  assert.equal(blocked.status, 1);
  assert.match(blocked.stderr, /PHASE2A_DEPLOY_CONFIRM/);
});
test('versioned staging config enables anonymous auth and generated seed only', async () => {
  const [config, packageJson, deployScript] = await Promise.all([
    readFile(new URL('../config.toml', import.meta.url), 'utf8'),
    readFile(new URL('../../package.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../../scripts/deploy-phase2a-staging.mjs', import.meta.url), 'utf8'),
  ]);
  assert.match(config, /enable_anonymous_sign_ins\s*=\s*true/);
  assert.match(config, /sql_paths\s*=\s*\["\.\/seed\.sql"\]/);
  assert.equal(packageJson.devDependencies.supabase, '2.109.1');
  assert.match(deployScript, /TRANSLATION_PROVIDER=mock/);
  assert.match(deployScript, /TRANSLATION_LIVE_ENABLED=false/);
  assert.doesNotMatch(deployScript, /GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON_BASE64=/);
});
test('seed generator uses portable batched SQL and never populates translation cache', async () => {
  const generator = await readFile(new URL('../../scripts/phase2a-catalog.mjs', import.meta.url), 'utf8');
  assert.match(generator, /insert into private\.word_import_staging/);
  assert.match(generator, /apply_word_import_staging_service\(7999\)/);
  assert.match(generator, /set local standard_conforming_strings = on/);
  assert.doesNotMatch(generator, /insert into private\.story_translations/);
  assert.doesNotMatch(generator, /copy private\.word_import_staging/i);
});
