import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateCatalogCsv } from './phase2a-catalog.mjs';

const EXPECTED_MIGRATIONS = [
  'supabase/migrations/202607210001_phase2a_foundation.sql',
  'supabase/migrations/202607210002_move_legacy_content.sql',
  'supabase/migrations/202607210003_translation_jobs_and_rate_limits.sql',
  'supabase/migrations/202607210004_repair_science_null.sql',
  'supabase/migrations/202607210005_controlled_word_import.sql',
];
const REQUIRED_FILES = [
  ...EXPECTED_MIGRATIONS,
  'supabase/functions/get-word-lab/index.ts',
  'supabase/functions/open-word-story/index.ts',
  'supabase/functions/get-word-story-translation/index.ts',
  'supabase/tests/phase2a_access_control.sql',
  'supabase/tests/phase2a_premium_scenarios.sql',
  'supabase/tests/phase2a_catalog_validation.sql',
];
function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
function assertPattern(source, pattern, message) {
  if (!pattern.test(source)) throw new Error(`PREFLIGHT_FAILED: ${message}`);
}
try {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (!Number.isInteger(nodeMajor) || nodeMajor < 20) throw new Error('PREFLIGHT_FAILED: Node.js 20 or newer is required.');
  for (const path of REQUIRED_FILES) await access(resolve(path));
  const [config, functionEnv, packageJson, provider] = await Promise.all([
    readFile('supabase/config.toml', 'utf8'), readFile('supabase/functions/.env.example', 'utf8'),
    readFile('package.json', 'utf8').then(JSON.parse),
    readFile('supabase/functions/_shared/translation-provider.ts', 'utf8'),
  ]);
  assertPattern(config, /\[auth\][\s\S]*enable_anonymous_sign_ins\s*=\s*true/, 'anonymous auth is not enabled');
  assertPattern(config, /\[db\.seed\][\s\S]*sql_paths\s*=\s*\["\.\/seed\.sql"\]/, 'generated seed is not configured');
  assertPattern(functionEnv, /^TRANSLATION_PROVIDER=mock$/m, 'local provider must default to mock');
  assertPattern(functionEnv, /^TRANSLATION_LIVE_ENABLED=false$/m, 'live translation kill-switch must default to false');
  assertPattern(provider, /TRANSLATION_LIVE_ENABLED/, 'live translation provider is missing its kill-switch');
  if (packageJson.devDependencies?.supabase !== '2.109.1') throw new Error('PREFLIGHT_FAILED: Supabase CLI must be pinned to 2.109.1.');
  const catalogPath = argument('--catalog') ?? process.env.PHASE2A_WORDS_CSV;
  const catalog = catalogPath ? await validateCatalogCsv(catalogPath) : null;
  console.log('Phase 2A preflight passed:', {
    node: process.versions.node, migrations: EXPECTED_MIGRATIONS.length, edgeFunctions: 3,
    provider: 'mock', liveTranslationEnabled: false,
    ...(catalog ? { sourceRows: catalog.sourceRows, finalRowsAfterScienceRepair: catalog.finalRowsAfterScienceRepair,
      categories: catalog.categoryCount, translationCacheRowsImported: 0 }
      : { catalog: 'not supplied; pass --catalog before deployment' }),
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Phase 2A preflight failed.');
  process.exit(1);
}
