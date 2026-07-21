-- WordLoop Phase 2A: move premium text out of public.words, archive the rejected
-- Turkish stories, and reduce public.words to metadata only.

create or replace function private.story_source_hash(p_story text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select case
    when p_story is null or btrim(p_story) = '' then null
    else encode(
      extensions.digest(
        convert_to(
          btrim(
            regexp_replace(
              replace(replace(p_story, E'\r\n', E'\n'), E'\r', E'\n'),
              E'[ \t]+',
              ' ',
              'g'
            )
          ),
          'UTF8'
        ),
        'sha256'
      ),
      'hex'
    )
  end;
$$;

revoke all on function private.story_source_hash(text) from public, anon, authenticated;

-- Old story_tr values are retained only for rollback/audit. They are never
-- inserted into private.story_translations and are never served by Phase 2A.
create table if not exists private.legacy_story_translation_archive (
  word_id text primary key references public.words(id) on delete cascade,
  legacy_story_tr text not null,
  archived_at timestamptz not null default now()
);

alter table private.legacy_story_translation_archive enable row level security;
revoke all on private.legacy_story_translation_archive from public, anon, authenticated;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'words'
      and column_name = 'story_tr'
  ) then
    execute $archive$
      insert into private.legacy_story_translation_archive (word_id, legacy_story_tr)
      select id, story_tr
      from public.words
      where story_tr is not null and btrim(story_tr) <> ''
      on conflict (word_id) do update
      set legacy_story_tr = excluded.legacy_story_tr,
          archived_at = clock_timestamp()
    $archive$;
  end if;
end;
$$;

-- Dynamic SQL keeps this migration compatible with both the legacy wide table
-- and a clean install where public.words is already metadata-only.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'words'
      and column_name = 'story_en'
  ) then
    execute $move$
      insert into private.word_learning_content (
        word_id,
        ex_basic_en, ex_basic_tr,
        ex_mid_en, ex_mid_tr,
        ex_adv_en, ex_adv_tr,
        sp_present_en, sp_present_tr,
        pres_cont_en, pres_cont_tr,
        past_en, past_tr,
        future_en, future_tr,
        pres_perf_en, pres_perf_tr,
        story_en, story_source_hash, ai_context
      )
      select
        id,
        ex_basic_en, ex_basic_tr,
        ex_mid_en, ex_mid_tr,
        ex_adv_en, ex_adv_tr,
        sp_present_en, sp_present_tr,
        pres_cont_en, pres_cont_tr,
        past_en, past_tr,
        future_en, future_tr,
        pres_perf_en, pres_perf_tr,
        story_en, private.story_source_hash(story_en), ai_context
      from public.words
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
          past_en = excluded.past_en,
          past_tr = excluded.past_tr,
          future_en = excluded.future_en,
          future_tr = excluded.future_tr,
          pres_perf_en = excluded.pres_perf_en,
          pres_perf_tr = excluded.pres_perf_tr,
          story_en = excluded.story_en,
          story_source_hash = excluded.story_source_hash,
          ai_context = excluded.ai_context,
          updated_at = clock_timestamp()
    $move$;
  end if;
end;
$$;

-- Remove every premium/story field from the client-readable relation. Keeping
-- them with only a UI lock or a permissive RLS policy is not a security boundary.
alter table public.words
  drop column if exists ex_basic_en,
  drop column if exists ex_basic_tr,
  drop column if exists ex_mid_en,
  drop column if exists ex_mid_tr,
  drop column if exists ex_adv_en,
  drop column if exists ex_adv_tr,
  drop column if exists sp_present_en,
  drop column if exists sp_present_tr,
  drop column if exists pres_cont_en,
  drop column if exists pres_cont_tr,
  drop column if exists future_en,
  drop column if exists future_tr,
  drop column if exists past_en,
  drop column if exists past_tr,
  drop column if exists pres_perf_en,
  drop column if exists pres_perf_tr,
  drop column if exists story_en,
  drop column if exists story_tr,
  drop column if exists ai_context;

drop policy if exists "kelimeler herkese açık okuma" on public.words;
drop policy if exists "words metadata read" on public.words;
create policy "words metadata read" on public.words
  for select to anon, authenticated using (true);

revoke all on public.words from anon, authenticated;
grant select on public.words to anon, authenticated;
grant all on public.words to service_role;

create or replace function public.get_word_lab_payload_service(p_word_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'word', jsonb_strip_nulls(jsonb_build_object(
      'id', w.id,
      'text', w.word,
      'category', w.category,
      'pronunciation', w.pronunciation,
      'meaning', w.meaning,
      'level', w.level,
      'wordType', w.word_type
    )),
    'wordDna', jsonb_strip_nulls(jsonb_build_object(
      'basic', case when c.ex_basic_en is null and c.ex_basic_tr is null then null else
        jsonb_strip_nulls(jsonb_build_object('en', c.ex_basic_en, 'tr', c.ex_basic_tr)) end,
      'mid', case when c.ex_mid_en is null and c.ex_mid_tr is null then null else
        jsonb_strip_nulls(jsonb_build_object('en', c.ex_mid_en, 'tr', c.ex_mid_tr)) end,
      'advanced', case when c.ex_adv_en is null and c.ex_adv_tr is null then null else
        jsonb_strip_nulls(jsonb_build_object('en', c.ex_adv_en, 'tr', c.ex_adv_tr)) end
    )),
    'sentenceLab', jsonb_strip_nulls(jsonb_build_object(
      'present', case when c.sp_present_en is null and c.sp_present_tr is null then null else
        jsonb_strip_nulls(jsonb_build_object('en', c.sp_present_en, 'tr', c.sp_present_tr)) end,
      'presentContinuous', case when c.pres_cont_en is null and c.pres_cont_tr is null then null else
        jsonb_strip_nulls(jsonb_build_object('en', c.pres_cont_en, 'tr', c.pres_cont_tr)) end,
      'past', case when c.past_en is null and c.past_tr is null then null else
        jsonb_strip_nulls(jsonb_build_object('en', c.past_en, 'tr', c.past_tr)) end,
      'future', case when c.future_en is null and c.future_tr is null then null else
        jsonb_strip_nulls(jsonb_build_object('en', c.future_en, 'tr', c.future_tr)) end,
      'presentPerfect', case when c.pres_perf_en is null and c.pres_perf_tr is null then null else
        jsonb_strip_nulls(jsonb_build_object('en', c.pres_perf_en, 'tr', c.pres_perf_tr)) end
    ))
  )
  from public.words w
  join private.word_learning_content c on c.word_id = w.id
  where w.id = p_word_id;
$$;

create or replace function public.get_word_story_payload_service(p_word_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'wordId', c.word_id,
    'storyEn', c.story_en,
    'sourceHash', c.story_source_hash
  )
  from private.word_learning_content c
  where c.word_id = p_word_id
    and c.story_en is not null
    and c.story_source_hash is not null;
$$;

revoke all on function public.get_word_lab_payload_service(text) from public, anon, authenticated;
revoke all on function public.get_word_story_payload_service(text) from public, anon, authenticated;
grant execute on function public.get_word_lab_payload_service(text) to service_role;
grant execute on function public.get_word_story_payload_service(text) to service_role;
