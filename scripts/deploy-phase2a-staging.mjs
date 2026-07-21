import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { buildSeedFile } from './phase2a-catalog.mjs';

const CLI_ENTRY = fileURLToPath(new URL('../node_modules/supabase/dist/supabase.js', import.meta.url));
const FUNCTIONS = ['get-word-lab', 'open-word-story', 'get-word-story-translation'];
const DATABASE_TESTS = [
  'supabase/tests/phase2a_access_control.sql',
  'supabase/tests/phase2a_premium_scenarios.sql',
  'supabase/tests/phase2a_catalog_validation.sql',
];
function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
function printPlan(projectRef, catalogPath) {
  console.log('Phase 2A mock-staging deployment plan (no command executed):');
  console.log(`  project: ${projectRef}`);
  console.log(`  catalog: ${catalogPath}`);
  console.log('  1. Run local Phase 2A tests and the 7,999-row catalog preflight');
  console.log('  2. Generate ignored supabase/seed.sql and link the staging project');
  console.log('  3. Run a remote migration dry-run');
  console.log('  4. Apply migrations and the validated 8,000-word seed');
  console.log('  5. Enable anonymous sign-ins from versioned config');
  console.log('  6. Force TRANSLATION_PROVIDER=mock and TRANSLATION_LIVE_ENABLED=false');
  console.log('  7. Deploy three Edge Functions with explicit JWT verification in code');
  console.log('  8. Run linked pgTAP access, premium-persona, and catalog tests');
  console.log('Google Translation LLM will not be called.');
  console.log(`To execute, set PHASE2A_DEPLOY_CONFIRM=mock-staging:${projectRef} and add --execute.`);
}
async function run(command, args, label) {
  console.log(`> ${label} ${args.join(' ')}`);
  await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd: process.cwd(), env: process.env, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${label} failed (code=${code ?? 'none'}, signal=${signal ?? 'none'}).`));
    });
  });
}
const runSupabase = (args) => run(process.execPath, [CLI_ENTRY, ...args], 'supabase');
const runNode = (args) => run(process.execPath, args, 'node');

const projectRef = argument('--project-ref') ?? process.env.SUPABASE_PROJECT_REF;
const catalogPath = argument('--catalog') ?? process.env.PHASE2A_WORDS_CSV;
const execute = process.argv.includes('--execute');
try {
  if (!projectRef || !/^[a-z0-9]{20}$/.test(projectRef)) throw new Error('Provide the 20-character staging project ref with --project-ref.');
  if (!catalogPath) throw new Error('Provide the source CSV with --catalog or PHASE2A_WORDS_CSV.');
  const absoluteCatalogPath = resolve(catalogPath);
  if (!execute) {
    printPlan(projectRef, absoluteCatalogPath);
    process.exit(0);
  }
  const expectedConfirmation = `mock-staging:${projectRef}`;
  if (process.env.PHASE2A_DEPLOY_CONFIRM !== expectedConfirmation) throw new Error(`Set PHASE2A_DEPLOY_CONFIRM exactly to ${expectedConfirmation}.`);
  await runNode(['scripts/test-phase2a.mjs']);
  await runNode(['scripts/phase2a-preflight.mjs', '--catalog', absoluteCatalogPath]);
  const seed = await buildSeedFile(absoluteCatalogPath, 'supabase/seed.sql');
  console.log('Validated seed ready:', {
    sourceRows: seed.sourceRows, finalRowsAfterScienceRepair: seed.finalRowsAfterScienceRepair,
    categories: seed.categoryCount, translationCacheRowsImported: 0, sha256: seed.checksum,
  });
  await runSupabase(['link', '--project-ref', projectRef, '--yes']);
  await runSupabase(['db', 'push', '--linked', '--include-seed', '--dry-run']);
  await runSupabase(['db', 'push', '--linked', '--include-seed', '--yes']);
  await runSupabase(['config', 'push', '--project-ref', projectRef, '--yes']);
  await runSupabase(['secrets', 'set', 'TRANSLATION_PROVIDER=mock', 'TRANSLATION_LIVE_ENABLED=false', '--project-ref', projectRef, '--yes']);
  await runSupabase(['functions', 'deploy', ...FUNCTIONS, '--project-ref', projectRef, '--no-verify-jwt', '--use-api', '--yes']);
  await runSupabase(['test', 'db', ...DATABASE_TESTS, '--linked']);
  console.log('Phase 2A mock staging deployment completed. Live Translation LLM remains disabled.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Phase 2A staging deployment failed.');
  process.exit(1);
}
