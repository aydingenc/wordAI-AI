select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
select *
from public.claim_word_feature_access(
  format('phase2a-concurrency-%s', (:client_id % 4) + 1),
  'word_lab_full'
);
