import { spawnSync } from 'node:child_process';
import process from 'node:process';

const result = spawnSync(
  process.execPath,
  [
    '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',
    '--experimental-strip-types',
    '--test',
    'supabase/functions/tests/policy-v2.test.ts',
    'supabase/tests/canonical_catalog_unit.test.mjs',
    'supabase/tests/canonical_static.test.mjs',
    'supabase/tests/canonical_queue_algorithm.test.mjs',
    'supabase/tests/canonical_content_worker_simulation.test.mjs',
  ],
  { cwd: new URL('../', import.meta.url), stdio: 'inherit' },
);

process.exit(result.status ?? 1);
