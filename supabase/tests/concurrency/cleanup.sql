\set ON_ERROR_STOP on
delete from auth.users where id = '20000000-0000-4000-8000-000000000002';
delete from public.words where id like 'phase2a-concurrency-%';
