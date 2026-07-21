-- WordLoop Phase 2A data repair.
-- The source workbook's Science!A429 cell is blank, while the remaining cells
-- clearly describe the word "null". The legacy story incorrectly targeted
-- "nan". This migration restores the missing 8,000th catalog record and writes
-- a newly authored English story. It deliberately creates no Turkish cache row.

insert into public.words (
  id, word, category, pronunciation, meaning, level, word_type
)
values (
  'science-null', 'null', 'Science', '/nʌl/', 'geçersiz, boş', 'C1', 'adjective'
)
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
values (
  'science-null',
  'The experiment had a null result.',
  'Deneyin sonucu geçersizdi.',
  'In statistics, a null hypothesis is a statement that there is no effect.',
  'İstatistikte, null hipotezi etkisiz olduğunu belirten bir ifadedir.',
  'The researchers concluded that the null findings challenge the existing theories in the field.',
  'Araştırmacılar, geçersiz bulguların alandaki mevcut teorileri sorguladığını belirtti.',
  'The null value indicates no data.',
  'Geçersiz değer veri olmadığını gösterir.',
  'The scientists are testing the null hypothesis in their study.',
  'Bilim insanları, çalışmalarında null hipotezini test ediyorlar.',
  'They will reject the null hypothesis if the results are significant.',
  'Sonuçlar önemliyse, null hipotezini reddedecekler.',
  'The team found that the null results were unexpected.',
  'Ekip, geçersiz sonuçların beklenmedik olduğunu buldu.',
  'The researchers have published their findings on the null effects.',
  'Araştırmacılar, geçersiz etkilerle ilgili bulgularını yayımladı.',
  $story$
In a statistics lab, Elif began with the *null* hypothesis: the new treatment had no measurable effect. While checking the dataset, she also found a *null* value from a disconnected sensor. She marked that value as missing instead of treating it as zero.

After the data was cleaned, the evidence no longer supported the *null* hypothesis. The difference between the two groups was large enough for the team to reject the *null* and investigate why the treatment worked.

In her report, Elif explained the distinction carefully. In a database, *null* can mean that a value is absent or unknown; in statistics, the *null* describes a starting claim of no effect. The same word appeared in two scientific settings, but its precise meaning depended on the context.
$story$,
  private.story_source_hash($story$
In a statistics lab, Elif began with the *null* hypothesis: the new treatment had no measurable effect. While checking the dataset, she also found a *null* value from a disconnected sensor. She marked that value as missing instead of treating it as zero.

After the data was cleaned, the evidence no longer supported the *null* hypothesis. The difference between the two groups was large enough for the team to reject the *null* and investigate why the treatment worked.

In her report, Elif explained the distinction carefully. In a database, *null* can mean that a value is absent or unknown; in statistics, the *null* describes a starting claim of no effect. The same word appeared in two scientific settings, but its precise meaning depended on the context.
$story$),
  'The story contrasts null as a missing database value with the statistical null hypothesis.'
)
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
