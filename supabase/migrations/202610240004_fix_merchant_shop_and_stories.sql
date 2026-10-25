create table if not exists public.merchant_stories (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.profiles(id) on delete cascade,
  text text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);
alter table public.merchant_stories enable row level security;

create policy shops_insert_admin on public.shops for insert
with check (public.my_role() = 'admin');

create policy stories_read on public.merchant_stories for select using (expires_at > now());
create policy stories_insert on public.merchant_stories for insert
with check (merchant_id = auth.uid() and public.my_role() in ('merchant', 'admin'));

create or replace function public.enforce_product_rules() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'new' then
    if coalesce(public.my_role(),'') not in ('merchant', 'admin') then
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

insert into public.shops (owner_id, owner_name, name, description)
select distinct on (a.user_id) a.user_id, a.user_name, a.shop_name, a.description
from public.merchant_applications a
where a.status = 'approved'
  and not exists (select 1 from public.shops s where s.owner_id = a.user_id)
order by a.user_id, a.created_at desc;
