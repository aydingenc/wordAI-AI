begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(23);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  '20000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'phase2a-access-test@example.invalid',
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.entitlements (user_id, is_premium, premium_until, source)
values ('20000000-0000-4000-8000-000000000001', false, null, 'phase2a_test')
on conflict (user_id) do update
set is_premium = excluded.is_premium,
    premium_until = excluded.premium_until,
    source = excluded.source;

insert into public.words (id, word, category)
select format('phase2a-test-%s', n), format('test%s', n), 'Phase2ATest'
from generate_series(1, 5) as n
on conflict (id) do update set word = excluded.word, category = excluded.category;

insert into private.word_learning_content (
  word_id, ex_basic_en, ex_mid_en, ex_adv_en, sp_present_en,
  pres_cont_en, past_en, future_en, pres_perf_en, story_en, story_source_hash
)
select
  format('phase2a-test-%s', n),
  'basic', 'mid', 'advanced', 'present',
  'continuous', 'past', 'future', 'perfect',
  format('A sufficiently long *test%s* story used only inside the rolled-back Phase 2A database test.', n),
  private.story_source_hash(
    format('A sufficiently long *test%s* story used only inside the rolled-back Phase 2A database test.', n)
  )
from generate_series(1, 5) as n
on conflict (word_id) do update
set story_en = excluded.story_en,
    story_source_hash = excluded.story_source_hash;

insert into public.user_words (user_id, word_id)
select '20000000-0000-4000-8000-000000000001', format('phase2a-test-%s', n)
from generate_series(1, 5) as n
on conflict (user_id, word_id) do update set status = 'active';

delete from private.daily_word_access_grants
where user_id = '20000000-0000-4000-8000-000000000001';
delete from private.daily_access_buckets
where user_id = '20000000-0000-4000-8000-000000000001';
delete from private.story_translations where word_id like 'phase2a-test-%';

select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.is(
  (select decision from public.claim_word_feature_access('phase2a-test-1', 'word_lab_full')),
  'full',
  'first unique lab word receives full access'
);
select extensions.is(
  (select used_count from private.daily_access_buckets
   where user_id = auth.uid() and feature = 'word_lab_full'),
  1,
  'first lab word consumes one slot'
);
select extensions.is(
  (select decision from public.claim_word_feature_access('phase2a-test-1', 'word_lab_full')),
  'full',
  'opening the same word again remains full'
);
select extensions.is(
  (select used_count from private.daily_access_buckets
   where user_id = auth.uid() and feature = 'word_lab_full'),
  1,
  'opening the same word does not increment usage'
);
select extensions.is(
  (select decision from public.claim_word_feature_access('phase2a-test-2', 'word_lab_full')),
  'full',
  'second unique lab word receives full access'
);
select extensions.is(
  (select decision from public.claim_word_feature_access('phase2a-test-3', 'word_lab_full')),
  'full',
  'third unique lab word receives full access'
);
select extensions.is(
  (select decision from public.claim_word_feature_access('phase2a-test-4', 'word_lab_full')),
  'preview',
  'fourth unique lab word receives preview access'
);
select extensions.is(
  (select used_count from private.daily_access_buckets
   where user_id = auth.uid() and feature = 'word_lab_full'),
  3,
  'preview does not increment the full-access quota'
);

update public.entitlements
set is_premium = true, premium_until = clock_timestamp() - interval '1 minute'
where user_id = auth.uid();
select extensions.is(
  (select decision from public.claim_word_feature_access('phase2a-test-5', 'word_lab_full')),
  'preview',
  'expired premium is not accepted'
);

update public.entitlements
set is_premium = true, premium_until = clock_timestamp() + interval '1 day'
where user_id = auth.uid();
select extensions.is(
  (select decision from public.claim_word_feature_access('phase2a-test-5', 'word_lab_full')),
  'full',
  'active premium receives full access after the free limit'
);
select extensions.is(
  (select used_count from private.daily_access_buckets
   where user_id = auth.uid() and feature = 'word_lab_full'),
  3,
  'premium access does not consume a daily slot'
);

update public.entitlements
set is_premium = false, premium_until = null
where user_id = auth.uid();

select extensions.is(
  (select decision from public.claim_word_feature_access('phase2a-test-1', 'word_story')),
  'allowed',
  'first unique free story is allowed'
);
select extensions.is(
  (select decision from public.claim_word_feature_access('phase2a-test-1', 'word_story')),
  'allowed',
  'same story on the same day remains allowed'
);
select extensions.is(
  (select used_count from private.daily_access_buckets
   where user_id = auth.uid() and feature = 'word_story'),
  1,
  'same story does not consume a second story slot'
);
select extensions.is(
  (select decision from public.claim_word_feature_access('phase2a-test-2', 'word_story')),
  'paywall',
  'second unique free story requires paywall'
);

select extensions.is(
  (select count(*)::integer from private.story_translations where word_id = 'phase2a-test-1'),
  0,
  'translation cache starts empty for the test story'
);

create temporary table phase2a_first_job_claim on commit drop as
select *
from public.claim_story_translation_job_service(
  'phase2a-test-1',
  (select story_source_hash from private.word_learning_content where word_id = 'phase2a-test-1')
);

select extensions.is(
  (select claim_status from phase2a_first_job_claim),
  'claimed',
  'first translation request owns the job lease'
);
select extensions.is(
  (select claim_status
   from public.claim_story_translation_job_service(
     'phase2a-test-1',
     (select story_source_hash from private.word_learning_content where word_id = 'phase2a-test-1')
   )),
  'processing',
  'second translation request does not own another job'
);
select extensions.is(
  (select count(*)::integer from private.story_translations where word_id = 'phase2a-test-1'),
  1,
  'only one cache/job row exists for word, language, and source hash'
);
select extensions.is(
  (select attempt_count from private.story_translations where word_id = 'phase2a-test-1'),
  1,
  'concurrent-looking duplicate claim does not increment attempts'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'private.word_learning_content', 'select'),
  'authenticated role has no direct SELECT privilege on protected content'
);
select extensions.is(
  (select count(*)::integer
   from information_schema.columns
   where table_schema = 'public'
     and table_name = 'words'
     and column_name in ('ex_mid_en', 'ex_adv_en', 'past_en', 'story_en', 'story_tr')),
  0,
  'public.words contains no protected text columns'
);

select extensions.throws_ok(
  $$select * from public.claim_word_feature_access('not-in-user-library', 'word_lab_full')$$,
  'P0001',
  'WORD_NOT_IN_LIBRARY',
  'membership is enforced before protected access'
);

select * from extensions.finish();
rollback;
