-- WordLoop Phase 2A: protected content, ownership, premium checks, and atomic daily quotas.
-- Source of truth: WordLoop_SentenceLab_WordDNA_Teknik_Sartname.md

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;
grant usage on schema private to service_role;

-- The metadata table is intentionally safe for direct client reads. A legacy
-- installation may already have extra protected columns; migration 0002 moves
-- and drops them before restoring the metadata-only SELECT grant.
create table if not exists public.words (
  id text primary key,
  word text not null,
  category text not null,
  pronunciation text,
  meaning text,
  level text,
  word_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.words add column if not exists updated_at timestamptz not null default now();

create index if not exists words_category_idx on public.words (category);
create index if not exists words_level_idx on public.words (level);
create index if not exists words_word_idx on public.words (word);

create table if not exists public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_premium boolean not null default false,
  premium_until timestamptz,
  source text,
  updated_at timestamptz not null default now()
);

alter table public.entitlements add column if not exists is_premium boolean not null default false;
alter table public.entitlements add column if not exists premium_until timestamptz;
alter table public.entitlements add column if not exists source text;
alter table public.entitlements add column if not exists updated_at timestamptz not null default now();

create table if not exists public.user_words (
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id text not null references public.words(id) on delete cascade,
  added_at timestamptz not null default now(),
  status text not null default 'active',
  primary key (user_id, word_id),
  constraint user_words_status_check check (status in ('active', 'learning', 'learned', 'removed'))
);

create index if not exists user_words_word_id_idx on public.user_words (word_id);

create table if not exists private.word_learning_content (
  word_id text primary key references public.words(id) on delete cascade,
  ex_basic_en text,
  ex_basic_tr text,
  ex_mid_en text,
  ex_mid_tr text,
  ex_adv_en text,
  ex_adv_tr text,
  sp_present_en text,
  sp_present_tr text,
  pres_cont_en text,
  pres_cont_tr text,
  past_en text,
  past_tr text,
  future_en text,
  future_tr text,
  pres_perf_en text,
  pres_perf_tr text,
  story_en text,
  story_source_hash text,
  ai_context text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint word_learning_content_story_hash_check check (
    (story_en is null and story_source_hash is null)
    or (story_en is not null and story_source_hash ~ '^[0-9a-f]{64}$')
  )
);

create table if not exists private.daily_access_buckets (
  user_id uuid not null references auth.users(id) on delete cascade,
  access_date date not null,
  feature text not null,
  used_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, access_date, feature),
  constraint daily_access_buckets_feature_check check (feature in ('word_lab_full', 'word_story')),
  constraint daily_access_buckets_count_check check (used_count >= 0)
);

create table if not exists private.daily_word_access_grants (
  user_id uuid not null references auth.users(id) on delete cascade,
  access_date date not null,
  feature text not null,
  word_id text not null references public.words(id) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (user_id, access_date, feature, word_id),
  constraint daily_word_access_grants_feature_check check (feature in ('word_lab_full', 'word_story'))
);

create index if not exists daily_word_access_grants_lookup_idx
  on private.daily_word_access_grants (user_id, access_date, feature);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists words_touch_updated_at on public.words;
create trigger words_touch_updated_at
before update on public.words
for each row execute function private.touch_updated_at();

drop trigger if exists entitlements_touch_updated_at on public.entitlements;
create trigger entitlements_touch_updated_at
before update on public.entitlements
for each row execute function private.touch_updated_at();

drop trigger if exists word_learning_content_touch_updated_at on private.word_learning_content;
create trigger word_learning_content_touch_updated_at
before update on private.word_learning_content
for each row execute function private.touch_updated_at();

alter table public.words enable row level security;
alter table public.entitlements enable row level security;
alter table public.user_words enable row level security;
alter table private.word_learning_content enable row level security;
alter table private.daily_access_buckets enable row level security;
alter table private.daily_word_access_grants enable row level security;

drop policy if exists "words metadata read" on public.words;
create policy "words metadata read" on public.words
  for select to anon, authenticated using (true);

drop policy if exists "own entitlement read" on public.entitlements;
create policy "own entitlement read" on public.entitlements
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "own user words read" on public.user_words;
create policy "own user words read" on public.user_words
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "own user words insert" on public.user_words;
create policy "own user words insert" on public.user_words
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "own user words update" on public.user_words;
create policy "own user words update" on public.user_words
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own user words delete" on public.user_words;
create policy "own user words delete" on public.user_words
  for delete to authenticated using ((select auth.uid()) = user_id);

-- No policies are intentionally created on private tables. Even if the schema
-- is exposed by mistake later, anon/authenticated still cannot read the data.
revoke all on all tables in schema private from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

revoke all on public.entitlements from anon, authenticated;
grant select on public.entitlements to authenticated;

revoke all on public.user_words from anon, authenticated;
grant select, insert, update, delete on public.user_words to authenticated;

-- This function is the only authenticated path that allocates either daily
-- product quota. The bucket row is locked, serializing concurrent claims for a
-- user/date/feature tuple.
create or replace function public.claim_word_feature_access(
  p_word_id text,
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

  if p_word_id is null or btrim(p_word_id) = '' then
    raise exception using errcode = '22023', message = 'INVALID_WORD_ID';
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
    from public.user_words uw
    where uw.user_id = v_user_id
      and uw.word_id = p_word_id
      and uw.status <> 'removed'
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
    from private.daily_access_buckets b
    where b.user_id = v_user_id
      and b.access_date = v_access_date
      and b.feature = p_feature;

    daily_used := coalesce(v_used, 0);
    decision := case when p_feature = 'word_lab_full' then 'full' else 'allowed' end;
    return next;
    return;
  end if;

  insert into private.daily_access_buckets (user_id, access_date, feature, used_count)
  values (v_user_id, v_access_date, p_feature, 0)
  on conflict (user_id, access_date, feature) do nothing;

  select b.used_count
    into v_used
  from private.daily_access_buckets b
  where b.user_id = v_user_id
    and b.access_date = v_access_date
    and b.feature = p_feature
  for update;

  if exists (
    select 1
    from private.daily_word_access_grants g
    where g.user_id = v_user_id
      and g.access_date = v_access_date
      and g.feature = p_feature
      and g.word_id = p_word_id
  ) then
    daily_used := v_used;
    decision := case when p_feature = 'word_lab_full' then 'full' else 'allowed' end;
    return next;
    return;
  end if;

  if v_used < v_limit then
    insert into private.daily_word_access_grants (user_id, access_date, feature, word_id)
    values (v_user_id, v_access_date, p_feature, p_word_id)
    on conflict (user_id, access_date, feature, word_id) do nothing;

    get diagnostics v_inserted = row_count;

    if v_inserted = 1 then
      update private.daily_access_buckets b
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

revoke all on function public.claim_word_feature_access(text, text) from public, anon;
grant execute on function public.claim_word_feature_access(text, text) to authenticated;

-- The grants below are finalized in migration 0002 after every protected legacy
-- column has been physically removed from public.words.
revoke all on public.words from anon, authenticated;
