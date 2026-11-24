alter table public.seller_profiles
  add column if not exists is_contact_public boolean not null default false;

notify pgrst, 'reload schema';
