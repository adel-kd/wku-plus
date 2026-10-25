create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shops add column if not exists image_url text;
alter table public.tips enable row level security;
alter table public.push_tokens enable row level security;

drop policy if exists tips_read on public.tips;
create policy tips_read on public.tips for select using (true);
drop policy if exists tips_admin on public.tips;
create policy tips_admin on public.tips for all using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
drop policy if exists push_tokens_own on public.push_tokens;
create policy push_tokens_own on public.push_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gebeya-images', 'gebeya-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true;

drop policy if exists gebeya_images_read on storage.objects;
create policy gebeya_images_read on storage.objects for select using (bucket_id = 'gebeya-images');
drop policy if exists gebeya_images_insert on storage.objects;
create policy gebeya_images_insert on storage.objects for insert to authenticated
with check (bucket_id = 'gebeya-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists gebeya_images_update on storage.objects;
create policy gebeya_images_update on storage.objects for update to authenticated
using (bucket_id = 'gebeya-images' and (storage.foldername(name))[1] = auth.uid()::text);

insert into public.tips (title, description, link)
select * from (values
  ('Ethiopian Government Scholarship', 'Merit-based scholarships for top-performing students. Apply through the university registrar.', null),
  ('Mastercard Foundation Scholars', 'Full scholarships for academically talented students from disadvantaged backgrounds.', 'https://mastercardfdn.org/all/scholars/'),
  ('WKU Career Office', 'Visit the Career Development Center in the Admin block to see local internship postings.', null),
  ('WKU Digital Library', 'Access IEEE, Springer and other databases free from the campus network.', null)
) as seed(title, description, link)
where not exists (select 1 from public.tips);
