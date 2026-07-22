-- WordLoop Canonical 12.000: schema for the deduplicated canonical word model.
-- Source of truth: WordLoop_Canonical_12000_Teknik_Sartname.md (secs. 3-4) plus the
-- user's "Ek not 1/2" corrections (sense uniqueness is (canonical_word_id, content_hash),
-- never content_hash alone; word_search_aliases lives in `private`, service_role only).
--
-- This migration only adds tables. It does not touch public.words, user_words,
-- entitlements, or any Phase 2A private table -- those stay fully functional for the
-- V1 endpoints until a separate, later cutover migration.

-- ============================================================================
-- 4.1 Public metadata tables
-- ============================================================================

create table if not exists public.canonical_words (
  id text primary key,
  word text not null,
  normalized_word text not null unique,
  default_sense_id uuid,
  default_example_set_id text,
  default_story_variant_id text,
  content_status text not null default 'draft',
  source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint canonical_words_content_status_check
    check (content_status in ('draft', 'validating', 'published', 'rejected')),
  constraint canonical_words_source_check
    check (source in ('legacy', 'prewarm', 'on_demand')),
  constraint canonical_words_published_defaults_check check (
    content_status <> 'published'
    or (
      default_sense_id is not null
      and default_example_set_id is not null
      and default_story_variant_id is not null
    )
  )
);

create index if not exists canonical_words_content_status_idx
  on public.canonical_words (content_status);

drop trigger if exists canonical_words_touch_updated_at on public.canonical_words;
create trigger canonical_words_touch_updated_at
before update on public.canonical_words
for each row execute function private.touch_updated_at();

create table if not exists public.canonical_word_categories (
  canonical_word_id text not null references public.canonical_words(id) on delete cascade,
  category text not null,
  is_primary boolean not null default false,
  primary key (canonical_word_id, category)
);

create unique index if not exists canonical_word_categories_one_primary_idx
  on public.canonical_word_categories (canonical_word_id) where is_primary;

-- Sense/metadata variant. Ek not 1: the unique key is the PAIR
-- (canonical_word_id, content_hash) -- content_hash (derived from the workbook's
-- metadata_variant_id content) is intentionally NOT unique on its own, because two
-- unrelated canonicals can legitimately share identical pronunciation/meaning/level/
-- word_type content. legacy_metadata_variant_id is provenance only, never unique.
create table if not exists public.canonical_word_senses (
  id uuid primary key default extensions.gen_random_uuid(),
  canonical_word_id text not null references public.canonical_words(id) on delete cascade,
  pronunciation text,
  meaning_tr text not null,
  level text,
  word_type text,
  is_default boolean not null default false,
  content_hash text not null,
  legacy_metadata_variant_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint canonical_word_senses_content_hash_check check (content_hash ~ '^[0-9a-f]{64}$'),
  unique (canonical_word_id, content_hash)
);

create index if not exists canonical_word_senses_canonical_word_id_idx
  on public.canonical_word_senses (canonical_word_id);
create index if not exists canonical_word_senses_legacy_metadata_variant_id_idx
  on public.canonical_word_senses (legacy_metadata_variant_id);
create unique index if not exists canonical_word_senses_one_default_idx
  on public.canonical_word_senses (canonical_word_id) where is_default;

drop trigger if exists canonical_word_senses_touch_updated_at on public.canonical_word_senses;
create trigger canonical_word_senses_touch_updated_at
before update on public.canonical_word_senses
for each row execute function private.touch_updated_at();

alter table public.canonical_words
  add constraint canonical_words_default_sense_id_fkey
  foreign key (default_sense_id) references public.canonical_word_senses(id);

-- ============================================================================
-- 4.2 Private content tables
-- ============================================================================

-- WordDNA/SentenceLab example set. id reuses the workbook's deterministic
-- `exs-{slug}-{hash}` value directly -- it is already the canonical, reproducible
-- identifier the spec requires, so a second surrogate key would only add drift risk.
create table if not exists private.canonical_word_example_sets (
  id text primary key,
  canonical_word_id text not null references public.canonical_words(id) on delete cascade,
  ex_basic_en text not null,
  ex_basic_tr text not null,
  ex_mid_en text not null,
  ex_mid_tr text not null,
  ex_adv_en text not null,
  ex_adv_tr text not null,
  sp_present_en text not null,
  sp_present_tr text not null,
  pres_cont_en text not null,
  pres_cont_tr text not null,
  future_en text not null,
  future_tr text not null,
  past_en text not null,
  past_tr text not null,
  pres_perf_en text not null,
  pres_perf_tr text not null,
  content_hash text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint canonical_word_example_sets_hash_check check (content_hash ~ '^[0-9a-f]{64}$'),
  unique (canonical_word_id, content_hash)
);

create index if not exists canonical_word_example_sets_canonical_word_id_idx
  on private.canonical_word_example_sets (canonical_word_id);
create unique index if not exists canonical_word_example_sets_one_default_idx
  on private.canonical_word_example_sets (canonical_word_id) where is_default;

drop trigger if exists canonical_word_example_sets_touch_updated_at on private.canonical_word_example_sets;
create trigger canonical_word_example_sets_touch_updated_at
before update on private.canonical_word_example_sets
for each row execute function private.touch_updated_at();

create table if not exists private.canonical_word_example_set_categories (
  example_set_id text not null references private.canonical_word_example_sets(id) on delete cascade,
  category text not null,
  primary key (example_set_id, category)
);

-- Story variant. id reuses the workbook's deterministic `stv-{slug}-{hash}` value.
create table if not exists private.canonical_word_story_variants (
  id text primary key,
  canonical_word_id text not null references public.canonical_words(id) on delete cascade,
  story_en text not null,
  story_source_hash text not null,
  ai_context text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint canonical_word_story_variants_hash_check check (story_source_hash ~ '^[0-9a-f]{64}$'),
  unique (canonical_word_id, story_source_hash)
);

create index if not exists canonical_word_story_variants_canonical_word_id_idx
  on private.canonical_word_story_variants (canonical_word_id);
create unique index if not exists canonical_word_story_variants_one_default_idx
  on private.canonical_word_story_variants (canonical_word_id) where is_default;

drop trigger if exists canonical_word_story_variants_touch_updated_at on private.canonical_word_story_variants;
create trigger canonical_word_story_variants_touch_updated_at
before update on private.canonical_word_story_variants
for each row execute function private.touch_updated_at();

create table if not exists private.canonical_word_story_categories (
  story_variant_id text not null references private.canonical_word_story_variants(id) on delete cascade,
  category text not null,
  primary key (story_variant_id, category)
);

alter table public.canonical_words
  add constraint canonical_words_default_example_set_id_fkey
  foreign key (default_example_set_id) references private.canonical_word_example_sets(id),
  add constraint canonical_words_default_story_variant_id_fkey
  foreign key (default_story_variant_id) references private.canonical_word_story_variants(id);

-- Required during the transition to resolve old deep-links, favorites, and
-- user records that still carry a legacy word_id.
create table if not exists private.legacy_word_canonical_map (
  legacy_word_id text primary key references public.words(id) on delete cascade,
  canonical_word_id text not null references public.canonical_words(id) on delete cascade,
  example_set_id text not null references private.canonical_word_example_sets(id) on delete cascade,
  story_variant_id text not null references private.canonical_word_story_variants(id) on delete cascade,
  sense_id uuid not null references public.canonical_word_senses(id) on delete cascade,
  legacy_category text not null,
  is_canonical_default boolean not null default false,
  source text not null,
  created_at timestamptz not null default now()
);

create index if not exists legacy_word_canonical_map_canonical_word_id_idx
  on private.legacy_word_canonical_map (canonical_word_id);
create unique index if not exists legacy_word_canonical_map_one_default_idx
  on private.legacy_word_canonical_map (canonical_word_id) where is_canonical_default;

-- ============================================================================
-- Search aliases -- PRIVATE by explicit user decision (overrides the Home Search
-- spec's section 4.1 "public.word_search_aliases"). Search must run entirely
-- through an Edge Function; a public table would let a client bypass the rate
-- limit and generation quota. No anon/authenticated grant of any kind. Populated
-- during this backfill (self alias + the 11 hyphen/space reciprocal pairs, Ek
-- not 2); the search-facing Edge Functions themselves are a separate, later
-- phase (audit-home-search-phase-2b) and are intentionally not built here.
-- ============================================================================

-- Deviation from the spec's literal section 4.1 column list, which gave
-- `normalized_alias` a standalone primary key (one alias -> exactly one
-- canonical). That is not actually satisfiable together with Ek not 2's
-- reciprocal hyphen/space aliasing: "date night" must resolve to both its own
-- canonical and "date-night"'s canonical, which needs two rows for the same
-- alias text. The same spec paragraph already anticipates one-alias-to-many
-- results ("aynı Türkçe sorgu birden çok kelimeye gidiyorsa arayüz seçim
-- listesi göstermeli"), so the primary key here is the pair instead -- this
-- preserves every stated requirement while making the reciprocal case
-- representable at all.
create table if not exists private.word_search_aliases (
  normalized_alias text not null,
  canonical_word_id text not null references public.canonical_words(id) on delete cascade,
  display_alias text not null,
  language_code text not null,
  alias_type text not null,
  verified boolean not null default false,
  source_rank integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (normalized_alias, canonical_word_id),
  constraint word_search_aliases_language_check check (language_code in ('en', 'tr')),
  constraint word_search_aliases_type_check
    check (alias_type in ('exact', 'inflection', 'turkish_meaning', 'legacy_id'))
);

create index if not exists word_search_aliases_canonical_word_id_idx
  on private.word_search_aliases (canonical_word_id);
create index if not exists word_search_aliases_normalized_alias_idx
  on private.word_search_aliases (normalized_alias);

drop trigger if exists word_search_aliases_touch_updated_at on private.word_search_aliases;
create trigger word_search_aliases_touch_updated_at
before update on private.word_search_aliases
for each row execute function private.touch_updated_at();

-- ============================================================================
-- 4.3 Story translation cache, re-keyed to (story_variant_id, language_code,
-- source_hash). This is additive: Phase 2A's private.story_translations (keyed
-- on legacy word_id) is untouched and keeps serving the V1 endpoints.
-- ============================================================================

create table if not exists private.canonical_story_translations (
  story_variant_id text not null references private.canonical_word_story_variants(id) on delete cascade,
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
  primary key (story_variant_id, language_code, source_hash),
  constraint canonical_story_translations_language_check check (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  constraint canonical_story_translations_hash_check check (source_hash ~ '^[0-9a-f]{64}$'),
  constraint canonical_story_translations_status_check check (status in ('processing', 'completed', 'failed')),
  constraint canonical_story_translations_attempt_check check (attempt_count >= 0),
  constraint canonical_story_translations_completed_text_check check (
    status <> 'completed' or (translated_text is not null and btrim(translated_text) <> '')
  )
);

create index if not exists canonical_story_translations_status_lease_idx
  on private.canonical_story_translations (status, lease_until);

drop trigger if exists canonical_story_translations_touch_updated_at on private.canonical_story_translations;
create trigger canonical_story_translations_touch_updated_at
before update on private.canonical_story_translations
for each row execute function private.touch_updated_at();

-- Legacy story_tr must never reach this cache via migration, seed, or fallback.
-- There is deliberately no code path anywhere in this migration that writes to
-- private.canonical_story_translations except the job-claim/complete RPCs added
-- in a later migration.

-- ============================================================================
-- RLS + grants
-- ============================================================================

alter table public.canonical_words enable row level security;
alter table public.canonical_word_categories enable row level security;
alter table public.canonical_word_senses enable row level security;
alter table private.canonical_word_example_sets enable row level security;
alter table private.canonical_word_example_set_categories enable row level security;
alter table private.canonical_word_story_variants enable row level security;
alter table private.canonical_word_story_categories enable row level security;
alter table private.legacy_word_canonical_map enable row level security;
alter table private.word_search_aliases enable row level security;
alter table private.canonical_story_translations enable row level security;

drop policy if exists "canonical words metadata read" on public.canonical_words;
create policy "canonical words metadata read" on public.canonical_words
  for select to anon, authenticated using (content_status = 'published');

drop policy if exists "canonical word categories read" on public.canonical_word_categories;
create policy "canonical word categories read" on public.canonical_word_categories
  for select to anon, authenticated using (
    exists (
      select 1 from public.canonical_words cw
      where cw.id = canonical_word_categories.canonical_word_id
        and cw.content_status = 'published'
    )
  );

drop policy if exists "canonical word senses read" on public.canonical_word_senses;
create policy "canonical word senses read" on public.canonical_word_senses
  for select to anon, authenticated using (
    exists (
      select 1 from public.canonical_words cw
      where cw.id = canonical_word_senses.canonical_word_id
        and cw.content_status = 'published'
    )
  );

-- No policies on any private-schema table above -- even if the schema were
-- exposed by mistake later, anon/authenticated still could not read the rows.

revoke all on public.canonical_words from anon, authenticated;
grant select on public.canonical_words to anon, authenticated;
grant all on public.canonical_words to service_role;

revoke all on public.canonical_word_categories from anon, authenticated;
grant select on public.canonical_word_categories to anon, authenticated;
grant all on public.canonical_word_categories to service_role;

revoke all on public.canonical_word_senses from anon, authenticated;
grant select on public.canonical_word_senses to anon, authenticated;
grant all on public.canonical_word_senses to service_role;

revoke all on private.canonical_word_example_sets from public, anon, authenticated;
revoke all on private.canonical_word_example_set_categories from public, anon, authenticated;
revoke all on private.canonical_word_story_variants from public, anon, authenticated;
revoke all on private.canonical_word_story_categories from public, anon, authenticated;
revoke all on private.legacy_word_canonical_map from public, anon, authenticated;
revoke all on private.word_search_aliases from public, anon, authenticated;
revoke all on private.canonical_story_translations from public, anon, authenticated;

grant all on private.canonical_word_example_sets to service_role;
grant all on private.canonical_word_example_set_categories to service_role;
grant all on private.canonical_word_story_variants to service_role;
grant all on private.canonical_word_story_categories to service_role;
grant all on private.legacy_word_canonical_map to service_role;
grant all on private.word_search_aliases to service_role;
grant all on private.canonical_story_translations to service_role;
