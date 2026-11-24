begin;

create table if not exists public.seller_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Campus seller',
  campus_area text,
  whatsapp_number text not null default '',
  account_type text not null default 'student_seller',
  is_contact_public boolean not null default false,
  role text not null default 'student'
);

alter table public.seller_profiles
  add column if not exists full_name text not null default 'Campus seller',
  add column if not exists campus_area text,
  add column if not exists whatsapp_number text not null default '',
  add column if not exists account_type text not null default 'student_seller',
  add column if not exists is_contact_public boolean not null default false,
  add column if not exists role text not null default 'student';

update public.seller_profiles
set full_name = coalesce(nullif(full_name, ''), 'Campus seller'),
    whatsapp_number = coalesce(whatsapp_number, ''),
    is_contact_public = coalesce(is_contact_public, false);

update public.seller_profiles
set account_type = 'student_seller'
where account_type is null or account_type not in (
  'student_seller',
  'student_business',
  'campus_business',
  'accommodation_advertiser',
  'regular_advertiser'
);

update public.seller_profiles
set role = 'student'
where role is null or role not in ('student', 'admin', 'moderator');

alter table public.seller_profiles
  alter column full_name set default 'Campus seller',
  alter column full_name set not null,
  alter column whatsapp_number set default '',
  alter column whatsapp_number set not null,
  alter column account_type set default 'student_seller',
  alter column account_type set not null,
  alter column is_contact_public set default false,
  alter column is_contact_public set not null,
  alter column role set default 'student',
  alter column role set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.seller_profiles'::regclass
      and conname = 'seller_profiles_account_type_check'
  ) then
    alter table public.seller_profiles
      add constraint seller_profiles_account_type_check
      check (account_type in (
        'student_seller',
        'student_business',
        'campus_business',
        'accommodation_advertiser',
        'regular_advertiser'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.seller_profiles'::regclass
      and conname = 'seller_profiles_role_check'
  ) then
    alter table public.seller_profiles
      add constraint seller_profiles_role_check
      check (role in ('student', 'admin', 'moderator'));
  end if;
end;
$$;

alter table public.seller_profiles enable row level security;

drop policy if exists "Profiles are visible to campus" on public.seller_profiles;
drop policy if exists "Sellers read their own profile" on public.seller_profiles;
create policy "Sellers read their own profile" on public.seller_profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "Sellers manage their own profile" on public.seller_profiles;
create policy "Sellers manage their own profile" on public.seller_profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

revoke all on table public.seller_profiles from public, anon, authenticated;
grant select on table public.seller_profiles to authenticated;
grant update (full_name, campus_area, whatsapp_number, is_contact_public, account_type)
  on public.seller_profiles to authenticated;

create or replace function public.create_seller_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.seller_profiles (
    id,
    full_name,
    campus_area,
    whatsapp_number,
    account_type,
    is_contact_public,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Campus seller'),
    new.raw_user_meta_data ->> 'campus_area',
    coalesce(new.raw_user_meta_data ->> 'whatsapp_number', ''),
    case
      when new.raw_user_meta_data ->> 'account_type' in (
        'student_seller',
        'student_business',
        'campus_business',
        'accommodation_advertiser',
        'regular_advertiser'
      ) then new.raw_user_meta_data ->> 'account_type'
      else 'student_seller'
    end,
    coalesce(new.raw_user_meta_data ->> 'is_contact_public', 'false') = 'true',
    'student'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.create_seller_profile();

insert into public.seller_profiles (
  id,
  full_name,
  campus_area,
  whatsapp_number,
  account_type,
  is_contact_public,
  role
)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'full_name', 'Campus seller'),
  users.raw_user_meta_data ->> 'campus_area',
  coalesce(users.raw_user_meta_data ->> 'whatsapp_number', ''),
  case
    when users.raw_user_meta_data ->> 'account_type' in (
      'student_seller',
      'student_business',
      'campus_business',
      'accommodation_advertiser',
      'regular_advertiser'
    ) then users.raw_user_meta_data ->> 'account_type'
    else 'student_seller'
  end,
  coalesce(users.raw_user_meta_data ->> 'is_contact_public', 'false') = 'true',
  'student'
from auth.users as users
on conflict (id) do nothing;

notify pgrst, 'reload schema';

commit;
