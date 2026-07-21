begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(21);

insert into auth.users (id, aud, role, email, created_at, updated_at)
select
  ('21000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'authenticated', 'authenticated', format('phase2a-persona-%s@example.invalid', n), now(), now()
from generate_series(1, 8) n
on conflict (id) do nothing;

insert into public.words (id, word, category)
select format('phase2a-persona-%s', n), format('persona%s', n), 'Phase2APersona'
from generate_series(1, 6) n
on conflict (id) do update set word = excluded.word, category = excluded.category;

insert into private.word_learning_content (word_id, story_en, story_source_hash)
select
  format('phase2a-persona-%s', n),
  format('A sufficiently long *persona%s* story for premium transition verification.', n),
  private.story_source_hash(format('A sufficiently long *persona%s* story for premium transition verification.', n))
from generate_series(1, 6) n
on conflict (word_id) do update set story_en = excluded.story_en, story_source_hash = excluded.story_source_hash;

insert into public.user_words (user_id, word_id, status)
select
  ('21000000-0000-4000-8000-' || lpad(u::text, 12, '0'))::uuid,
  format('phase2a-persona-%s', w),
  'active'
from generate_series(1, 8) u cross join generate_series(1, 6) w
on conflict (user_id, word_id) do update set status = 'active';

insert into public.entitlements (user_id, is_premium, premium_until, source)
select
  ('21000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  false, null, 'phase2a_persona_test'
from generate_series(1, 8) n
on conflict (user_id) do update
set is_premium = false, premium_until = null, source = excluded.source;

delete from private.daily_word_access_grants where user_id::text like '21000000-0000-4000-8000-%';
delete from private.daily_access_buckets where user_id::text like '21000000-0000-4000-8000-%';

-- 1: fresh free user: three complete words, then Basic + Present preview.
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000001', true);
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-1', 'word_lab_full')), 'full', 'fresh free word 1 is full');
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-2', 'word_lab_full')), 'full', 'fresh free word 2 is full');
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-3', 'word_lab_full')), 'full', 'fresh free word 3 is full');
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-4', 'word_lab_full')), 'preview', 'fresh free word 4 is preview');
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-1', 'word_story')), 'allowed', 'free story 1 is allowed');
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-2', 'word_story')), 'paywall', 'free story 2 requires premium');

-- 2: active premium never consumes daily buckets.
update public.entitlements set is_premium = true, premium_until = clock_timestamp() + interval '30 days' where user_id = '21000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000002', true);
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-6', 'word_lab_full')), 'full', 'active premium has full lab access');
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-6', 'word_story')), 'allowed', 'active premium has story access');
select extensions.is((select count(*)::integer from private.daily_access_buckets where user_id = auth.uid()), 0, 'premium access consumes no free quota');

-- 3: an expired subscription behaves as free.
update public.entitlements set is_premium = true, premium_until = clock_timestamp() - interval '1 second' where user_id = '21000000-0000-4000-8000-000000000003';
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000003', true);
select public.claim_word_feature_access(format('phase2a-persona-%s', n), 'word_lab_full') from generate_series(1, 3) n;
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-4', 'word_lab_full')), 'preview', 'expired premium is treated as free');

-- 4: free to premium upgrades immediately on the same day.
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000004', true);
select public.claim_word_feature_access(format('phase2a-persona-%s', n), 'word_lab_full') from generate_series(1, 3) n;
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-4', 'word_lab_full')), 'preview', 'free user reaches preview before upgrade');
update public.entitlements set is_premium = true, premium_until = clock_timestamp() + interval '30 days' where user_id = auth.uid();
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-4', 'word_lab_full')), 'full', 'same-day upgrade unlocks immediately');

-- 5: premium expiry starts a fresh free allowance.
update public.entitlements set is_premium = true, premium_until = clock_timestamp() + interval '1 day' where user_id = '21000000-0000-4000-8000-000000000005';
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000005', true);
select public.claim_word_feature_access('phase2a-persona-6', 'word_lab_full');
update public.entitlements set premium_until = clock_timestamp() - interval '1 second' where user_id = auth.uid();
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-1', 'word_lab_full')), 'full', 'expired premium receives first free word');

-- 6: quota used before upgrade remains used if premium later expires that day.
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000006', true);
select public.claim_word_feature_access(format('phase2a-persona-%s', n), 'word_lab_full') from generate_series(1, 3) n;
update public.entitlements set is_premium = true, premium_until = clock_timestamp() + interval '1 day' where user_id = auth.uid();
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-4', 'word_lab_full')), 'full', 'upgrade unlocks word after used free quota');
update public.entitlements set premium_until = clock_timestamp() - interval '1 second' where user_id = auth.uid();
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-5', 'word_lab_full')), 'preview', 'previous free quota remains after premium expires');

-- 7: renewal disabled but paid-through date active remains premium.
update public.entitlements set is_premium = true, premium_until = clock_timestamp() + interval '5 days', source = 'renewal_off' where user_id = '21000000-0000-4000-8000-000000000007';
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000007', true);
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-6', 'word_lab_full')), 'full', 'renewal-off paid-through user remains premium');

-- 8: renewal after expiry restores premium immediately.
update public.entitlements set is_premium = true, premium_until = clock_timestamp() - interval '1 day' where user_id = '21000000-0000-4000-8000-000000000008';
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000008', true);
select public.claim_word_feature_access(format('phase2a-persona-%s', n), 'word_lab_full') from generate_series(1, 3) n;
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-4', 'word_lab_full')), 'preview', 'expired user is preview before renewal');
update public.entitlements set premium_until = clock_timestamp() + interval '30 days' where user_id = auth.uid();
select extensions.is((select decision from public.claim_word_feature_access('phase2a-persona-4', 'word_lab_full')), 'full', 'renewal restores full access');

update public.user_words set status = 'removed' where user_id = auth.uid() and word_id = 'phase2a-persona-6';
select extensions.throws_ok(
  $$select * from public.claim_word_feature_access('phase2a-persona-6', 'word_lab_full')$$,
  'P0001', 'WORD_NOT_IN_LIBRARY', 'removed word membership is rejected'
);
select extensions.ok(not has_table_privilege('authenticated', 'public.entitlements', 'insert'), 'client cannot insert entitlements');
select extensions.ok(not has_table_privilege('authenticated', 'public.entitlements', 'update'), 'client cannot update entitlements');

select * from extensions.finish();
rollback;
