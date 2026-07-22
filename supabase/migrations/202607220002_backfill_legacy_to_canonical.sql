-- WordLoop Canonical 12.000: lossless backfill of the 8,000 legacy rows into the
-- canonical schema added by 202607220001. Source of truth: Teknik Şartname sec. 5.
--
-- Workflow (mirrors the Phase 2A word_import_staging pattern):
--   1. `npm run canonical:seed -- --words-import <path> --legacy-map <path>`
--      generates the ignored supabase/seed_canonical_backfill.sql file, which
--      loads the joined/validated dataset into private.canonical_backfill_staging.
--   2. `select public.apply_canonical_backfill_service(8000);` performs the
--      actual grouping/hashing/insert and raises loudly if any of the 8
--      invariants from sec. 5.8 do not hold, rolling back the whole transaction.
--
-- Nothing in this file deletes or modifies public.words, user_words,
-- entitlements, or any Phase 2A private table.

create unlogged table if not exists private.canonical_backfill_staging (
  legacy_word_id text,
  canonical_id text,
  normalized_word text,
  word text,
  legacy_category text,
  example_set_id text,
  story_variant_id text,
  metadata_variant_id text,
  is_canonical_default boolean,
  source text,
  pronunciation text,
  meaning_tr text,
  level text,
  word_type text,
  sense_content_hash text,
  example_set_content_hash text,
  ex_basic_en text, ex_basic_tr text,
  ex_mid_en text, ex_mid_tr text,
  ex_adv_en text, ex_adv_tr text,
  sp_present_en text, sp_present_tr text,
  pres_cont_en text, pres_cont_tr text,
  future_en text, future_tr text,
  past_en text, past_tr text,
  pres_perf_en text, pres_perf_tr text,
  story_en text,
  ai_context text
);

alter table private.canonical_backfill_staging enable row level security;
revoke all on private.canonical_backfill_staging from public, anon, authenticated;

create or replace function public.apply_canonical_backfill_service(
  p_expected_staging_rows integer default 8000
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staging_count integer;
  v_canonical_count integer;
  v_legacy_map_count integer;
  v_example_set_count integer;
  v_story_variant_count integer;
  v_sense_count integer;
  v_orphan_count integer;
  v_incomplete_published_count integer;
  v_bad_default_count integer;
  v_alias_count integer;
begin
  select count(*)::integer into v_staging_count from private.canonical_backfill_staging;
  if v_staging_count <> p_expected_staging_rows then
    raise exception using
      errcode = 'P0001',
      message = format('STAGING_ROW_COUNT_MISMATCH expected=%s actual=%s', p_expected_staging_rows, v_staging_count);
  end if;

  if exists (
    select 1 from private.canonical_backfill_staging s
    where s.legacy_word_id is null or btrim(s.legacy_word_id) = ''
       or s.canonical_id is null or btrim(s.canonical_id) = ''
       or s.normalized_word is null or btrim(s.normalized_word) = ''
       or s.example_set_id is null or s.story_variant_id is null or s.metadata_variant_id is null
       or s.meaning_tr is null or s.story_en is null
  ) then
    raise exception using errcode = 'P0001', message = 'STAGING_REQUIRED_VALUE_MISSING';
  end if;

  if exists (
    select 1 from private.canonical_backfill_staging
    group by legacy_word_id having count(*) > 1
  ) then
    raise exception using errcode = 'P0001', message = 'STAGING_DUPLICATE_LEGACY_WORD_ID';
  end if;

  if (
    select count(*) from (
      select canonical_id from private.canonical_backfill_staging
      where is_canonical_default group by canonical_id having count(*) <> 1
    ) bad
  ) > 0 then
    raise exception using errcode = 'P0001', message = 'STAGING_CANONICAL_DEFAULT_NOT_EXACTLY_ONE';
  end if;

  -- ------------------------------------------------------------------------
  -- 1. canonical_words -- one row per canonical, sourced from its default row.
  -- ------------------------------------------------------------------------
  insert into public.canonical_words (id, word, normalized_word, source, content_status)
  select s.canonical_id, s.word, s.normalized_word, 'legacy', 'draft'
  from private.canonical_backfill_staging s
  where s.is_canonical_default
  on conflict (id) do update
  set word = excluded.word,
      normalized_word = excluded.normalized_word,
      updated_at = clock_timestamp();

  -- 2. category associations.
  insert into public.canonical_word_categories (canonical_word_id, category, is_primary)
  select s.canonical_id, s.legacy_category, bool_or(s.is_canonical_default)
  from private.canonical_backfill_staging s
  group by s.canonical_id, s.legacy_category
  on conflict (canonical_word_id, category) do update
  set is_primary = excluded.is_primary;

  -- 3. sense/metadata variants. Ek not 1: grouped and later constrained by the
  -- PAIR (canonical_word_id, content_hash) -- never by metadata_variant_id alone.
  insert into public.canonical_word_senses (
    canonical_word_id, pronunciation, meaning_tr, level, word_type,
    is_default, content_hash, legacy_metadata_variant_id
  )
  select
    s.canonical_id,
    min(s.pronunciation), min(s.meaning_tr), min(s.level), min(s.word_type),
    bool_or(s.is_canonical_default), min(s.sense_content_hash), s.metadata_variant_id
  from private.canonical_backfill_staging s
  group by s.canonical_id, s.metadata_variant_id
  on conflict (canonical_word_id, content_hash) do update
  set is_default = public.canonical_word_senses.is_default or excluded.is_default;

  -- 4. WordDNA/SentenceLab example sets (private).
  insert into private.canonical_word_example_sets (
    id, canonical_word_id,
    ex_basic_en, ex_basic_tr, ex_mid_en, ex_mid_tr, ex_adv_en, ex_adv_tr,
    sp_present_en, sp_present_tr, pres_cont_en, pres_cont_tr,
    future_en, future_tr, past_en, past_tr, pres_perf_en, pres_perf_tr,
    content_hash, is_default
  )
  select
    s.example_set_id, min(s.canonical_id),
    min(s.ex_basic_en), min(s.ex_basic_tr), min(s.ex_mid_en), min(s.ex_mid_tr),
    min(s.ex_adv_en), min(s.ex_adv_tr), min(s.sp_present_en), min(s.sp_present_tr),
    min(s.pres_cont_en), min(s.pres_cont_tr), min(s.future_en), min(s.future_tr),
    min(s.past_en), min(s.past_tr), min(s.pres_perf_en), min(s.pres_perf_tr),
    min(s.example_set_content_hash), bool_or(s.is_canonical_default)
  from private.canonical_backfill_staging s
  group by s.example_set_id
  on conflict (id) do update
  set ex_basic_en = excluded.ex_basic_en, ex_basic_tr = excluded.ex_basic_tr,
      ex_mid_en = excluded.ex_mid_en, ex_mid_tr = excluded.ex_mid_tr,
      ex_adv_en = excluded.ex_adv_en, ex_adv_tr = excluded.ex_adv_tr,
      sp_present_en = excluded.sp_present_en, sp_present_tr = excluded.sp_present_tr,
      pres_cont_en = excluded.pres_cont_en, pres_cont_tr = excluded.pres_cont_tr,
      future_en = excluded.future_en, future_tr = excluded.future_tr,
      past_en = excluded.past_en, past_tr = excluded.past_tr,
      pres_perf_en = excluded.pres_perf_en, pres_perf_tr = excluded.pres_perf_tr,
      content_hash = excluded.content_hash, is_default = excluded.is_default,
      updated_at = clock_timestamp();

  insert into private.canonical_word_example_set_categories (example_set_id, category)
  select distinct s.example_set_id, s.legacy_category
  from private.canonical_backfill_staging s
  on conflict (example_set_id, category) do nothing;

  -- 5. story variants (one per legacy row -- 8,000 distinct English stories).
  insert into private.canonical_word_story_variants (
    id, canonical_word_id, story_en, story_source_hash, ai_context, is_default
  )
  select
    s.story_variant_id, min(s.canonical_id), min(s.story_en),
    private.story_source_hash(min(s.story_en)), min(s.ai_context), bool_or(s.is_canonical_default)
  from private.canonical_backfill_staging s
  group by s.story_variant_id
  on conflict (id) do update
  set story_en = excluded.story_en,
      story_source_hash = excluded.story_source_hash,
      ai_context = excluded.ai_context,
      is_default = excluded.is_default,
      updated_at = clock_timestamp();

  insert into private.canonical_word_story_categories (story_variant_id, category)
  select distinct s.story_variant_id, s.legacy_category
  from private.canonical_backfill_staging s
  on conflict (story_variant_id, category) do nothing;

  -- 6. legacy id -> canonical/variant map (required for the transition resolver).
  insert into private.legacy_word_canonical_map (
    legacy_word_id, canonical_word_id, example_set_id, story_variant_id, sense_id,
    legacy_category, is_canonical_default, source
  )
  select
    s.legacy_word_id, s.canonical_id, s.example_set_id, s.story_variant_id,
    sn.id, s.legacy_category, s.is_canonical_default, s.source
  from private.canonical_backfill_staging s
  join public.canonical_word_senses sn
    on sn.canonical_word_id = s.canonical_id
   and sn.legacy_metadata_variant_id = s.metadata_variant_id
  on conflict (legacy_word_id) do update
  set canonical_word_id = excluded.canonical_word_id,
      example_set_id = excluded.example_set_id,
      story_variant_id = excluded.story_variant_id,
      sense_id = excluded.sense_id,
      legacy_category = excluded.legacy_category,
      is_canonical_default = excluded.is_canonical_default,
      source = excluded.source;

  -- 7. finalize canonical_words defaults deterministically from the default row.
  update public.canonical_words cw
  set default_sense_id = m.sense_id,
      default_example_set_id = m.example_set_id,
      default_story_variant_id = m.story_variant_id,
      content_status = 'published',
      updated_at = clock_timestamp()
  from private.legacy_word_canonical_map m
  where m.canonical_word_id = cw.id
    and m.is_canonical_default = true
    and cw.source = 'legacy';

  -- 8. search aliases (private, service_role only -- see 202607220001). Self
  -- alias for every published canonical, plus the Ek not 2 hyphen/space
  -- reciprocal pairs, derived generically rather than hardcoded.
  insert into private.word_search_aliases (
    normalized_alias, canonical_word_id, display_alias, language_code, alias_type, verified, source_rank
  )
  select cw.normalized_word, cw.id, cw.word, 'en', 'exact', true, 0
  from public.canonical_words cw
  where cw.content_status = 'published'
  on conflict (normalized_alias, canonical_word_id) do nothing;

  insert into private.word_search_aliases (
    normalized_alias, canonical_word_id, display_alias, language_code, alias_type, verified, source_rank
  )
  select a.normalized_word, b.id, b.word, 'en', 'exact', true, 1
  from public.canonical_words a
  join public.canonical_words b
    on b.id <> a.id
   and (
     b.normalized_word = replace(a.normalized_word, '-', ' ')
     or b.normalized_word = replace(a.normalized_word, ' ', '-')
   )
  where a.content_status = 'published' and b.content_status = 'published'
  on conflict (normalized_alias, canonical_word_id) do nothing;

  -- ------------------------------------------------------------------------
  -- Sec. 5.8 invariants. Any failure rolls back the entire transaction.
  -- ------------------------------------------------------------------------
  select count(*)::integer into v_canonical_count from public.canonical_words where source = 'legacy';
  if v_canonical_count <> 5132 then
    raise exception using errcode = 'P0001',
      message = format('INVARIANT_FAILED canonical_words expected=5132 actual=%s', v_canonical_count);
  end if;

  select count(*)::integer into v_legacy_map_count from private.legacy_word_canonical_map;
  if v_legacy_map_count <> 8000 then
    raise exception using errcode = 'P0001',
      message = format('INVARIANT_FAILED legacy_word_canonical_map expected=8000 actual=%s', v_legacy_map_count);
  end if;

  select count(*)::integer into v_example_set_count from private.canonical_word_example_sets;
  if v_example_set_count <> 7151 then
    raise exception using errcode = 'P0001',
      message = format('INVARIANT_FAILED canonical_word_example_sets expected=7151 actual=%s', v_example_set_count);
  end if;

  select count(*)::integer into v_story_variant_count from private.canonical_word_story_variants;
  if v_story_variant_count <> 8000 then
    raise exception using errcode = 'P0001',
      message = format('INVARIANT_FAILED canonical_word_story_variants expected=8000 actual=%s', v_story_variant_count);
  end if;

  select count(*)::integer into v_sense_count from public.canonical_word_senses;
  if v_sense_count <> 5698 then
    raise exception using errcode = 'P0001',
      message = format('INVARIANT_FAILED canonical_word_senses expected=5698 actual=%s', v_sense_count);
  end if;

  select count(*)::integer into v_orphan_count
  from private.legacy_word_canonical_map m
  where not exists (select 1 from public.canonical_words cw where cw.id = m.canonical_word_id)
     or not exists (select 1 from private.canonical_word_example_sets es where es.id = m.example_set_id)
     or not exists (select 1 from private.canonical_word_story_variants sv where sv.id = m.story_variant_id)
     or not exists (select 1 from public.canonical_word_senses sn where sn.id = m.sense_id);
  if v_orphan_count <> 0 then
    raise exception using errcode = 'P0001',
      message = format('INVARIANT_FAILED orphan_foreign_keys expected=0 actual=%s', v_orphan_count);
  end if;

  select count(*)::integer into v_incomplete_published_count
  from public.canonical_words
  where content_status = 'published'
    and (default_sense_id is null or default_example_set_id is null or default_story_variant_id is null);
  if v_incomplete_published_count <> 0 then
    raise exception using errcode = 'P0001',
      message = format('INVARIANT_FAILED published_without_defaults expected=0 actual=%s', v_incomplete_published_count);
  end if;

  select count(*)::integer into v_bad_default_count
  from (
    select canonical_word_id from public.canonical_word_senses where is_default group by canonical_word_id having count(*) <> 1
    union all
    select canonical_word_id from private.canonical_word_example_sets where is_default group by canonical_word_id having count(*) <> 1
    union all
    select canonical_word_id from private.canonical_word_story_variants where is_default group by canonical_word_id having count(*) <> 1
  ) bad;
  if v_bad_default_count <> 0 then
    raise exception using errcode = 'P0001',
      message = format('INVARIANT_FAILED default_count_per_canonical_not_one actual_bad_groups=%s', v_bad_default_count);
  end if;

  -- Legacy story_tr never reaches the translation cache: structurally
  -- guaranteed because this function contains no reference whatsoever to
  -- private.story_translations or private.canonical_story_translations.

  select count(*)::integer into v_alias_count from private.word_search_aliases;

  return jsonb_build_object(
    'stagingRows', v_staging_count,
    'canonicalWords', v_canonical_count,
    'legacyMap', v_legacy_map_count,
    'exampleSets', v_example_set_count,
    'storyVariants', v_story_variant_count,
    'senses', v_sense_count,
    'orphanForeignKeys', v_orphan_count,
    'searchAliases', v_alias_count,
    'legacyTranslationCacheRowsInserted', 0
  );
end;
$$;

revoke all on function public.apply_canonical_backfill_service(integer) from public, anon, authenticated;
grant execute on function public.apply_canonical_backfill_service(integer) to service_role;
