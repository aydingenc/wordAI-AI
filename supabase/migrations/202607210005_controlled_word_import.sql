-- WordLoop Phase 2A: controlled fresh-install import path.
-- Load the legacy 7,999-row CSV into this private staging table, then call the
-- service-only function. The science-null repair from migration 0004 supplies
-- the 8,000th row. Re-running updates corrected content instead of hiding it
-- behind ON CONFLICT DO NOTHING.

create unlogged table if not exists private.word_import_staging (
  id text,
  word text,
  category text,
  pronunciation text,
  meaning text,
  level text,
  word_type text,
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
  future_en text,
  future_tr text,
  past_en text,
  past_tr text,
  pres_perf_en text,
  pres_perf_tr text,
  story_en text,
  story_tr text,
  ai_context text
);

alter table private.word_import_staging enable row level security;
revoke all on private.word_import_staging from public, anon, authenticated;

create or replace function public.apply_word_import_staging_service(
  p_expected_source_rows integer default 7999
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source_count integer;
  v_final_count integer;
  v_bad_category_count integer;
begin
  select count(*)::integer into v_source_count from private.word_import_staging;
  if v_source_count <> p_expected_source_rows then
    raise exception using
      errcode = 'P0001',
      message = format('STAGING_ROW_COUNT_MISMATCH expected=%s actual=%s', p_expected_source_rows, v_source_count);
  end if;

  if exists (
    select 1
    from private.word_import_staging s
    where s.id is null or btrim(s.id) = ''
       or s.word is null or btrim(s.word) = ''
       or s.category is null or btrim(s.category) = ''
  ) then
    raise exception using errcode = 'P0001', message = 'STAGING_REQUIRED_VALUE_MISSING';
  end if;

  if exists (
    select s.id
    from private.word_import_staging s
    group by s.id
    having count(*) > 1
  ) then
    raise exception using errcode = 'P0001', message = 'STAGING_DUPLICATE_WORD_ID';
  end if;

  insert into public.words (
    id, word, category, pronunciation, meaning, level, word_type
  )
  select
    s.id, s.word, s.category, s.pronunciation, s.meaning, s.level, s.word_type
  from private.word_import_staging s
  on conflict (id) do update
  set word = excluded.word,
      category = excluded.category,
      pronunciation = excluded.pronunciation,
      meaning = excluded.meaning,
      level = excluded.level,
      word_type = excluded.word_type,
      updated_at = clock_timestamp();

  insert into private.word_learning_content (
    word_id,
    ex_basic_en, ex_basic_tr,
    ex_mid_en, ex_mid_tr,
    ex_adv_en, ex_adv_tr,
    sp_present_en, sp_present_tr,
    pres_cont_en, pres_cont_tr,
    future_en, future_tr,
    past_en, past_tr,
    pres_perf_en, pres_perf_tr,
    story_en, story_source_hash, ai_context
  )
  select
    s.id,
    s.ex_basic_en, s.ex_basic_tr,
    s.ex_mid_en, s.ex_mid_tr,
    s.ex_adv_en, s.ex_adv_tr,
    s.sp_present_en, s.sp_present_tr,
    s.pres_cont_en, s.pres_cont_tr,
    s.future_en, s.future_tr,
    s.past_en, s.past_tr,
    s.pres_perf_en, s.pres_perf_tr,
    s.story_en, private.story_source_hash(s.story_en), s.ai_context
  from private.word_import_staging s
  on conflict (word_id) do update
  set ex_basic_en = excluded.ex_basic_en,
      ex_basic_tr = excluded.ex_basic_tr,
      ex_mid_en = excluded.ex_mid_en,
      ex_mid_tr = excluded.ex_mid_tr,
      ex_adv_en = excluded.ex_adv_en,
      ex_adv_tr = excluded.ex_adv_tr,
      sp_present_en = excluded.sp_present_en,
      sp_present_tr = excluded.sp_present_tr,
      pres_cont_en = excluded.pres_cont_en,
      pres_cont_tr = excluded.pres_cont_tr,
      future_en = excluded.future_en,
      future_tr = excluded.future_tr,
      past_en = excluded.past_en,
      past_tr = excluded.past_tr,
      pres_perf_en = excluded.pres_perf_en,
      pres_perf_tr = excluded.pres_perf_tr,
      story_en = excluded.story_en,
      story_source_hash = excluded.story_source_hash,
      ai_context = excluded.ai_context,
      updated_at = clock_timestamp();

  -- Rejected Turkish text is optional rollback material only. It is never
  -- promoted to a completed story_translations row.
  insert into private.legacy_story_translation_archive (word_id, legacy_story_tr)
  select s.id, s.story_tr
  from private.word_import_staging s
  where s.story_tr is not null and btrim(s.story_tr) <> ''
  on conflict (word_id) do update
  set legacy_story_tr = excluded.legacy_story_tr,
      archived_at = clock_timestamp();

  select count(*)::integer into v_final_count from public.words;
  select count(*)::integer
    into v_bad_category_count
  from (
    select w.category
    from public.words w
    group by w.category
    having count(*) <> 500
  ) invalid_categories;

  if v_final_count <> 8000
     or (select count(distinct w.category) from public.words w) <> 16
     or v_bad_category_count <> 0 then
    raise exception using
      errcode = 'P0001',
      message = format(
        'FINAL_CATALOG_VALIDATION_FAILED words=%s bad_categories=%s',
        v_final_count,
        v_bad_category_count
      );
  end if;

  return jsonb_build_object(
    'sourceRows', v_source_count,
    'finalWords', v_final_count,
    'categories', 16,
    'rowsPerCategory', 500,
    'translationCacheRowsImported', 0
  );
end;
$$;

revoke all on function public.apply_word_import_staging_service(integer)
  from public, anon, authenticated;
grant execute on function public.apply_word_import_staging_service(integer)
  to service_role;
