import { spawnSync } from 'node:child_process';
import process from 'node:process';

const result = spawnSync(
  process.execPath,
  [
    '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',
    '--experimental-strip-types',
    '--test',
    'supabase/functions/tests/policy.test.ts',
    'supabase/tests/phase2a_static.test.mjs',
  ],
  { cwd: new URL('../', import.meta.url), stdio: 'inherit' },
);

process.exit(result.status ?? 1);
