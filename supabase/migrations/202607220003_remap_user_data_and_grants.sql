-- WordLoop Canonical 12.000: canonical-keyed user library and daily grants.
-- Source of truth: Teknik Şartname sec. 6.
--
-- This is additive, not a migration of public.user_words /
-- private.daily_access_buckets / private.daily_word_access_grants in place --
-- those stay exactly as they are and keep serving the V1 endpoints untouched.
-- The tables below are the V2 equivalents, populated from the V1 tables via an
-- idempotent remap function that can be re-run any time during the transition.

create table if not exists public.canonical_user_words (
  user_id uuid not null references auth.users(id) on delete cascade,
  canonical_word_id text not null references public.canonical_words(id) on delete cascade,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'active',
  primary key (user_id, canonical_word_id),
  constraint canonical_user_words_status_check check (status in ('active', 'learning', 'learned', 'removed'))
);

create index if not exists canonical_user_words_canonical_word_id_idx
  on public.canonical_user_words (canonical_word_id);

alter table public.canonical_user_words enable row level security;

drop policy if exists "own canonical user words read" on public.canonical_user_words;
create policy "own canonical user words read" on public.canonical_user_words
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "own canonical user words insert" on public.canonical_user_words;
create policy "own canonical user words insert" on public.canonical_user_words
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "own canonical user words update" on public.canonical_user_words;
create policy "own canonical user words update" on public.canonical_user_words
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own canonical user words delete" on public.canonical_user_words;
create policy "own canonical user words delete" on public.canonical_user_words
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.canonical_user_words from anon, authenticated;
grant select, insert, update, delete on public.canonical_user_words to authenticated;
grant all on public.canonical_user_words to service_role;

create table if not exists private.canonical_daily_access_buckets (
  user_id uuid not null references auth.users(id) on delete cascade,
  access_date date not null,
  feature text not null,
  used_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, access_date, feature),
  constraint canonical_daily_access_buckets_feature_check check (feature in ('word_lab_full', 'word_story')),
  constraint canonical_daily_access_buckets_count_check check (used_count >= 0)
);

create table if not exists private.canonical_daily_word_access_grants (
  user_id uuid not null references auth.users(id) on delete cascade,
  access_date date not null,
  feature text not null,
  canonical_word_id text not null references public.canonical_words(id) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (user_id, access_date, feature, canonical_word_id),
  constraint canonical_daily_word_access_grants_feature_check check (feature in ('word_lab_full', 'word_story'))
);

create index if not exists canonical_daily_word_access_grants_lookup_idx
  on private.canonical_daily_word_access_grants (user_id, access_date, feature);

alter table private.canonical_daily_access_buckets enable row level security;
alter table private.canonical_daily_word_access_grants enable row level security;
revoke all on private.canonical_daily_access_buckets from public, anon, authenticated;
revoke all on private.canonical_daily_word_access_grants from public, anon, authenticated;
grant all on private.canonical_daily_access_buckets to service_role;
grant all on private.canonical_daily_word_access_grants to service_role;

drop trigger if exists canonical_user_words_touch_updated_at on public.canonical_user_words;
create trigger canonical_user_words_touch_updated_at
before update on public.canonical_user_words
for each row execute function private.touch_updated_at();

drop trigger if exists canonical_daily_access_buckets_touch_updated_at on private.canonical_daily_access_buckets;
create trigger canonical_daily_access_buckets_touch_updated_at
before update on private.canonical_daily_access_buckets
for each row execute function private.touch_updated_at();

-- ============================================================================
-- 6.1 Idempotent user_words -> canonical_user_words remap.
--
-- Merge rule per legacy word_id group that resolves to the same canonical:
--   added_at   = min(added_at)
--   updated_at = max(updated_at)
--   status     = highest priority present: learned > learning > active > removed
--   (an active/non-removed row is never overridden by a removed one)
-- ============================================================================

create or replace function public.remap_user_words_to_canonical_service()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_upserted integer;
begin
  with resolved as (
    select
      uw.user_id,
      m.canonical_word_id,
      min(uw.added_at) as added_at,
      max(uw.updated_at) as updated_at,
      case
        when bool_or(uw.status = 'learned') then 'learned'
        when bool_or(uw.status = 'learning') then 'learning'
        when bool_or(uw.status = 'active') then 'active'
        else 'removed'
      end as status
    from public.user_words uw
    join private.legacy_word_canonical_map m on m.legacy_word_id = uw.word_id
    group by uw.user_id, m.canonical_word_id
  )
  insert into public.canonical_user_words (user_id, canonical_word_id, added_at, updated_at, status)
  select user_id, canonical_word_id, added_at, updated_at, status
  from resolved
  on conflict (user_id, canonical_word_id) do update
  set added_at = least(public.canonical_user_words.added_at, excluded.added_at),
      updated_at = greatest(public.canonical_user_words.updated_at, excluded.updated_at),
      status = case
        when excluded.status = 'learned' or public.canonical_user_words.status = 'learned' then 'learned'
        when excluded.status = 'learning' or public.canonical_user_words.status = 'learning' then 'learning'
        when excluded.status = 'active' or public.canonical_user_words.status = 'active' then 'active'
        else 'removed'
      end;

  get diagnostics v_upserted = row_count;

  return jsonb_build_object('canonicalUserWordsUpserted', v_upserted);
end;
$$;

revoke all on function public.remap_user_words_to_canonical_service() from public, anon, authenticated;
grant execute on function public.remap_user_words_to_canonical_service() to service_role;

-- ============================================================================
-- 6.2 Idempotent daily grant remap. used_count is recomputed from the distinct
-- canonical grant rows, not carried over from the legacy per-word count, so a
-- user cannot inflate or dodge quota by opening different legacy rows of the
-- same canonical word.
-- ============================================================================

create or replace function public.remap_daily_grants_to_canonical_service()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_grants_upserted integer;
  v_buckets_upserted integer;
begin
  insert into private.canonical_daily_word_access_grants (user_id, access_date, feature, canonical_word_id, granted_at)
  select g.user_id, g.access_date, g.feature, m.canonical_word_id, min(g.granted_at)
  from private.daily_word_access_grants g
  join private.legacy_word_canonical_map m on m.legacy_word_id = g.word_id
  group by g.user_id, g.access_date, g.feature, m.canonical_word_id
  on conflict (user_id, access_date, feature, canonical_word_id) do nothing;

  get diagnostics v_grants_upserted = row_count;

  insert into private.canonical_daily_access_buckets (user_id, access_date, feature, used_count)
  select user_id, access_date, feature, count(*)
  from private.canonical_daily_word_access_grants
  group by user_id, access_date, feature
  on conflict (user_id, access_date, feature) do update
  set used_count = excluded.used_count,
      updated_at = clock_timestamp();

  get diagnostics v_buckets_upserted = row_count;

  return jsonb_build_object(
    'canonicalGrantsInserted', v_grants_upserted,
    'canonicalBucketsUpserted', v_buckets_upserted
  );
end;
$$;

revoke all on function public.remap_daily_grants_to_canonical_service() from public, anon, authenticated;
grant execute on function public.remap_daily_grants_to_canonical_service() to service_role;

-- Run once now for whatever V1 data already exists. Safe to re-run at any time.
select public.remap_user_words_to_canonical_service();
select public.remap_daily_grants_to_canonical_service();
