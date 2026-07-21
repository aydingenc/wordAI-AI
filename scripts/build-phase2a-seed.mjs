import { resolve } from 'node:path';
import { buildSeedFile } from './phase2a-catalog.mjs';

const args = process.argv.slice(2);
const positional = [];
let catalogOption;
let outputOption;
for (let index = 0; index < args.length; index += 1) {
  const value = args[index];
  if (value === '--catalog' || value === '--output') {
    const optionValue = args[index + 1];
    if (!optionValue || optionValue.startsWith('--')) {
      console.error(`Missing value for ${value}.`);
      process.exit(2);
    }
    if (value === '--catalog') catalogOption = optionValue;
    else outputOption = optionValue;
    index += 1;
  } else if (value.startsWith('--')) {
    console.error(`Unknown option: ${value}`);
    process.exit(2);
  } else positional.push(value);
}
if (positional.length > 2) {
  console.error(`Unexpected argument: ${positional[2]}`);
  process.exit(2);
}
const input = catalogOption ?? positional[0] ?? process.env.PHASE2A_WORDS_CSV;
const output = outputOption ?? positional[1] ?? 'supabase/seed.sql';
if (!input) {
  console.error('Usage: npm run phase2a:seed -- /absolute/path/to/words_import.csv [--output /path/to/seed.sql]');
  process.exit(2);
}
try {
  const result = await buildSeedFile(resolve(input), resolve(output));
  console.log('Phase 2A seed generated safely:', {
    sourceRows: result.sourceRows, finalRowsAfterScienceRepair: result.finalRowsAfterScienceRepair,
    categories: result.categoryCount, translationCacheRowsImported: 0,
    output: result.destination, sha256: result.checksum,
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Seed generation failed.');
  process.exit(1);
}
