-- WordLoop Canonical 12.000: V2 service RPCs backing get-word-lab V2,
-- open-word-story V2, get-word-story-translation V2, and the legacy ID
-- resolver. Source of truth: Teknik Şartname sec. 6.3, 7, 9.
--
-- Mirrors the Phase 2A RPC shapes exactly (same decision/claim vocabulary) so
-- the V2 Edge Functions can reuse the same _shared/policy.ts response builders
-- with only the ID type swapped from legacy word_id to canonical_word_id.

-- ============================================================================
-- 9. Content payload RPCs (service_role only; called after the Edge Function
-- has already resolved entitlement/quota).
-- ============================================================================

create or replace function public.get_canonical_word_lab_payload_service(p_canonical_word_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'word', jsonb_strip_nulls(jsonb_build_object(
      'id', cw.id,
      'text', cw.word,
      'pronunciation', sn.pronunciation,
      'meaning', sn.meaning_tr,
      'level', sn.level,
      'wordType', sn.word_type
    )),
    'wordDna', jsonb_build_object(
      'basic', jsonb_build_object('en', es.ex_basic_en, 'tr', es.ex_basic_tr),
      'mid', jsonb_build_object('en', es.ex_mid_en, 'tr', es.ex_mid_tr),
      'advanced', jsonb_build_object('en', es.ex_adv_en, 'tr', es.ex_adv_tr)
    ),
    'sentenceLab', jsonb_build_object(
      'present', jsonb_build_object('en', es.sp_present_en, 'tr', es.sp_present_tr),
      'presentContinuous', jsonb_build_object('en', es.pres_cont_en, 'tr', es.pres_cont_tr),
      'past', jsonb_build_object('en', es.past_en, 'tr', es.past_tr),
      'future', jsonb_build_object('en', es.future_en, 'tr', es.future_tr),
      'presentPerfect', jsonb_build_object('en', es.pres_perf_en, 'tr', es.pres_perf_tr)
    )
  )
  from public.canonical_words cw
  join private.canonical_word_example_sets es on es.id = cw.default_example_set_id
  join public.canonical_word_senses sn on sn.id = cw.default_sense_id
  where cw.id = p_canonical_word_id
    and cw.content_status = 'published';
$$;

-- storyVariantId is optional; when omitted, the canonical's default story is
-- used. When provided, this also proves the variant belongs to the canonical
-- (the join fails otherwise) -- the caller cannot request a variant from a
-- different word.
create or replace function public.get_canonical_word_story_payload_service(
  p_canonical_word_id text,
  p_story_variant_id text default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'canonicalWordId', cw.id,
    'storyVariantId', sv.id,
    'storyEn', sv.story_en,
    'sourceHash', sv.story_source_hash
  )
  from public.canonical_words cw
  join private.canonical_word_story_variants sv
    on sv.canonical_word_id = cw.id
   and sv.id = coalesce(p_story_variant_id, cw.default_story_variant_id)
  where cw.id = p_canonical_word_id
    and cw.content_status = 'published';
$$;

revoke all on function public.get_canonical_word_lab_payload_service(text) from public, anon, authenticated;
revoke all on function public.get_canonical_word_story_payload_service(text, text) from public, anon, authenticated;
grant execute on function public.get_canonical_word_lab_payload_service(text) to service_role;
grant execute on function public.get_canonical_word_story_payload_service(text, text) to service_role;

-- ============================================================================
-- 6.3 Canonical-keyed entitlement/quota claim. Same decision vocabulary as
-- Phase 2A's claim_word_feature_access (full/preview, allowed/paywall) so the
-- V2 Edge Function can reuse the existing response-building policy logic.
-- ============================================================================

create or replace function public.claim_canonical_word_feature_access(
  p_canonical_word_id text,
  p_feature text
)
returns table (
  decision text,
  is_premium boolean,
  daily_used integer,
  daily_limit integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_access_date date := (clock_timestamp() at time zone 'Europe/Istanbul')::date;
  v_limit integer;
  v_used integer := 0;
  v_is_premium boolean := false;
  v_inserted integer := 0;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  if p_canonical_word_id is null or btrim(p_canonical_word_id) = '' then
    raise exception using errcode = '22023', message = 'INVALID_CANONICAL_WORD_ID';
  end if;

  if p_feature = 'word_lab_full' then
    v_limit := 3;
  elsif p_feature = 'word_story' then
    v_limit := 1;
  else
    raise exception using errcode = '22023', message = 'INVALID_FEATURE';
  end if;

  if not exists (
    select 1
    from public.canonical_user_words cuw
    where cuw.user_id = v_user_id
      and cuw.canonical_word_id = p_canonical_word_id
      and cuw.status <> 'removed'
  ) then
    raise exception using errcode = 'P0001', message = 'WORD_NOT_IN_LIBRARY';
  end if;

  select coalesce(e.is_premium, false) and e.premium_until > clock_timestamp()
    into v_is_premium
  from public.entitlements e
  where e.user_id = v_user_id;

  v_is_premium := coalesce(v_is_premium, false);
  reset_at := ((v_access_date + 1)::timestamp at time zone 'Europe/Istanbul');
  daily_limit := v_limit;
  is_premium := v_is_premium;

  if v_is_premium then
    select coalesce(b.used_count, 0)
      into v_used
    from private.canonical_daily_access_buckets b
    where b.user_id = v_user_id
      and b.access_date = v_access_date
      and b.feature = p_feature;

    daily_used := coalesce(v_used, 0);
    decision := case when p_feature = 'word_lab_full' then 'full' else 'allowed' end;
    return next;
    return;
  end if;

  insert into private.canonical_daily_access_buckets (user_id, access_date, feature, used_count)
  values (v_user_id, v_access_date, p_feature, 0)
  on conflict (user_id, access_date, feature) do nothing;

  select b.used_count
    into v_used
  from private.canonical_daily_access_buckets b
  where b.user_id = v_user_id
    and b.access_date = v_access_date
    and b.feature = p_feature
  for update;

  if exists (
    select 1
    from private.canonical_daily_word_access_grants g
    where g.user_id = v_user_id
      and g.access_date = v_access_date
      and g.feature = p_feature
      and g.canonical_word_id = p_canonical_word_id
  ) then
    daily_used := v_used;
    decision := case when p_feature = 'word_lab_full' then 'full' else 'allowed' end;
    return next;
    return;
  end if;

  if v_used < v_limit then
    insert into private.canonical_daily_word_access_grants (user_id, access_date, feature, canonical_word_id)
    values (v_user_id, v_access_date, p_feature, p_canonical_word_id)
    on conflict (user_id, access_date, feature, canonical_word_id) do nothing;

    get diagnostics v_inserted = row_count;

    if v_inserted = 1 then
      update private.canonical_daily_access_buckets b
      set used_count = b.used_count + 1,
          updated_at = clock_timestamp()
      where b.user_id = v_user_id
        and b.access_date = v_access_date
        and b.feature = p_feature
      returning b.used_count into v_used;
    end if;

    daily_used := v_used;
    decision := case when p_feature = 'word_lab_full' then 'full' else 'allowed' end;
    return next;
    return;
  end if;

  daily_used := v_used;
  decision := case when p_feature = 'word_lab_full' then 'preview' else 'paywall' end;
  return next;
end;
$$;

revoke all on function public.claim_canonical_word_feature_access(text, text) from public, anon;
grant execute on function public.claim_canonical_word_feature_access(text, text) to authenticated;

-- ============================================================================
-- 4.3 / 7. Canonical story translation cache job RPCs, keyed by
-- (story_variant_id, language_code, source_hash). A stale sourceHash (the
-- story content changed since the client fetched it) fails fast with
-- STALE_SOURCE_HASH -- the Edge Function turns this into 409.
-- ============================================================================

create or replace function public.claim_canonical_story_translation_job_service(
  p_story_variant_id text,
  p_source_hash text,
  p_language_code text default 'tr',
  p_lease_seconds integer default 120,
  p_max_attempts integer default 3
)
returns table (
  claim_status text,
  claim_lease_token uuid,
  claim_attempt_count integer,
  claim_translated_text text,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row private.canonical_story_translations%rowtype;
  v_token uuid := extensions.gen_random_uuid();
  v_now timestamptz := clock_timestamp();
  v_lease_seconds integer := greatest(30, least(coalesce(p_lease_seconds, 120), 600));
  v_max_attempts integer := greatest(1, least(coalesce(p_max_attempts, 3), 10));
  v_inserted integer := 0;
begin
  if p_language_code <> 'tr' then
    raise exception using errcode = '22023', message = 'UNSUPPORTED_LANGUAGE';
  end if;

  if p_source_hash is null or p_source_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'INVALID_SOURCE_HASH';
  end if;

  if not exists (
    select 1
    from private.canonical_word_story_variants sv
    where sv.id = p_story_variant_id
      and sv.story_source_hash = p_source_hash
  ) then
    raise exception using errcode = 'P0001', message = 'STALE_SOURCE_HASH';
  end if;

  insert into private.canonical_story_translations (
    story_variant_id, language_code, source_hash, status, processing_started_at,
    lease_until, lease_token, attempt_count
  )
  values (
    p_story_variant_id, p_language_code, p_source_hash, 'processing', v_now,
    v_now + make_interval(secs => v_lease_seconds), v_token, 1
  )
  on conflict (story_variant_id, language_code, source_hash) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 1 then
    claim_status := 'claimed';
    claim_lease_token := v_token;
    claim_attempt_count := 1;
    claim_translated_text := null;
    retry_after_seconds := 0;
    return next;
    return;
  end if;

  select st.*
    into v_row
  from private.canonical_story_translations st
  where st.story_variant_id = p_story_variant_id
    and st.language_code = p_language_code
    and st.source_hash = p_source_hash
  for update;

  if v_row.status = 'completed' then
    claim_status := 'completed';
    claim_lease_token := null;
    claim_attempt_count := v_row.attempt_count;
    claim_translated_text := v_row.translated_text;
    retry_after_seconds := 0;
    return next;
    return;
  end if;

  if v_row.status = 'processing' and v_row.lease_until > v_now then
    claim_status := 'processing';
    claim_lease_token := null;
    claim_attempt_count := v_row.attempt_count;
    claim_translated_text := null;
    retry_after_seconds := greatest(1, ceil(extract(epoch from (v_row.lease_until - v_now)))::integer);
    return next;
    return;
  end if;

  if v_row.attempt_count >= v_max_attempts then
    if v_row.status = 'processing' then
      update private.canonical_story_translations st
      set status = 'failed',
          lease_until = null,
          lease_token = null,
          last_error_code = coalesce(st.last_error_code, 'LEASE_EXPIRED'),
          last_error_message = coalesce(st.last_error_message, 'Translation worker lease expired.'),
          next_retry_at = null
      where st.story_variant_id = p_story_variant_id
        and st.language_code = p_language_code
        and st.source_hash = p_source_hash;
    end if;

    claim_status := 'failed';
    claim_lease_token := null;
    claim_attempt_count := v_row.attempt_count;
    claim_translated_text := null;
    retry_after_seconds := 0;
    return next;
    return;
  end if;

  if v_row.status = 'failed' and v_row.next_retry_at is not null and v_row.next_retry_at > v_now then
    claim_status := 'failed';
    claim_lease_token := null;
    claim_attempt_count := v_row.attempt_count;
    claim_translated_text := null;
    retry_after_seconds := greatest(1, ceil(extract(epoch from (v_row.next_retry_at - v_now)))::integer);
    return next;
    return;
  end if;

  v_token := extensions.gen_random_uuid();

  update private.canonical_story_translations st
  set status = 'processing',
      translated_text = null,
      processing_started_at = v_now,
      lease_until = v_now + make_interval(secs => v_lease_seconds),
      lease_token = v_token,
      attempt_count = st.attempt_count + 1,
      next_retry_at = null,
      last_error_code = null,
      last_error_message = null
  where st.story_variant_id = p_story_variant_id
    and st.language_code = p_language_code
    and st.source_hash = p_source_hash
  returning st.attempt_count into claim_attempt_count;

  claim_status := 'claimed';
  claim_lease_token := v_token;
  claim_translated_text := null;
  retry_after_seconds := 0;
  return next;
end;
$$;

create or replace function public.complete_canonical_story_translation_job_service(
  p_story_variant_id text,
  p_source_hash text,
  p_lease_token uuid,
  p_translated_text text,
  p_input_character_count integer,
  p_output_character_count integer,
  p_language_code text default 'tr'
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if p_translated_text is null or btrim(p_translated_text) = '' then
    raise exception using errcode = '22023', message = 'EMPTY_TRANSLATION';
  end if;

  update private.canonical_story_translations st
  set status = 'completed',
      translated_text = p_translated_text,
      translated_at = clock_timestamp(),
      lease_until = null,
      lease_token = null,
      next_retry_at = null,
      last_error_code = null,
      last_error_message = null,
      input_character_count = greatest(coalesce(p_input_character_count, 0), 0),
      output_character_count = greatest(coalesce(p_output_character_count, 0), 0)
  where st.story_variant_id = p_story_variant_id
    and st.language_code = p_language_code
    and st.source_hash = p_source_hash
    and st.status = 'processing'
    and st.lease_token = p_lease_token
    and st.lease_until >= clock_timestamp();

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

create or replace function public.fail_canonical_story_translation_job_service(
  p_story_variant_id text,
  p_source_hash text,
  p_lease_token uuid,
  p_error_code text,
  p_error_message text,
  p_language_code text default 'tr'
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  update private.canonical_story_translations st
  set status = 'failed',
      lease_until = null,
      lease_token = null,
      next_retry_at = clock_timestamp() + make_interval(
        secs => least(300, (5 * power(2, greatest(st.attempt_count - 1, 0)))::integer)
      ),
      last_error_code = left(coalesce(p_error_code, 'TRANSLATION_FAILED'), 80),
      last_error_message = left(coalesce(p_error_message, 'Translation failed.'), 500)
  where st.story_variant_id = p_story_variant_id
    and st.language_code = p_language_code
    and st.source_hash = p_source_hash
    and st.status = 'processing'
    and st.lease_token = p_lease_token;

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

create or replace function public.get_canonical_story_translation_state_service(
  p_story_variant_id text,
  p_source_hash text,
  p_language_code text default 'tr'
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when sv.story_source_hash <> p_source_hash then
      jsonb_build_object('translationStatus', 'stale')
    when st.story_variant_id is null then
      jsonb_build_object('translationStatus', 'missing')
    when st.status = 'completed' then
      jsonb_build_object(
        'translationStatus', 'completed',
        'storyTr', st.translated_text,
        'attemptCount', st.attempt_count
      )
    when st.status = 'processing' then
      jsonb_build_object(
        'translationStatus', 'processing',
        'attemptCount', st.attempt_count,
        'retryAfterSeconds', greatest(
          1,
          ceil(extract(epoch from (coalesce(st.lease_until, clock_timestamp()) - clock_timestamp())))::integer
        )
      )
    else
      jsonb_build_object(
        'translationStatus', 'failed',
        'attemptCount', st.attempt_count,
        'retryAfterSeconds', case
          when st.next_retry_at is null then 0
          else greatest(0, ceil(extract(epoch from (st.next_retry_at - clock_timestamp())))::integer)
        end
      )
  end
  from private.canonical_word_story_variants sv
  left join private.canonical_story_translations st
    on st.story_variant_id = sv.id
   and st.language_code = p_language_code
   and st.source_hash = p_source_hash
  where sv.id = p_story_variant_id;
$$;

revoke all on function public.claim_canonical_story_translation_job_service(text, text, text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.complete_canonical_story_translation_job_service(text, text, uuid, text, integer, integer, text)
  from public, anon, authenticated;
revoke all on function public.fail_canonical_story_translation_job_service(text, text, uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function public.get_canonical_story_translation_state_service(text, text, text)
  from public, anon, authenticated;

grant execute on function public.claim_canonical_story_translation_job_service(text, text, text, integer, integer)
  to service_role;
grant execute on function public.complete_canonical_story_translation_job_service(text, text, uuid, text, integer, integer, text)
  to service_role;
grant execute on function public.fail_canonical_story_translation_job_service(text, text, uuid, text, text, text)
  to service_role;
grant execute on function public.get_canonical_story_translation_state_service(text, text, text)
  to service_role;

-- ============================================================================
-- 9. Legacy ID resolver. Unknown legacy id -> null (Edge Function returns
-- 404). Ambiguous Turkish search resolution is out of scope here (deferred
-- search phase); this resolver is purely legacy_word_id -> canonical.
-- ============================================================================

create or replace function public.resolve_legacy_word_id_service(p_legacy_word_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'canonicalWordId', m.canonical_word_id,
    'defaultExampleSetId', cw.default_example_set_id,
    'defaultStoryVariantId', cw.default_story_variant_id,
    'defaultSenseId', cw.default_sense_id,
    'contentBuildPending', cw.content_status <> 'published'
  )
  from private.legacy_word_canonical_map m
  join public.canonical_words cw on cw.id = m.canonical_word_id
  where m.legacy_word_id = p_legacy_word_id;
$$;

revoke all on function public.resolve_legacy_word_id_service(text) from public, anon, authenticated;
grant execute on function public.resolve_legacy_word_id_service(text) to service_role;
