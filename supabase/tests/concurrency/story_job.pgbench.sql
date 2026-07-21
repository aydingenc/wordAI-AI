select *
from public.claim_story_translation_job_service(
  'phase2a-concurrency-1',
  (select story_source_hash
   from private.word_learning_content
   where word_id = 'phase2a-concurrency-1')
);
