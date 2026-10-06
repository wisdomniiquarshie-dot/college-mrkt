create table if not exists public.seller_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Campus seller',
  campus_area text,
  whatsapp_number text not null default ''
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  category text not null check (category in ('Electronics', 'Fashion', 'Hostel Gear', 'Textbooks', 'Services')),
  price numeric(10, 2) not null check (price > 0),
  condition text not null check (condition in ('New', 'Like New', 'Fair', 'Refurbished')),
  description text not null check (char_length(description) between 1 and 1200),
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_seller_id_idx on public.listings (seller_id);

create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table public.seller_profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_reports enable row level security;

drop policy if exists "Profiles are visible to campus" on public.seller_profiles;
create policy "Profiles are visible to campus" on public.seller_profiles
  for select using (true);
drop policy if exists "Sellers manage their own profile" on public.seller_profiles;
create policy "Sellers manage their own profile" on public.seller_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Listings are visible to campus" on public.listings;
create policy "Listings are visible to campus" on public.listings
  for select using (true);
drop policy if exists "Authenticated students create their own listings" on public.listings;
create policy "Authenticated students create their own listings" on public.listings
  for insert to authenticated with check (auth.uid() = seller_id);
drop policy if exists "Sellers update their own listings" on public.listings;
create policy "Sellers update their own listings" on public.listings
  for update to authenticated using (auth.uid() = seller_id) with check (auth.uid() = seller_id);
drop policy if exists "Sellers delete their own listings" on public.listings;
create policy "Sellers delete their own listings" on public.listings
  for delete to authenticated using (auth.uid() = seller_id);

drop policy if exists "Authenticated students submit reports" on public.listing_reports;
create policy "Authenticated students submit reports" on public.listing_reports
  for insert to authenticated with check (auth.uid() = reporter_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public;

drop policy if exists "Listing photos are public" on storage.objects;
create policy "Listing photos are public" on storage.objects
  for select using (bucket_id = 'listing-images');
drop policy if exists "Sellers upload their own listing photos" on storage.objects;
create policy "Sellers upload their own listing photos" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "Sellers remove their own listing photos" on storage.objects;
create policy "Sellers remove their own listing photos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.create_seller_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.seller_profiles (id, full_name, campus_area, whatsapp_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Campus seller'),
    new.raw_user_meta_data ->> 'campus_area',
    coalesce(new.raw_user_meta_data ->> 'whatsapp_number', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.create_seller_profile();
