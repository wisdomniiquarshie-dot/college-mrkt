begin;

create table if not exists public.plan_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_key text not null,
  plan_name text not null,
  price_ghs numeric(10, 2) not null check (price_ghs >= 0),
  billing_period text not null,
  listing_limit integer not null check (listing_limit > 0),
  promotion_duration_days integer not null default 0 check (promotion_duration_days >= 0),
  benefits text[] not null default '{}',
  ai_generation_limit integer not null default 0 check (ai_generation_limit >= 0),
  promotion_available boolean not null default false,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'expired', 'cancelled')),
  change_reason text,
  payment_request_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > starts_at)
);

create index if not exists plan_subscriptions_user_idx
  on public.plan_subscriptions (user_id, status, expires_at desc);

alter table public.plan_subscriptions enable row level security;

drop policy if exists "Users and admins read plan subscriptions" on public.plan_subscriptions;
create policy "Users and admins read plan subscriptions" on public.plan_subscriptions
  for select to authenticated using (
    auth.uid() = user_id or exists (
      select 1 from public.seller_profiles sp
      where sp.id = auth.uid() and sp.role in ('admin', 'moderator')
    )
  );

drop policy if exists "Admins create plan subscriptions" on public.plan_subscriptions;
create policy "Admins create plan subscriptions" on public.plan_subscriptions
  for insert to authenticated with check (
    exists (
      select 1 from public.seller_profiles sp
      where sp.id = auth.uid() and sp.role in ('admin', 'moderator')
    )
  );

drop policy if exists "Admins update plan subscriptions" on public.plan_subscriptions;
create policy "Admins update plan subscriptions" on public.plan_subscriptions
  for update to authenticated using (
    exists (
      select 1 from public.seller_profiles sp
      where sp.id = auth.uid() and sp.role in ('admin', 'moderator')
    )
  ) with check (
    exists (
      select 1 from public.seller_profiles sp
      where sp.id = auth.uid() and sp.role in ('admin', 'moderator')
    )
  );

revoke all on table public.plan_subscriptions from public, anon, authenticated;
grant select, insert, update on table public.plan_subscriptions to authenticated;

notify pgrst, 'reload schema';

commit;
