-- WKU+ database. Run this whole file once in the Supabase SQL editor.
-- Then make yourself the first admin:
--   update public.profiles set role = 'admin' where phone = '+2519XXXXXXXX';

create extension if not exists pgcrypto;

-- ---------- tables ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text not null default '',
  username text not null default '',
  full_name text not null default '',
  student_id text not null default '',
  department text not null default '',
  role text not null default 'student' check (role in ('student','merchant','runner','admin')),
  created_at timestamptz not null default now()
);

create table public.vendors (
  place_id text primary key,
  active boolean not null default true,
  description text not null default ''
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  place_id text not null,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  available boolean not null default true
);
create index on public.menu_items (place_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  user_name text not null default '',
  user_phone text not null default '',
  place_id text not null,
  place_name text not null,
  lines jsonb not null,
  subtotal numeric(10,2) not null,
  fee numeric(10,2) not null default 15,
  total numeric(10,2) not null,
  drop_place_id text not null,
  drop_name text not null,
  note text not null default '',
  status text not null default 'placed' check (status in ('placed','accepted','picked_up','delivered','cancelled')),
  runner_id uuid references public.profiles(id),
  runner_name text,
  runner_lat double precision,
  runner_lng double precision,
  created_at timestamptz not null default now()
);
create index on public.orders (user_id);
create index on public.orders (runner_id);
create index on public.orders (status);

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  owner_name text not null default '',
  name text not null,
  description text not null default '',
  unique (owner_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('new','used')),
  shop_id uuid references public.shops(id) on delete cascade,
  shop_name text,
  seller_id uuid not null references public.profiles(id),
  seller_name text not null default '',
  seller_phone text not null default '',
  title text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  condition text not null default '',
  image_url text,
  moderation_status text not null default 'approved' check (moderation_status in ('pending','approved','rejected')),
  moderation_note text not null default '',
  created_at timestamptz not null default now()
);
create index on public.products (kind, created_at desc);

create table public.merchant_stories (
  id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.profiles(id) on delete cascade,
  text text not null, created_at timestamptz not null default now(), expires_at timestamptz not null default (now() + interval '24 hours')
);
alter table public.merchant_stories enable row level security;
create policy stories_read on public.merchant_stories for select using (expires_at > now());
create policy stories_insert on public.merchant_stories for insert with check (merchant_id = auth.uid() and public.my_role() = 'merchant');

create table public.merchant_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  user_name text not null default '',
  user_phone text not null default '',
  shop_name text not null,
  description text not null default '',
  payment_provider text,
  payment_reference text,
  payment_status text not null default 'not_submitted' check (payment_status in ('not_submitted','verified','manual_review','rejected')),
  payment_request_id text,
  payment_checked_at timestamptz,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

-- Existing databases: add these columns with the same definitions before using payment verification.

create table public.tv_queue (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  room text,
  heartbeat timestamptz not null default now()
);

create table public.tv_live (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  host_name text not null default '',
  title text not null,
  room_name text not null,
  started_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  reason text not null,
  room text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- helpers ----------
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- new auth user -> profile
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, case when coalesce(new.phone,'') = '' then '' else '+' || new.phone end)
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- only an admin may change a role
create or replace function public.protect_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and coalesce(public.my_role(),'') <> 'admin' then
    raise exception 'Only an admin can change roles';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_role();

-- used items: one per user per 7 days, enforced here so it can't be bypassed
create or replace function public.enforce_product_rules() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'new' then
    if coalesce(public.my_role(),'') <> 'merchant' then
      raise exception 'Only approved merchants can sell new products';
    end if;
    if new.shop_id is null then raise exception 'A shop is required'; end if;
  else
    if exists (select 1 from public.products
               where seller_id = new.seller_id and kind = 'used'
                 and created_at > now() - interval '7 days') then
      raise exception 'WEEKLY_LIMIT: you can post one used item per week';
    end if;
  end if;
  return new;
end $$;
create trigger products_rules before insert on public.products
  for each row execute function public.enforce_product_rules();

-- atomic order acceptance (two runners can't take the same order)
create or replace function public.accept_order(order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare n text;
begin
  if coalesce(public.my_role(),'') not in ('runner','admin') then raise exception 'Runners only'; end if;
  select coalesce(nullif(full_name,''), phone) into n from public.profiles where id = auth.uid();
  update public.orders set status = 'accepted', runner_id = auth.uid(), runner_name = n
   where id = order_id and status = 'placed' and runner_id is null;
  if not found then raise exception 'Order already taken'; end if;
end $$;

-- random video pairing: call every ~2 s until it returns a room name
create or replace function public.tv_match() returns text
language plpgsql security definer set search_path = public as $$
declare r text; other uuid;
begin
  select room into r from public.tv_queue where user_id = auth.uid();
  if r is not null then
    delete from public.tv_queue where user_id = auth.uid();
    return r;
  end if;
  delete from public.tv_queue where room is null and heartbeat < now() - interval '15 seconds';
  select user_id into other from public.tv_queue
   where room is null and user_id <> auth.uid()
   order by heartbeat limit 1 for update skip locked;
  if other is not null then
    r := 'tv-' || gen_random_uuid()::text;
    update public.tv_queue set room = r where user_id = other;
    delete from public.tv_queue where user_id = auth.uid();
    return r;
  end if;
  insert into public.tv_queue (user_id, heartbeat) values (auth.uid(), now())
  on conflict (user_id) do update set heartbeat = now();
  return null;
end $$;

create or replace function public.tv_leave() returns void
language sql security definer set search_path = public as $$
  delete from public.tv_queue where user_id = auth.uid();
$$;

-- ---------- row level security ----------
alter table public.profiles enable row level security;

-- Run this migration on an existing database as well:
-- alter table public.profiles add column if not exists department text not null default '';
-- alter table public.profiles add column if not exists username text not null default '';
alter table public.vendors enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.merchant_applications enable row level security;
alter table public.tv_queue enable row level security;
alter table public.tv_live enable row level security;
alter table public.reports enable row level security;

create policy profiles_read on public.profiles for select using (id = auth.uid() or public.my_role() = 'admin');
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_update_admin on public.profiles for update using (public.my_role() = 'admin');

create policy vendors_read on public.vendors for select using (true);
create policy vendors_admin on public.vendors for all using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
create policy menu_read on public.menu_items for select using (true);
create policy menu_admin on public.menu_items for all using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

create policy orders_read on public.orders for select using (
  user_id = auth.uid() or runner_id = auth.uid() or public.my_role() = 'admin'
  or (status = 'placed' and public.my_role() = 'runner')
);
create policy orders_insert on public.orders for insert with check (user_id = auth.uid() and status = 'placed' and runner_id is null);
create policy orders_cancel_own on public.orders for update using (user_id = auth.uid() and status = 'placed')
  with check (user_id = auth.uid() and status in ('placed','cancelled'));
create policy orders_runner on public.orders for update using (runner_id = auth.uid()) with check (runner_id = auth.uid());
create policy orders_admin on public.orders for update using (public.my_role() = 'admin');

create policy shops_read on public.shops for select using (true);
create policy shops_insert on public.shops for insert with check (owner_id = auth.uid() and public.my_role() = 'merchant');
create policy shops_update on public.shops for update using (owner_id = auth.uid());

create policy products_read on public.products for select using (true);
create policy products_insert on public.products for insert with check (seller_id = auth.uid());
create policy products_delete on public.products for delete using (seller_id = auth.uid() or public.my_role() = 'admin');

create policy apps_read on public.merchant_applications for select using (user_id = auth.uid() or public.my_role() = 'admin');
create policy apps_insert on public.merchant_applications for insert with check (user_id = auth.uid() and status = 'pending');
create policy apps_admin on public.merchant_applications for update using (public.my_role() = 'admin');

create policy live_read on public.tv_live for select using (true);
create policy live_insert on public.tv_live for insert with check (host_id = auth.uid());
create policy live_delete on public.tv_live for delete using (host_id = auth.uid() or public.my_role() = 'admin');

create policy reports_insert on public.reports for insert with check (reporter_id = auth.uid());
create policy reports_admin on public.reports for select using (public.my_role() = 'admin');

-- ---------- seed: delivery vendors (food places) ----------
insert into public.vendors (place_id, active, description) values
  ('males-dorm-shops', true, 'Dorm shops'),
  ('amon-yadot-lounge', true, 'Lounge'),
  ('memhran-lounge', true, 'Lounge'),
  ('freshman-cafteria', true, 'Freshman cafeteria'),
  ('senior-cafteria', true, 'Senior cafeteria'),
  ('soresa-agape-lounge', true, 'Lounge'),
  ('astedaer-lounge', true, 'Lounge')
on conflict do nothing;
