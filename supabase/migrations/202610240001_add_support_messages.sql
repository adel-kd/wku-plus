create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null default '',
  user_phone text not null default '',
  message text not null check (char_length(message) between 1 and 2000),
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.support_messages enable row level security;

drop policy if exists "users create support messages" on public.support_messages;
create policy "users create support messages" on public.support_messages
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users read own support messages" on public.support_messages;
create policy "users read own support messages" on public.support_messages
for select to authenticated using (
  auth.uid() = user_id or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

drop policy if exists "admins update support messages" on public.support_messages;
create policy "admins update support messages" on public.support_messages
for update to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
) with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create index if not exists support_messages_created_at_idx
on public.support_messages (created_at desc);
