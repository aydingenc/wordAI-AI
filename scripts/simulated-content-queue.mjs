// Shared in-memory re-implementation of the claim/skip-existing/publish/reject
// ordering semantics from public.claim_canonical_content_build_job_service /
// publish_canonical_content_build_result_service (see
// supabase/migrations/202607220005_word_content_build_queue.sql). Used by
// both the pure ordering tests and the mock-provider end-to-end simulation.
// This is a test double for the SQL RPCs, not a replacement for running them
// against a real Postgres.

export class SimulatedContentQueue {
  constructor(rows) {
    this.rows = [...rows].sort((a, b) => {
      const aReserve = a.queueType !== 'TARGET' ? 1 : 0;
      const bReserve = b.queueType !== 'TARGET' ? 1 : 0;
      if (aReserve !== bReserve) return aReserve - bReserve;
      return a.queueOrder - b.queueOrder;
    });
    this.byId = new Map(this.rows.map((r) => [r.canonicalId, r]));
    this.publishedNormalizedWords = new Set();
    this.providerCallCount = 0;
  }

  claim() {
    for (const row of this.rows) {
      if (row.status !== 'queued') continue;
      if (this.publishedNormalizedWords.has(row.normalizedWord)) {
        row.status = 'skipped_existing';
        continue;
      }
      row.status = 'leased';
      return row;
    }
    return null;
  }

  publish(canonicalId) {
    this.providerCallCount += 1;
    const row = this.byId.get(canonicalId);
    if (row.status !== 'leased') throw new Error('INVALID_OR_EXPIRED_LEASE');
    if (this.publishedNormalizedWords.has(row.normalizedWord)) {
      row.status = 'skipped_existing';
      return { status: 'skipped_existing' };
    }
    this.publishedNormalizedWords.add(row.normalizedWord);
    row.status = 'published';
    return { status: 'published' };
  }

  reject(canonicalId) {
    const row = this.byId.get(canonicalId);
    if (row.status !== 'leased') throw new Error('INVALID_OR_EXPIRED_LEASE');
    row.status = 'rejected';
  }

  countByStatus() {
    const counts = {};
    for (const row of this.rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
    return counts;
  }
}

export function buildSimulatedRows({ targetCount, reserveCount, preExisting = [] }) {
  const rows = [];
  for (let i = 1; i <= targetCount; i += 1) {
    rows.push({ canonicalId: `cw-target-${i}`, queueType: 'TARGET', queueOrder: i, normalizedWord: `target-word-${i}`, status: 'queued' });
  }
  for (let i = 1; i <= reserveCount; i += 1) {
    rows.push({ canonicalId: `cw-reserve-${i}`, queueType: 'RESERVE', queueOrder: i, normalizedWord: `reserve-word-${i}`, status: 'queued' });
  }
  for (const normalizedWord of preExisting) {
    const row = rows.find((r) => r.normalizedWord === normalizedWord);
    if (row) row.__preExisting = true;
  }
  return rows;
}
