create table if not exists public.delivery_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null default '',
  user_phone text not null default '',
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
alter table public.delivery_applications enable row level security;
drop policy if exists "students apply for delivery" on public.delivery_applications;
create policy "students apply for delivery" on public.delivery_applications for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "users and admins read delivery applications" on public.delivery_applications;
create policy "users and admins read delivery applications" on public.delivery_applications for select to authenticated using (auth.uid() = user_id or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
drop policy if exists "admins update delivery applications" on public.delivery_applications;
create policy "admins update delivery applications" on public.delivery_applications for update to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')) with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create unique index if not exists one_pending_delivery_application on public.delivery_applications(user_id) where status = 'pending';
notify pgrst, 'reload schema';
