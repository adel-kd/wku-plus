alter table public.profiles
  add column if not exists username text not null default '',
  add column if not exists full_name text not null default '',
  add column if not exists student_id text not null default '',
  add column if not exists department text not null default '';

notify pgrst, 'reload schema';
