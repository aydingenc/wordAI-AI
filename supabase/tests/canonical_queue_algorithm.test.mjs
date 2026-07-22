// Algorithm-level simulation of the claim/skip-existing/publish/reject/
// reserve-fill logic implemented by the SQL RPCs in
// 202607220005_word_content_build_queue.sql (sec. 8). This is NOT a
// substitute for a real pgTAP/Postgres concurrency test -- there is no local
// Postgres in this environment (no psql/supabase/docker), so this test
// re-implements the same ordering/locking semantics in plain JS to get real,
// automated coverage of the tricky parts (claim ordering, live-DB skip,
// reserve fallthrough, second-check race) before those RPCs are ever run
// against a real database. A real pgTAP suite still needs to run against a
// linked/staging Supabase project, exactly as Phase 2A's own DB-level tests
// (supabase/tests/phase2a_*.sql) already do via psql, not via `node --test`.

import test from 'node:test';
import assert from 'node:assert/strict';
import { SimulatedContentQueue as SimulatedQueue, buildSimulatedRows as buildRows } from '../../scripts/simulated-content-queue.mjs';

test('TARGET rows are always claimed before RESERVE rows', () => {
  const queue = new SimulatedQueue(buildRows({ targetCount: 5, reserveCount: 3 }));
  const claimed = [];
  for (let i = 0; i < 5; i += 1) claimed.push(queue.claim().canonicalId);
  assert.deepEqual(claimed, ['cw-target-1', 'cw-target-2', 'cw-target-3', 'cw-target-4', 'cw-target-5']);
  const next = queue.claim();
  assert.equal(next.canonicalId, 'cw-reserve-1');
});

test('a word that already exists live is skipped without any provider call', () => {
  const queue = new SimulatedQueue(buildRows({ targetCount: 3, reserveCount: 1 }));
  queue.publishedNormalizedWords.add('target-word-2');

  const first = queue.claim();
  assert.equal(first.canonicalId, 'cw-target-1');
  queue.publish(first.canonicalId);

  const second = queue.claim();
  assert.equal(second.canonicalId, 'cw-target-3', 'target-word-2 must be skipped, not claimed');
  assert.equal(queue.byId.get('cw-target-2').status, 'skipped_existing');
  assert.equal(queue.providerCallCount, 1, 'provider must only be called for the one real publish');
});

test('rejecting a TARGET row lets the next queued row (including RESERVE once TARGET is exhausted) fill in', () => {
  const queue = new SimulatedQueue(buildRows({ targetCount: 2, reserveCount: 2 }));

  const first = queue.claim();
  queue.reject(first.canonicalId);
  assert.equal(queue.byId.get(first.canonicalId).status, 'rejected');

  const second = queue.claim();
  assert.equal(second.canonicalId, 'cw-target-2');
  queue.publish(second.canonicalId);

  const third = queue.claim();
  assert.equal(third.canonicalId, 'cw-reserve-1', 'reserve only kicks in once TARGET is exhausted');
  queue.publish(third.canonicalId);

  assert.equal(queue.countByStatus().published, 2);
  assert.equal(queue.countByStatus().rejected, 1);
});

test('two workers resolving to the same normalized word: only one publish succeeds, the other is skipped_existing at publish time (not claim time)', () => {
  const rows = buildRows({ targetCount: 2, reserveCount: 0 });
  rows[0].normalizedWord = 'same-word';
  rows[1].normalizedWord = 'same-word';
  const queue = new SimulatedQueue(rows);

  const first = queue.claim();
  const second = queue.claim();
  assert.ok(first && second, 'both rows are claimable at claim time -- the duplicate is only caught at publish time');

  const firstResult = queue.publish(first.canonicalId);
  const secondResult = queue.publish(second.canonicalId);
  assert.equal(firstResult.status, 'published');
  assert.equal(secondResult.status, 'skipped_existing');
  assert.equal(queue.providerCallCount, 2, 'both provider calls happen; only the DB write is deduplicated');
});

test('full run: rejected TARGET rows are backfilled by RESERVE, and RESERVE is only ever touched after every TARGET row is resolved', () => {
  // The claim function itself has no notion of "stop once 12,000 is reached" --
  // that threshold is sec. 8.10's job and belongs to the batch orchestrator
  // (which calls get_canonical_content_build_progress_service and stops
  // issuing claims once publishedTotal hits 12,000). This test only proves the
  // ordering/fallthrough contract: every RESERVE row claimed here was claimed
  // strictly after all TARGET rows were already resolved one way or another.
  const targetCount = 20;
  const reserveCount = 5;
  const queue = new SimulatedQueue(buildRows({ targetCount, reserveCount }));
  const rejectEveryNth = 7; // reject a handful of TARGET rows to exercise reserve fallthrough
  const claimOrder = [];

  let claimedCount = 0;
  for (;;) {
    const row = queue.claim();
    if (!row) break;
    claimedCount += 1;
    claimOrder.push(row.canonicalId);
    if (row.queueType === 'TARGET' && row.queueOrder % rejectEveryNth === 0) {
      queue.reject(row.canonicalId);
    } else {
      queue.publish(row.canonicalId);
    }
  }

  const counts = queue.countByStatus();
  const rejectedTargetCount = Math.floor(targetCount / rejectEveryNth);
  assert.equal(counts.rejected, rejectedTargetCount);
  assert.equal(counts.published, targetCount - rejectedTargetCount + reserveCount);
  assert.equal(claimedCount, targetCount + reserveCount);

  const lastTargetClaimIndex = claimOrder.findLastIndex((id) => id.startsWith('cw-target-'));
  const firstReserveClaimIndex = claimOrder.findIndex((id) => id.startsWith('cw-reserve-'));
  assert.ok(firstReserveClaimIndex > lastTargetClaimIndex, 'no RESERVE row is ever claimed before every TARGET row has been resolved');
});
