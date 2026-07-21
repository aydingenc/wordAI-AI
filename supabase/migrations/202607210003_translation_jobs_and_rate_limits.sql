-- WordLoop Phase 2A: cache-aside story translation jobs and endpoint rate limits.

create table if not exists private.story_translations (
  word_id text not null references public.words(id) on delete cascade,
  language_code text not null,
  source_hash text not null,
  translated_text text,
  status text not null,
  provider text not null default 'google_cloud_translation',
  model text not null default 'general/translation-llm',
  processing_started_at timestamptz,
  lease_until timestamptz,
  lease_token uuid,
  attempt_count integer not null default 0,
  next_retry_at timestamptz,
  last_error_code text,
  last_error_message text,
  input_character_count integer,
  output_character_count integer,
  translated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (word_id, language_code, source_hash),
  constraint story_translations_language_check check (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  constraint story_translations_hash_check check (source_hash ~ '^[0-9a-f]{64}$'),
  constraint story_translations_status_check check (status in ('processing', 'completed', 'failed')),
  constraint story_translations_attempt_check check (attempt_count >= 0),
  constraint story_translations_completed_text_check check (
    status <> 'completed' or (translated_text is not null and btrim(translated_text) <> '')
  )
);

create index if not exists story_translations_status_lease_idx
  on private.story_translations (status, lease_until);

create table if not exists private.api_rate_limits (
  subject_hash text not null,
  endpoint text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (subject_hash, endpoint, window_started_at),
  constraint api_rate_limits_subject_hash_check check (subject_hash ~ '^[0-9a-f]{64}$'),
  constraint api_rate_limits_count_check check (request_count >= 0)
);

create index if not exists api_rate_limits_updated_at_idx
  on private.api_rate_limits (updated_at);

alter table private.story_translations enable row level security;
alter table private.api_rate_limits enable row level security;
revoke all on private.story_translations from public, anon, authenticated;
revoke all on private.api_rate_limits from public, anon, authenticated;

drop trigger if exists story_translations_touch_updated_at on private.story_translations;
create trigger story_translations_touch_updated_at
before update on private.story_translations
for each row execute function private.touch_updated_at();

create or replace function public.claim_story_translation_job_service(
  p_word_id text,
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
  v_row private.story_translations%rowtype;
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
    from private.word_learning_content c
    where c.word_id = p_word_id
      and c.story_source_hash = p_source_hash
      and c.story_en is not null
  ) then
    raise exception using errcode = 'P0001', message = 'STALE_SOURCE_HASH';
  end if;

  insert into private.story_translations (
    word_id, language_code, source_hash, status, processing_started_at,
    lease_until, lease_token, attempt_count
  )
  values (
    p_word_id, p_language_code, p_source_hash, 'processing', v_now,
    v_now + make_interval(secs => v_lease_seconds), v_token, 1
  )
  on conflict (word_id, language_code, source_hash) do nothing;

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
  from private.story_translations st
  where st.word_id = p_word_id
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
      update private.story_translations st
      set status = 'failed',
          lease_until = null,
          lease_token = null,
          last_error_code = coalesce(st.last_error_code, 'LEASE_EXPIRED'),
          last_error_message = coalesce(st.last_error_message, 'Translation worker lease expired.'),
          next_retry_at = null
      where st.word_id = p_word_id
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

  update private.story_translations st
  set status = 'processing',
      translated_text = null,
      processing_started_at = v_now,
      lease_until = v_now + make_interval(secs => v_lease_seconds),
      lease_token = v_token,
      attempt_count = st.attempt_count + 1,
      next_retry_at = null,
      last_error_code = null,
      last_error_message = null
  where st.word_id = p_word_id
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

create or replace function public.complete_story_translation_job_service(
  p_word_id text,
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

  update private.story_translations st
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
  where st.word_id = p_word_id
    and st.language_code = p_language_code
    and st.source_hash = p_source_hash
    and st.status = 'processing'
    and st.lease_token = p_lease_token
    and st.lease_until >= clock_timestamp();

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

create or replace function public.fail_story_translation_job_service(
  p_word_id text,
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
  update private.story_translations st
  set status = 'failed',
      lease_until = null,
      lease_token = null,
      next_retry_at = clock_timestamp() + make_interval(
        secs => least(300, (5 * power(2, greatest(st.attempt_count - 1, 0)))::integer)
      ),
      last_error_code = left(coalesce(p_error_code, 'TRANSLATION_FAILED'), 80),
      last_error_message = left(coalesce(p_error_message, 'Translation failed.'), 500)
  where st.word_id = p_word_id
    and st.language_code = p_language_code
    and st.source_hash = p_source_hash
    and st.status = 'processing'
    and st.lease_token = p_lease_token;

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

create or replace function public.get_story_translation_state_service(
  p_word_id text,
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
    when c.story_source_hash <> p_source_hash then
      jsonb_build_object('translationStatus', 'stale')
    when st.word_id is null then
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
  from private.word_learning_content c
  left join private.story_translations st
    on st.word_id = c.word_id
   and st.language_code = p_language_code
   and st.source_hash = p_source_hash
  where c.word_id = p_word_id;
$$;

create or replace function public.consume_api_rate_limit_service(
  p_subject_hash text,
  p_endpoint text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_limit integer := greatest(1, least(coalesce(p_limit, 1), 1000));
  v_window integer := greatest(1, least(coalesce(p_window_seconds, 60), 3600));
  v_window_start timestamptz;
  v_count integer;
begin
  if p_subject_hash is null or p_subject_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'INVALID_RATE_LIMIT_SUBJECT';
  end if;

  if p_endpoint is null or p_endpoint !~ '^[a-z0-9-]{1,80}$' then
    raise exception using errcode = '22023', message = 'INVALID_RATE_LIMIT_ENDPOINT';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / v_window) * v_window
  );

  insert into private.api_rate_limits as rl (
    subject_hash, endpoint, window_started_at, request_count, updated_at
  )
  values (p_subject_hash, p_endpoint, v_window_start, 1, v_now)
  on conflict (subject_hash, endpoint, window_started_at) do update
  set request_count = rl.request_count + 1,
      updated_at = v_now
  where rl.request_count < v_limit
  returning request_count into v_count;

  if v_count is null then
    select rl.request_count
      into v_count
    from private.api_rate_limits rl
    where rl.subject_hash = p_subject_hash
      and rl.endpoint = p_endpoint
      and rl.window_started_at = v_window_start;

    allowed := false;
    remaining := 0;
  else
    allowed := true;
    remaining := greatest(v_limit - v_count, 0);
  end if;

  retry_after_seconds := greatest(
    1,
    ceil(extract(epoch from ((v_window_start + make_interval(secs => v_window)) - v_now)))::integer
  );
  return next;
end;
$$;

revoke all on function public.claim_story_translation_job_service(text, text, text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.complete_story_translation_job_service(text, text, uuid, text, integer, integer, text)
  from public, anon, authenticated;
revoke all on function public.fail_story_translation_job_service(text, text, uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function public.get_story_translation_state_service(text, text, text)
  from public, anon, authenticated;
revoke all on function public.consume_api_rate_limit_service(text, text, integer, integer)
  from public, anon, authenticated;

grant execute on function public.claim_story_translation_job_service(text, text, text, integer, integer)
  to service_role;
grant execute on function public.complete_story_translation_job_service(text, text, uuid, text, integer, integer, text)
  to service_role;
grant execute on function public.fail_story_translation_job_service(text, text, uuid, text, text, text)
  to service_role;
grant execute on function public.get_story_translation_state_service(text, text, text)
  to service_role;
grant execute on function public.consume_api_rate_limit_service(text, text, integer, integer)
  to service_role;

alter default privileges in schema private revoke all on tables from public, anon, authenticated;
alter default privileges in schema private revoke all on functions from public, anon, authenticated;
