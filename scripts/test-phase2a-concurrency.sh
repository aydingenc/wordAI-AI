#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL must point to a local/test Supabase Postgres instance." >&2
  exit 2
fi
for command_name in psql pgbench; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "$command_name is required for the concurrency test." >&2
    exit 2
  fi
done

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test_dir="$root_dir/supabase/tests/concurrency"

cleanup() {
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$test_dir/cleanup.sql" >/dev/null
}
trap cleanup EXIT

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$test_dir/setup.sql" >/dev/null

pgbench "$DATABASE_URL" -n -c 4 -j 4 -t 1 -f "$test_dir/word_lab.pgbench.sql" >/dev/null
quota_result="$(psql "$DATABASE_URL" -X -At -F '|' -c "
  select b.used_count, count(g.word_id)
  from private.daily_access_buckets b
  join private.daily_word_access_grants g
    on g.user_id = b.user_id
   and g.access_date = b.access_date
   and g.feature = b.feature
  where b.user_id = '20000000-0000-4000-8000-000000000002'
    and b.feature = 'word_lab_full'
  group by b.used_count;
")"
if [[ "$quota_result" != "3|3" ]]; then
  echo "Atomic word quota failed: expected 3|3, got $quota_result" >&2
  exit 1
fi

pgbench "$DATABASE_URL" -n -c 4 -j 4 -t 1 -f "$test_dir/story_job.pgbench.sql" >/dev/null
job_result="$(psql "$DATABASE_URL" -X -At -F '|' -c "
  select count(*), max(attempt_count)
  from private.story_translations
  where word_id = 'phase2a-concurrency-1';
")"
if [[ "$job_result" != "1|1" ]]; then
  echo "Atomic story job claim failed: expected 1|1, got $job_result" >&2
  exit 1
fi

echo "Phase 2A concurrency checks passed (quota 3/4; translation job 1/4)."
