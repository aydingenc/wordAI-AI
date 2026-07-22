-- WordLoop Canonical 12.000: build queue for the 6,868 new target words + 500
-- reserve candidates. Source of truth: Teknik Şartname sec. 8.
--
-- Lifecycle: queued -> leased -> published | rejected/failed | skipped_existing.
-- TARGET rows are claimed before RESERVE rows purely by queue_order, so once a
-- TARGET row is rejected/failed/skipped it is simply not retried -- the next
-- lowest-order still-queued row (TARGET first, then RESERVE) is claimed next.
-- This reproduces "reddedilen her satır için Yedek_500'den sıradaki adayı al"
-- without separate 1:1 promotion bookkeeping: the total published count still
-- only advances on a real success, and reserve rows are structurally untouched
-- until every TARGET row has been resolved one way or another.
--
-- No Edge Function or provider call lives in this migration. Only mock
-- providers may drive these RPCs in tests (WORD_CONTENT_PROVIDER=mock).

create table if not exists private.canonical_content_build_queue (
  canonical_id text primary key,
  canonical_word text not null,
  normalized_word text not null,
  queue_type text not null,
  queue_order integer not null,
  best_subtlex_rank integer,
  aggregate_corpus_count bigint,
  source_forms text,
  lemma_notes text,
  status text not null default 'queued',
  lease_token uuid,
  lease_until timestamptz,
  attempt_count integer not null default 0,
  last_error_code text,
  last_error_message text,
  published_canonical_word_id text references public.canonical_words(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint canonical_content_build_queue_type_check check (queue_type in ('TARGET', 'RESERVE')),
  constraint canonical_content_build_queue_status_check check (status in (
    'queued', 'lexical_validating', 'ready', 'leased', 'generating',
    'validated', 'published', 'failed', 'rejected', 'skipped_existing'
  ))
);

create unique index if not exists canonical_content_build_queue_normalized_word_idx
  on private.canonical_content_build_queue (normalized_word);
create index if not exists canonical_content_build_queue_claim_order_idx
  on private.canonical_content_build_queue (status, (queue_type <> 'TARGET'), queue_order);

alter table private.canonical_content_build_queue enable row level security;
revoke all on private.canonical_content_build_queue from public, anon, authenticated;
grant all on private.canonical_content_build_queue to service_role;

drop trigger if exists canonical_content_build_queue_touch_updated_at on private.canonical_content_build_queue;
create trigger canonical_content_build_queue_touch_updated_at
before update on private.canonical_content_build_queue
for each row execute function private.touch_updated_at();

create unlogged table if not exists private.canonical_content_build_queue_staging (
  queue_type text,
  queue_order integer,
  canonical_id text,
  canonical_word text,
  best_subtlex_rank integer,
  aggregate_corpus_count bigint,
  source_forms text,
  lemma_notes text
);

alter table private.canonical_content_build_queue_staging enable row level security;
revoke all on private.canonical_content_build_queue_staging from public, anon, authenticated;

create or replace function public.load_canonical_content_build_queue_service(
  p_expected_rows integer default 7368
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staging_count integer;
  v_target_count integer;
  v_reserve_count integer;
  v_overlap_count integer;
begin
  select count(*)::integer into v_staging_count from private.canonical_content_build_queue_staging;
  if v_staging_count <> p_expected_rows then
    raise exception using errcode = 'P0001',
      message = format('QUEUE_STAGING_ROW_COUNT_MISMATCH expected=%s actual=%s', p_expected_rows, v_staging_count);
  end if;

  select count(*)::integer into v_overlap_count
  from private.canonical_content_build_queue_staging s
  join public.canonical_words cw on cw.id = s.canonical_id;
  if v_overlap_count <> 0 then
    raise exception using errcode = 'P0001',
      message = format('QUEUE_OVERLAPS_EXISTING_CANONICAL count=%s', v_overlap_count);
  end if;

  insert into private.canonical_content_build_queue (
    canonical_id, canonical_word, normalized_word, queue_type, queue_order,
    best_subtlex_rank, aggregate_corpus_count, source_forms, lemma_notes, status
  )
  select
    s.canonical_id, s.canonical_word, lower(btrim(s.canonical_word)), s.queue_type, s.queue_order,
    s.best_subtlex_rank, s.aggregate_corpus_count, s.source_forms, s.lemma_notes, 'queued'
  from private.canonical_content_build_queue_staging s
  on conflict (canonical_id) do nothing;

  select count(*)::integer into v_target_count from private.canonical_content_build_queue where queue_type = 'TARGET';
  select count(*)::integer into v_reserve_count from private.canonical_content_build_queue where queue_type = 'RESERVE';

  if v_target_count <> 6868 or v_reserve_count <> 500 then
    raise exception using errcode = 'P0001',
      message = format('QUEUE_COUNT_MISMATCH target=%s reserve=%s expected_target=6868 expected_reserve=500', v_target_count, v_reserve_count);
  end if;

  return jsonb_build_object('targetLoaded', v_target_count, 'reserveLoaded', v_reserve_count);
end;
$$;

revoke all on function public.load_canonical_content_build_queue_service(integer) from public, anon, authenticated;
grant execute on function public.load_canonical_content_build_queue_service(integer) to service_role;

-- ============================================================================
-- Atomic claim. `for update skip locked` lets multiple workers pull distinct
-- rows concurrently. A live DB check happens before the lease so a word that
-- was published by a previous batch (or already exists for any reason) is
-- marked skipped_existing without ever reaching the provider -- no cost, no
-- call. The function loops past already-resolved rows itself.
-- ============================================================================

create or replace function public.claim_canonical_content_build_job_service(
  p_lease_seconds integer default 300
)
returns table (
  claim_status text,
  claim_canonical_id text,
  claim_canonical_word text,
  claim_normalized_word text,
  claim_lease_token uuid,
  claim_queue_type text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row private.canonical_content_build_queue%rowtype;
  v_token uuid;
  v_lease_seconds integer := greatest(30, least(coalesce(p_lease_seconds, 300), 1800));
  v_now timestamptz := clock_timestamp();
begin
  loop
    select q.* into v_row
    from private.canonical_content_build_queue q
    where q.status = 'queued'
    order by (q.queue_type <> 'TARGET'), q.queue_order
    for update skip locked
    limit 1;

    if not found then
      claim_status := 'queue_empty';
      return next;
      return;
    end if;

    if exists (
      select 1 from public.canonical_words cw where cw.normalized_word = v_row.normalized_word
    ) then
      update private.canonical_content_build_queue
      set status = 'skipped_existing', updated_at = clock_timestamp()
      where canonical_id = v_row.canonical_id;
      continue;
    end if;

    v_token := extensions.gen_random_uuid();
    update private.canonical_content_build_queue
    set status = 'leased',
        lease_token = v_token,
        lease_until = v_now + make_interval(secs => v_lease_seconds),
        attempt_count = attempt_count + 1,
        updated_at = clock_timestamp()
    where canonical_id = v_row.canonical_id;

    claim_status := 'claimed';
    claim_canonical_id := v_row.canonical_id;
    claim_canonical_word := v_row.canonical_word;
    claim_normalized_word := v_row.normalized_word;
    claim_lease_token := v_token;
    claim_queue_type := v_row.queue_type;
    return next;
    return;
  end loop;
end;
$$;

revoke all on function public.claim_canonical_content_build_job_service(integer) from public, anon, authenticated;
grant execute on function public.claim_canonical_content_build_job_service(integer) to service_role;

-- ============================================================================
-- Publish. p_payload must already be schema-validated by the caller (the
-- worker/Edge Function validates the provider's JSON per sec. 8.5 before ever
-- calling this). This function only re-checks the live DB (sec. 8.8) and
-- performs the atomic multi-table insert + queue row completion.
-- ============================================================================

create or replace function public.publish_canonical_content_build_result_service(
  p_canonical_id text,
  p_lease_token uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_queue private.canonical_content_build_queue%rowtype;
  v_normalized_word text;
  v_example_set_id text;
  v_story_variant_id text;
  v_sense_id uuid;
begin
  select * into v_queue
  from private.canonical_content_build_queue
  where canonical_id = p_canonical_id
    and status = 'leased'
    and lease_token = p_lease_token
    and lease_until >= clock_timestamp()
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'INVALID_OR_EXPIRED_LEASE';
  end if;

  v_normalized_word := lower(btrim(p_payload ->> 'normalizedWord'));

  -- Second DB check, immediately before the write (sec. 8.8): if another
  -- worker published this word first, this is not an error.
  if exists (select 1 from public.canonical_words cw where cw.normalized_word = v_normalized_word) then
    update private.canonical_content_build_queue
    set status = 'skipped_existing', lease_token = null, lease_until = null, updated_at = clock_timestamp()
    where canonical_id = p_canonical_id;
    return jsonb_build_object('status', 'skipped_existing');
  end if;

  insert into public.canonical_words (id, word, normalized_word, source, content_status)
  values (p_canonical_id, p_payload ->> 'word', v_normalized_word, 'on_demand', 'draft');

  insert into public.canonical_word_categories (canonical_word_id, category, is_primary)
  select p_canonical_id, value, true
  from jsonb_array_elements_text(p_payload -> 'categories')
  on conflict (canonical_word_id, category) do nothing;

  insert into public.canonical_word_senses (
    canonical_word_id, pronunciation, meaning_tr, level, word_type, is_default, content_hash
  )
  values (
    p_canonical_id, p_payload ->> 'pronunciation', p_payload ->> 'meaningTr',
    p_payload ->> 'level', p_payload ->> 'wordType', true,
    encode(extensions.digest(convert_to(p_payload::text, 'UTF8'), 'sha256'), 'hex')
  )
  returning id into v_sense_id;

  v_example_set_id := 'exs-' || regexp_replace(v_normalized_word, '[^a-z0-9]+', '-', 'g') || '-' || left(md5(p_canonical_id || 'exs'), 10);

  insert into private.canonical_word_example_sets (
    id, canonical_word_id,
    ex_basic_en, ex_basic_tr, ex_mid_en, ex_mid_tr, ex_adv_en, ex_adv_tr,
    sp_present_en, sp_present_tr, pres_cont_en, pres_cont_tr,
    future_en, future_tr, past_en, past_tr, pres_perf_en, pres_perf_tr,
    content_hash, is_default
  )
  values (
    v_example_set_id, p_canonical_id,
    p_payload -> 'wordDna' -> 'basic' ->> 'en', p_payload -> 'wordDna' -> 'basic' ->> 'tr',
    p_payload -> 'wordDna' -> 'mid' ->> 'en', p_payload -> 'wordDna' -> 'mid' ->> 'tr',
    p_payload -> 'wordDna' -> 'advanced' ->> 'en', p_payload -> 'wordDna' -> 'advanced' ->> 'tr',
    p_payload -> 'sentenceLab' -> 'present' ->> 'en', p_payload -> 'sentenceLab' -> 'present' ->> 'tr',
    p_payload -> 'sentenceLab' -> 'presentContinuous' ->> 'en', p_payload -> 'sentenceLab' -> 'presentContinuous' ->> 'tr',
    p_payload -> 'sentenceLab' -> 'future' ->> 'en', p_payload -> 'sentenceLab' -> 'future' ->> 'tr',
    p_payload -> 'sentenceLab' -> 'past' ->> 'en', p_payload -> 'sentenceLab' -> 'past' ->> 'tr',
    p_payload -> 'sentenceLab' -> 'presentPerfect' ->> 'en', p_payload -> 'sentenceLab' -> 'presentPerfect' ->> 'tr',
    encode(extensions.digest(convert_to((p_payload -> 'wordDna')::text || (p_payload -> 'sentenceLab')::text, 'UTF8'), 'sha256'), 'hex'),
    true
  );

  v_story_variant_id := 'stv-' || regexp_replace(v_normalized_word, '[^a-z0-9]+', '-', 'g') || '-' || left(md5(p_canonical_id || 'stv'), 10);

  insert into private.canonical_word_story_variants (id, canonical_word_id, story_en, story_source_hash, ai_context, is_default)
  values (
    v_story_variant_id, p_canonical_id, p_payload ->> 'storyEn',
    private.story_source_hash(p_payload ->> 'storyEn'), p_payload ->> 'aiContext', true
  );

  update public.canonical_words
  set default_sense_id = v_sense_id,
      default_example_set_id = v_example_set_id,
      default_story_variant_id = v_story_variant_id,
      content_status = 'published',
      updated_at = clock_timestamp()
  where id = p_canonical_id;

  insert into private.word_search_aliases (normalized_alias, canonical_word_id, display_alias, language_code, alias_type, verified, source_rank)
  values (v_normalized_word, p_canonical_id, p_payload ->> 'word', 'en', 'exact', true, 0)
  on conflict (normalized_alias, canonical_word_id) do nothing;

  update private.canonical_content_build_queue
  set status = 'published',
      published_canonical_word_id = p_canonical_id,
      lease_token = null,
      lease_until = null,
      updated_at = clock_timestamp()
  where canonical_id = p_canonical_id;

  return jsonb_build_object('status', 'published', 'canonicalWordId', p_canonical_id);
end;
$$;

revoke all on function public.publish_canonical_content_build_result_service(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.publish_canonical_content_build_result_service(text, uuid, jsonb) to service_role;

create or replace function public.reject_canonical_content_build_job_service(
  p_canonical_id text,
  p_lease_token uuid,
  p_error_code text,
  p_error_message text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  update private.canonical_content_build_queue
  set status = 'rejected',
      lease_token = null,
      lease_until = null,
      last_error_code = left(coalesce(p_error_code, 'REJECTED'), 80),
      last_error_message = left(coalesce(p_error_message, 'Rejected.'), 500),
      updated_at = clock_timestamp()
  where canonical_id = p_canonical_id
    and status = 'leased'
    and lease_token = p_lease_token;

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

revoke all on function public.reject_canonical_content_build_job_service(text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.reject_canonical_content_build_job_service(text, uuid, text, text) to service_role;

-- ============================================================================
-- Progress. `publishedTotal` is what sec. 8.10 means by "yalnız
-- content_status = 'published' ve tam içerikli canonical satırlar hedef
-- sayımına girer" -- it counts every published canonical (5,132 legacy +
-- however many the queue has published so far), and the batch orchestrator
-- (outside the DB, in the worker) stops once this reaches 12,000.
-- ============================================================================

create or replace function public.get_canonical_content_build_progress_service()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'publishedTotal', (select count(*) from public.canonical_words where content_status = 'published'),
    'queueByStatus', (
      select coalesce(jsonb_object_agg(status, status_count), '{}'::jsonb)
      from (
        select status, count(*) as status_count
        from private.canonical_content_build_queue
        group by status
      ) counts
    )
  );
$$;

revoke all on function public.get_canonical_content_build_progress_service() from public, anon, authenticated;
grant execute on function public.get_canonical_content_build_progress_service() to service_role;
