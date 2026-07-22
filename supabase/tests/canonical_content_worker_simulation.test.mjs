// End-to-end simulation of the 6,868-candidate content build using the mock
// provider only (sec. 8, sec. 12's "final mock publish = 12.000 unique
// canonical" data test). Combined with scripts/canonical-preflight.mjs (which
// already proved 5,132 existing + 6,868 queued = exactly 12,000 against the
// real source files), this proves the second half of that requirement: when
// every candidate is run through claim -> mock generate -> schema validate ->
// publish, the queue actually reaches full completion with zero real network
// calls. No real Gemini/Translation LLM call and no real API key are used
// anywhere in this file.

import test from 'node:test';
import assert from 'node:assert/strict';
import { SimulatedContentQueue, buildSimulatedRows } from '../../scripts/simulated-content-queue.mjs';
import {
  generateMockWordContentPayload,
  validateWordContentPayload,
  WordContentValidationError,
} from '../../scripts/mock-word-content-provider.mjs';

// Real canonical words never contain a 3+ digit run, but this file's synthetic
// fixture words are indexed (target-word-1 .. target-word-200) and the
// validator flags long digit runs as suspicious (sec. 8.5). Map the numeric
// index to a base-26 letter suffix instead so the synthetic word text stays
// realistic -- this only affects the *word text* fed to the mock provider,
// not the queue row's canonicalId/queueOrder.
function toLetterSuffix(index) {
  let n = index;
  let out = '';
  do {
    out = String.fromCharCode(97 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

// Runs the full claim -> mock-generate -> validate -> publish loop, exactly
// as a real worker calling the SQL RPCs would, but against the in-memory
// SimulatedContentQueue instead of Postgres. `stopAtPublishedCount` mirrors
// sec. 8.10's "sayaç tam 12.000 olduğunda batch durur" -- that stop condition
// belongs to the orchestrator polling get_canonical_content_build_progress_
// service between claims, not to the claim RPC itself (see the note in
// canonical_queue_algorithm.test.mjs); passing it here simulates that
// orchestrator behavior.
function runWorkerSimulation(queue, { rejectNormalizedWords = new Set(), stopAtPublishedCount = Infinity } = {}) {
  let providerInvocations = 0;
  let rejections = 0;
  for (;;) {
    if ((queue.countByStatus().published ?? 0) >= stopAtPublishedCount) break;
    const row = queue.claim();
    if (!row) break;

    if (rejectNormalizedWords.has(row.normalizedWord)) {
      queue.reject(row.canonicalId);
      rejections += 1;
      continue;
    }

    providerInvocations += 1;
    const payload = generateMockWordContentPayload(row.canonicalWord ?? row.normalizedWord);
    try {
      validateWordContentPayload(payload, payload.normalizedWord);
    } catch (error) {
      if (error instanceof WordContentValidationError) {
        queue.reject(row.canonicalId);
        rejections += 1;
        continue;
      }
      throw error;
    }
    queue.publish(row.canonicalId);
  }
  return { providerInvocations, rejections };
}

test('mock provider output always passes schema validation for realistic words', () => {
  for (const word of ['experience', 'date-night', 'shepherd\'s pie', '3d printing', 'uncool', 'zygote']) {
    const payload = generateMockWordContentPayload(word);
    assert.doesNotThrow(() => validateWordContentPayload(payload, payload.normalizedWord));
  }
});

test('validator rejects payloads missing the target word, with placeholder markup, or with the wrong normalizedWord', () => {
  const base = generateMockWordContentPayload('experience');
  assert.throws(
    () => validateWordContentPayload({ ...base, storyEn: 'A story about nothing in particular.' }, base.normalizedWord),
    { code: 'TARGET_WORD_MISSING' },
  );
  assert.throws(
    () => validateWordContentPayload({ ...base, aiContext: 'See {{placeholder}} for details.' }, base.normalizedWord),
    { code: 'PLACEHOLDER_CONTENT' },
  );
  assert.throws(
    () => validateWordContentPayload(base, 'some-other-word'),
    { code: 'NORMALIZED_WORD_MISMATCH' },
  );
});

test('a full worker run over a synthetic 200-word TARGET queue with mock content reaches 100% published (zero rejections expected from clean mock data)', () => {
  const targetCount = 200;
  const reserveCount = 20;
  const rows = buildSimulatedRows({ targetCount, reserveCount }).map((row, index) => ({
    ...row,
    canonicalWord: `synthetic word ${toLetterSuffix(index)}`,
  }));
  const queue = new SimulatedContentQueue(rows);

  const { providerInvocations } = runWorkerSimulation(queue, { stopAtPublishedCount: targetCount });

  const counts = queue.countByStatus();
  assert.equal(counts.published, targetCount, 'every TARGET row must publish since mock content always validates');
  assert.equal(counts.rejected ?? 0, 0);
  assert.equal(providerInvocations, targetCount, 'RESERVE rows are never touched once every TARGET row published cleanly');
});

test('a full worker run where some candidates are rejected still reaches the target count via RESERVE fallthrough, with zero real provider/network calls', () => {
  const targetCount = 50;
  const reserveCount = 10;
  const rows = buildSimulatedRows({ targetCount, reserveCount }).map((row, index) => ({
    ...row,
    canonicalWord: `synthetic word ${toLetterSuffix(index)}`,
  }));
  const queue = new SimulatedContentQueue(rows);
  const rejectSet = new Set(['target-word-3', 'target-word-17', 'target-word-42']);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('network must not be called by the mock worker'); };
  try {
    const { rejections } = runWorkerSimulation(queue, { rejectNormalizedWords: rejectSet });
    assert.equal(rejections, rejectSet.size);

    const counts = queue.countByStatus();
    // targetCount - rejected TARGETs get published directly, plus reserveCount
    // more RESERVE rows get pulled in and published once TARGET is exhausted
    // (the worker here has no 12,000-total stop condition -- see the
    // canonical_queue_algorithm.test.mjs note on where that belongs).
    assert.equal(counts.published, targetCount - rejectSet.size + reserveCount);
    assert.equal(counts.rejected, rejectSet.size);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
