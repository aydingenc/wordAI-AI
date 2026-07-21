\set ON_ERROR_STOP on

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  '20000000-0000-4000-8000-000000000002',
  'authenticated', 'authenticated', 'phase2a-concurrency@example.invalid', now(), now()
)
on conflict (id) do nothing;

insert into public.entitlements (user_id, is_premium, premium_until, source)
values ('20000000-0000-4000-8000-000000000002', false, null, 'phase2a_test')
on conflict (user_id) do update
set is_premium = false, premium_until = null, source = excluded.source;

insert into public.words (id, word, category)
select format('phase2a-concurrency-%s', n), format('concurrency%s', n), 'Phase2ATest'
from generate_series(1, 4) n
on conflict (id) do update set word = excluded.word, category = excluded.category;

insert into private.word_learning_content (word_id, story_en, story_source_hash)
select
  format('phase2a-concurrency-%s', n),
  format('A long enough *concurrency%s* story used for the atomic job ownership test.', n),
  private.story_source_hash(
    format('A long enough *concurrency%s* story used for the atomic job ownership test.', n)
  )
from generate_series(1, 4) n
on conflict (word_id) do update
set story_en = excluded.story_en, story_source_hash = excluded.story_source_hash;

insert into public.user_words (user_id, word_id, status)
select '20000000-0000-4000-8000-000000000002', format('phase2a-concurrency-%s', n), 'active'
from generate_series(1, 4) n
on conflict (user_id, word_id) do update set status = 'active';

delete from private.daily_word_access_grants
where user_id = '20000000-0000-4000-8000-000000000002';
delete from private.daily_access_buckets
where user_id = '20000000-0000-4000-8000-000000000002';
delete from private.story_translations
where word_id like 'phase2a-concurrency-%';
