alter table public.products
  add column if not exists moderation_status text not null default 'approved',
  add column if not exists moderation_note text not null default '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_moderation_status_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_moderation_status_check
      check (moderation_status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

notify pgrst, 'reload schema';
