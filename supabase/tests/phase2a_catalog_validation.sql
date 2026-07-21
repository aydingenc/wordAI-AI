begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(8);

select extensions.is(
  (select count(*)::bigint from public.words),
  8000::bigint,
  'catalog contains exactly 8,000 words'
);
select extensions.is(
  (select count(distinct category)::integer from public.words),
  16,
  'catalog contains exactly 16 categories'
);
select extensions.is(
  (select count(*)::integer
   from (select category from public.words group by category having count(*) <> 500) bad),
  0,
  'every category contains exactly 500 words'
);
select extensions.is(
  (select count(*)::bigint from public.words where category = 'Science'),
  500::bigint,
  'Science category contains 500 words'
);
select extensions.is(
  (select word from public.words where id = 'science-null'),
  'null',
  'science-null metadata is restored'
);
select extensions.ok(
  (select story_en not ilike '%*nan*%'
   from private.word_learning_content where word_id = 'science-null'),
  'science-null story contains no corrupt nan target'
);
select extensions.ok(
  (select story_en like '%*null*%'
   from private.word_learning_content where word_id = 'science-null'),
  'science-null story emphasizes the correct target word'
);
select extensions.is(
  (select count(*)::bigint
   from private.story_translations
   where status = 'completed' and attempt_count = 0),
  0::bigint,
  'no legacy story translation was imported as a completed cache row'
);

select * from extensions.finish();
rollback;
