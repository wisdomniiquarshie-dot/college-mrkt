create table if not exists public.seller_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Campus seller',
  campus_area text,
  whatsapp_number text not null default '',
  account_type text not null default 'student_seller'
    check (account_type in ('student_seller', 'student_business', 'campus_business', 'accommodation_advertiser', 'regular_advertiser')),
  is_contact_public boolean not null default false
);

alter table public.seller_profiles
  add column if not exists account_type text not null default 'student_seller'
  check (account_type in ('student_seller', 'student_business', 'campus_business', 'accommodation_advertiser', 'regular_advertiser'));

alter table public.seller_profiles
  add column if not exists is_contact_public boolean not null default false;

alter table public.seller_profiles
  add column if not exists role text not null default 'student'
  check (role in ('student', 'admin', 'moderator'));

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  category text not null check (category in ('Electronics', 'Fashion', 'Hostel Gear', 'Textbooks', 'Food and Drinks', 'Beauty and Personal Care', 'Accessories', 'Furniture', 'Services', 'Accommodation', 'Other')),
  price numeric(10, 2) not null check (price > 0),
  condition text not null check (condition in ('New', 'Like New', 'Fair', 'Refurbished')),
  description text not null check (char_length(description) between 1 and 1200),
  image_urls text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'sold', 'hidden')),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings
  add column if not exists accommodation_type text,
  add column if not exists town text,
  add column if not exists property_address text,
  add column if not exists advance_payment_months integer,
  add column if not exists available_rooms integer,
  add column if not exists amenities text[] not null default '{}',
  add column if not exists accommodation_status text not null default 'available',
  add column if not exists accommodation_contact_phone text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'listings_accommodation_type_check') then
    alter table public.listings add constraint listings_accommodation_type_check
      check (accommodation_type is null or accommodation_type in ('hostel', 'apartment', 'self_contained', 'single_room', 'shared_room', 'other'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'listings_advance_payment_months_check') then
    alter table public.listings add constraint listings_advance_payment_months_check
      check (advance_payment_months is null or advance_payment_months >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'listings_available_rooms_check') then
    alter table public.listings add constraint listings_available_rooms_check
      check (available_rooms is null or available_rooms >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'listings_accommodation_status_check') then
    alter table public.listings add constraint listings_accommodation_status_check
      check (accommodation_status in ('available', 'paused', 'unavailable', 'rented'));
  end if;
end;
$$;

create table if not exists public.accommodation_advertiser_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  applicant_name text not null check (char_length(applicant_name) between 2 and 100),
  applicant_role text not null check (applicant_role in ('hostel_owner', 'landlord', 'property_manager', 'authorised_agent')),
  phone_number text not null check (char_length(phone_number) between 7 and 30),
  whatsapp_number text not null check (char_length(whatsapp_number) between 7 and 30),
  business_name text not null check (char_length(business_name) between 2 and 120),
  town text not null check (char_length(town) between 2 and 100),
  property_address text not null check (char_length(property_address) between 4 and 300),
  description text not null check (char_length(description) between 10 and 1500),
  authorization_confirmed boolean not null check (authorization_confirmed),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  admin_notes text,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_plan_settings (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null unique,
  plan_name text not null,
  listing_limit integer not null check (listing_limit > 0),
  price_ghs numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  description text,
  min_proposed_price numeric(10, 2),
  max_proposed_price numeric(10, 2),
  billing_period text not null default 'monthly',
  promotion_duration_days integer not null default 0 check (promotion_duration_days >= 0),
  benefits text[] not null default '{}',
  ai_generation_limit integer not null default 0 check (ai_generation_limit >= 0),
  effective_start timestamptz,
  effective_end timestamptz,
  subscription_status text not null default 'active' check (subscription_status in ('active', 'inactive')),
  promotion_available boolean not null default false,
  available_for_purchase boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (price_ghs >= 0),
  check (min_proposed_price is null or min_proposed_price >= 0),
  check (max_proposed_price is null or max_proposed_price >= 0),
  check (min_proposed_price is null or max_proposed_price is null or min_proposed_price <= max_proposed_price),
  check (effective_end is null or effective_start is null or effective_end > effective_start)
);

alter table public.marketplace_plan_settings
  add column if not exists min_proposed_price numeric(10, 2),
  add column if not exists max_proposed_price numeric(10, 2),
  add column if not exists billing_period text not null default 'monthly',
  add column if not exists promotion_duration_days integer not null default 0,
  add column if not exists benefits text[] not null default '{}',
  add column if not exists ai_generation_limit integer not null default 0,
  add column if not exists effective_start timestamptz,
  add column if not exists effective_end timestamptz,
  add column if not exists subscription_status text not null default 'active',
  add column if not exists promotion_available boolean not null default false,
  add column if not exists available_for_purchase boolean not null default true;

create table if not exists public.marketplace_payment_settings (
  id boolean primary key default true check (id),
  network text not null default '',
  recipient_name text not null default '',
  recipient_number text not null default '',
  instructions text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.marketplace_payment_settings (id)
values (true)
on conflict (id) do nothing;

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
  status text not null default 'pending' check (status in ('pending', 'active', 'expired', 'cancelled')),
  change_reason text,
  payment_request_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > starts_at)
);

create table if not exists public.subscription_plan_changes (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.plan_subscriptions (id) on delete cascade,
  changed_by uuid not null references auth.users (id),
  reason text not null,
  before_snapshot jsonb not null,
  after_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_key text not null,
  plan_name text not null,
  amount_ghs numeric(10,2) not null check (amount_ghs >= 0),
  payment_method text not null,
  payment_reference text,
  payment_date date,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  verified_by uuid references auth.users (id),
  service_start_date date,
  service_end_date date,
  plan_snapshot jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_requests
  add column if not exists plan_snapshot jsonb not null default '{}'::jsonb;
alter table public.plan_subscriptions
  add column if not exists payment_request_id uuid unique references public.payment_requests (id);

create or replace function public.activate_free_accommodation_plan()
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_plan public.marketplace_plan_settings%rowtype;
  existing_subscription_id uuid;
  starts_at_value timestamptz := now();
  expires_at_value timestamptz;
  new_subscription_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sign in before activating the Accommodation Advertiser plan.';
  end if;

  if not exists (
    select 1 from public.accommodation_advertiser_applications application
    where application.user_id = current_user_id and application.status = 'approved'
      and application.authorization_confirmed
  ) then
    raise exception 'An approved accommodation advertiser application is required.';
  end if;

  select * into current_plan
  from public.marketplace_plan_settings plan
  where plan.plan_key = 'accommodation_advertiser'
    and plan.is_active and plan.subscription_status = 'active'
    and plan.available_for_purchase and plan.price_ghs = 0
    and (plan.effective_start is null or plan.effective_start <= now())
    and (plan.effective_end is null or plan.effective_end > now());

  if not found then
    raise exception 'The Accommodation Advertiser plan is not currently available for free activation.';
  end if;

  select subscription.id into existing_subscription_id
  from public.plan_subscriptions subscription
  where subscription.user_id = current_user_id
    and subscription.plan_key = 'accommodation_advertiser'
    and subscription.status = 'active'
    and subscription.starts_at <= now()
    and subscription.expires_at > now()
  order by subscription.expires_at desc
  limit 1;

  if existing_subscription_id is not null then
    return existing_subscription_id;
  end if;

  expires_at_value := case lower(current_plan.billing_period)
    when 'weekly' then starts_at_value + interval '7 days'
    when 'quarterly' then starts_at_value + interval '3 months'
    when 'yearly' then starts_at_value + interval '1 year'
    when 'annual' then starts_at_value + interval '1 year'
    else starts_at_value + interval '1 month'
  end;

  insert into public.plan_subscriptions (
    user_id, plan_key, plan_name, price_ghs, billing_period, listing_limit,
    promotion_duration_days, benefits, ai_generation_limit, promotion_available,
    starts_at, expires_at, status, change_reason
  ) values (
    current_user_id, current_plan.plan_key, current_plan.plan_name, current_plan.price_ghs,
    current_plan.billing_period, current_plan.listing_limit, current_plan.promotion_duration_days,
    current_plan.benefits, current_plan.ai_generation_limit, current_plan.promotion_available,
    starts_at_value, expires_at_value, 'active', 'Free Accommodation Advertiser activation'
  ) returning id into new_subscription_id;

  return new_subscription_id;
end;
$$;

revoke all on function public.activate_free_accommodation_plan() from public, anon;
grant execute on function public.activate_free_accommodation_plan() to authenticated;

create or replace function public.capture_payment_request_terms()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  selected_plan public.marketplace_plan_settings%rowtype;
begin
  select * into selected_plan
  from public.marketplace_plan_settings
  where plan_key = new.plan_key
    and is_active
    and subscription_status = 'active'
    and available_for_purchase
    and (effective_start is null or effective_start <= now())
    and (effective_end is null or effective_end > now());

  if not found or selected_plan.price_ghs <= 0 then
    raise exception 'This plan is not available for paid purchase.';
  end if;

  new.plan_name := selected_plan.plan_name;
  new.amount_ghs := selected_plan.price_ghs;
  new.plan_snapshot := jsonb_build_object(
    'plan_key', selected_plan.plan_key,
    'plan_name', selected_plan.plan_name,
    'price_ghs', selected_plan.price_ghs,
    'billing_period', selected_plan.billing_period,
    'listing_limit', selected_plan.listing_limit,
    'promotion_duration_days', selected_plan.promotion_duration_days,
    'benefits', selected_plan.benefits,
    'ai_generation_limit', selected_plan.ai_generation_limit,
    'promotion_available', selected_plan.promotion_available
  );
  return new;
end;
$$;

drop trigger if exists payment_request_capture_terms on public.payment_requests;
create trigger payment_request_capture_terms
before insert on public.payment_requests
for each row execute function public.capture_payment_request_terms();

create or replace function public.activate_verified_payment_request()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  starts_at_value timestamptz;
  expires_at_value timestamptz;
begin
  if new.verification_status = 'verified'
    and old.verification_status is distinct from 'verified' then
    starts_at_value := coalesce(new.service_start_date::timestamptz, now());
    expires_at_value := coalesce(
      new.service_end_date::timestamptz,
      starts_at_value + case lower(coalesce(new.plan_snapshot ->> 'billing_period', 'monthly'))
        when 'weekly' then interval '7 days'
        when 'quarterly' then interval '3 months'
        when 'yearly' then interval '1 year'
        when 'annual' then interval '1 year'
        else interval '1 month'
      end
    );

    if expires_at_value <= starts_at_value then
      raise exception 'The subscription expiry must be after its start.';
    end if;

    insert into public.plan_subscriptions (
      user_id, plan_key, plan_name, price_ghs, billing_period, listing_limit,
      promotion_duration_days, benefits, ai_generation_limit, promotion_available,
      starts_at, expires_at, status, change_reason, payment_request_id
    )
    values (
      new.user_id,
      new.plan_snapshot ->> 'plan_key',
      new.plan_snapshot ->> 'plan_name',
      (new.plan_snapshot ->> 'price_ghs')::numeric,
      new.plan_snapshot ->> 'billing_period',
      (new.plan_snapshot ->> 'listing_limit')::integer,
      (new.plan_snapshot ->> 'promotion_duration_days')::integer,
      array(select jsonb_array_elements_text(new.plan_snapshot -> 'benefits')),
      (new.plan_snapshot ->> 'ai_generation_limit')::integer,
      (new.plan_snapshot ->> 'promotion_available')::boolean,
      starts_at_value,
      expires_at_value,
      'active',
      'Activated after administrator verified Mobile Money payment',
      new.id
    )
    on conflict (payment_request_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists payment_request_activate_subscription on public.payment_requests;
create trigger payment_request_activate_subscription
after update of verification_status on public.payment_requests
for each row execute function public.activate_verified_payment_request();

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id),
  action text not null,
  target_type text not null,
  target_id text,
  details text,
  created_at timestamptz not null default now()
);

insert into public.marketplace_plan_settings (
  plan_key, plan_name, listing_limit, price_ghs, is_active, description,
  benefits, billing_period, promotion_duration_days, ai_generation_limit,
  promotion_available, available_for_purchase
)
values
  ('student_seller', 'Student Seller', 5, 0, true, 'Free student listing access', array['5 active listings', 'Personal seller profile', 'WhatsApp and phone contact', 'Basic listing management'], 'monthly', 0, 0, false, true),
  ('student_business', 'Student Business', 20, 20, true, 'Student-run business profile access', array['20 active listings', 'Business profile', 'WhatsApp + phone contact', 'Optional featured promos'], 'monthly', 7, 10, true, true),
  ('campus_business', 'Business Plus', 50, 50, true, 'Enhanced business profile access', array['50 active listings', 'Enhanced profile', 'Priority promotional options', 'Better visibility tools'], 'monthly', 14, 30, true, true),
  ('accommodation_advertiser', 'Accommodation Advertiser', 20, 0, true, 'Accommodation listing access', array['Accommodation listings', 'Location details', 'Hostel promotion support', 'Basic business exposure'], 'monthly', 7, 5, true, true),
  ('regular_advertiser', 'Regular Advertiser', 10, 50, true, 'Campaign and advertiser access', array['Advertiser profile', 'Promotional visibility', 'Custom campaign support', 'Managed package options'], 'monthly', 30, 20, true, true)
on conflict (plan_key) do nothing;

update public.marketplace_plan_settings
set price_ghs = 50, updated_at = now()
where plan_key = 'regular_advertiser' and price_ghs = 0;

create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_seller_id_idx on public.listings (seller_id);
create index if not exists listings_status_idx on public.listings (seller_id, status, is_available);
create index if not exists payment_requests_user_id_idx on public.payment_requests (user_id, verification_status);
create index if not exists payment_requests_status_idx on public.payment_requests (verification_status, created_at desc);
create unique index if not exists payment_requests_method_reference_unique_idx
  on public.payment_requests (payment_method, payment_reference)
  where payment_reference is not null and payment_reference <> '';
create index if not exists plan_subscriptions_user_idx on public.plan_subscriptions (user_id, status, expires_at desc);
create index if not exists subscription_plan_changes_subscription_idx on public.subscription_plan_changes (subscription_id, created_at desc);

create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);

create or replace function public.enforce_accommodation_listing_rules()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  listing_allowance integer;
  current_active_count integer;
  is_marketplace_admin boolean;
begin
  if tg_op = 'UPDATE' then
    if old.category = 'Accommodation' and new.category <> 'Accommodation' then
      raise exception 'Accommodation listings cannot be converted to another category.';
    end if;
  end if;
  if new.category <> 'Accommodation' then
    return new;
  end if;

  select exists (
    select 1 from public.seller_profiles sp
    where sp.id = auth.uid() and sp.role in ('admin', 'moderator')
  ) into is_marketplace_admin;

  if is_marketplace_admin then
    return new;
  end if;

  if new.title is null or new.town is null or new.property_address is null
    or new.accommodation_type is null or new.advance_payment_months is null
    or new.accommodation_contact_phone is null then
    raise exception 'Complete all required accommodation listing details.';
  end if;

  if not (new.status = 'active' and new.is_available and new.accommodation_status = 'available') then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'active' and old.is_available
    and old.accommodation_status = 'available' then
    return new;
  end if;

  if not exists (
    select 1 from public.accommodation_advertiser_applications application
    where application.user_id = new.seller_id and application.status = 'approved'
      and application.authorization_confirmed
  ) then
    raise exception 'An approved accommodation advertiser application is required.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.seller_id::text, 0));

  select subscription.listing_limit into listing_allowance
  from public.plan_subscriptions subscription
  where subscription.user_id = new.seller_id
    and subscription.plan_key = 'accommodation_advertiser'
    and subscription.status = 'active'
    and subscription.starts_at <= now()
    and subscription.expires_at > now()
  order by subscription.expires_at desc
  limit 1;

  if listing_allowance is null then
    raise exception 'An active Accommodation Advertiser plan is required.';
  end if;

  if new.status = 'active' and new.is_available and new.accommodation_status = 'available' then
    select count(*) into current_active_count
    from public.listings listing
    where listing.seller_id = new.seller_id
      and listing.category = 'Accommodation'
      and listing.status = 'active'
      and listing.is_available
      and listing.accommodation_status = 'available'
      and (tg_op <> 'UPDATE' or listing.id <> new.id);

    if current_active_count >= listing_allowance then
      raise exception 'The Accommodation Advertiser plan allows up to % active listings.', listing_allowance;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists listings_enforce_accommodation_rules on public.listings;
create trigger listings_enforce_accommodation_rules
before insert or update on public.listings
for each row execute function public.enforce_accommodation_listing_rules();

create or replace function public.protect_accommodation_application_review()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  is_marketplace_admin boolean;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  select exists (
    select 1 from public.seller_profiles sp
    where sp.id = auth.uid() and sp.role in ('admin', 'moderator')
  ) into is_marketplace_admin;

  if not is_marketplace_admin and row(
    old.status, old.admin_notes, old.reviewed_by, old.reviewed_at
  ) is distinct from row(
    new.status, new.admin_notes, new.reviewed_by, new.reviewed_at
  ) then
    raise exception 'Only an administrator can change accommodation application review fields.';
  end if;
  return new;
end;
$$;

drop trigger if exists accommodation_application_review_guard on public.accommodation_advertiser_applications;
create trigger accommodation_application_review_guard
before update on public.accommodation_advertiser_applications
for each row execute function public.protect_accommodation_application_review();

create index if not exists accommodation_applications_status_idx
  on public.accommodation_advertiser_applications (status, created_at desc);
create index if not exists accommodation_listings_filter_idx
  on public.listings (town, accommodation_type, accommodation_status, price)
  where category = 'Accommodation';

alter table public.seller_profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_reports enable row level security;
alter table public.accommodation_advertiser_applications enable row level security;
alter table public.marketplace_plan_settings enable row level security;
alter table public.marketplace_payment_settings enable row level security;
alter table public.payment_requests enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.plan_subscriptions enable row level security;
alter table public.subscription_plan_changes enable row level security;

drop policy if exists "Plan settings are readable by campus visitors" on public.marketplace_plan_settings;
create policy "Plan settings are readable by campus visitors" on public.marketplace_plan_settings
  for select using (true);
drop policy if exists "Admins manage marketplace plans" on public.marketplace_plan_settings;
create policy "Admins manage marketplace plans" on public.marketplace_plan_settings
  for all to authenticated using (
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

drop policy if exists "Payment instructions are publicly readable" on public.marketplace_payment_settings;
create policy "Payment instructions are publicly readable" on public.marketplace_payment_settings
  for select using (true);
drop policy if exists "Admins manage payment instructions" on public.marketplace_payment_settings;
create policy "Admins manage payment instructions" on public.marketplace_payment_settings
  for all to authenticated using (
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
drop policy if exists "Admins read subscription plan changes" on public.subscription_plan_changes;
create policy "Admins read subscription plan changes" on public.subscription_plan_changes
  for select to authenticated using (
    exists (
      select 1 from public.seller_profiles sp
      where sp.id = auth.uid() and sp.role in ('admin', 'moderator')
    )
  );

revoke all on table public.marketplace_plan_settings from public, anon, authenticated;
grant select on table public.marketplace_plan_settings to anon, authenticated;
revoke all on table public.marketplace_payment_settings from public, anon, authenticated;
grant select on table public.marketplace_payment_settings to anon, authenticated;
grant insert, update, delete on table public.marketplace_payment_settings to authenticated;
revoke all on table public.payment_requests from public, anon, authenticated;
grant select, insert, update on table public.payment_requests to authenticated;
grant insert, update, delete on table public.marketplace_plan_settings to authenticated;
grant select, insert, update on table public.plan_subscriptions to authenticated;
grant select on table public.subscription_plan_changes to authenticated;

create or replace function public.record_subscription_plan_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if row(
    old.plan_key, old.plan_name, old.price_ghs, old.billing_period, old.listing_limit,
    old.promotion_duration_days, old.benefits, old.ai_generation_limit, old.promotion_available
  ) is distinct from row(
    new.plan_key, new.plan_name, new.price_ghs, new.billing_period, new.listing_limit,
    new.promotion_duration_days, new.benefits, new.ai_generation_limit, new.promotion_available
  ) then
    insert into public.subscription_plan_changes (
      subscription_id, changed_by, reason, before_snapshot, after_snapshot
    )
    values (
      new.id,
      auth.uid(),
      coalesce(nullif(new.change_reason, ''), 'Administrator explicitly changed the subscription plan or terms'),
      jsonb_build_object(
        'plan_key', old.plan_key, 'plan_name', old.plan_name, 'price_ghs', old.price_ghs,
        'billing_period', old.billing_period, 'listing_limit', old.listing_limit,
        'promotion_duration_days', old.promotion_duration_days, 'benefits', old.benefits,
        'ai_generation_limit', old.ai_generation_limit, 'promotion_available', old.promotion_available
      ),
      jsonb_build_object(
        'plan_key', new.plan_key, 'plan_name', new.plan_name, 'price_ghs', new.price_ghs,
        'billing_period', new.billing_period, 'listing_limit', new.listing_limit,
        'promotion_duration_days', new.promotion_duration_days, 'benefits', new.benefits,
        'ai_generation_limit', new.ai_generation_limit, 'promotion_available', new.promotion_available
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists plan_subscription_terms_history on public.plan_subscriptions;
create trigger plan_subscription_terms_history
after update on public.plan_subscriptions
for each row execute function public.record_subscription_plan_change();

create or replace function public.record_marketplace_plan_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if row(
    old.plan_name, old.description, old.price_ghs, old.min_proposed_price, old.max_proposed_price,
    old.billing_period, old.listing_limit, old.promotion_duration_days, old.benefits,
    old.ai_generation_limit, old.effective_start, old.effective_end, old.subscription_status,
    old.is_active, old.promotion_available, old.available_for_purchase
  ) is distinct from row(
    new.plan_name, new.description, new.price_ghs, new.min_proposed_price, new.max_proposed_price,
    new.billing_period, new.listing_limit, new.promotion_duration_days, new.benefits,
    new.ai_generation_limit, new.effective_start, new.effective_end, new.subscription_status,
    new.is_active, new.promotion_available, new.available_for_purchase
  ) then
    insert into public.admin_audit_log (actor_id, action, target_type, target_id, details)
    values (
      auth.uid(),
      'marketplace_plan_updated',
      'marketplace_plan_settings',
      new.id::text,
      jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new))::text
    );
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_plan_settings_audit on public.marketplace_plan_settings;
create trigger marketplace_plan_settings_audit
after update on public.marketplace_plan_settings
for each row execute function public.record_marketplace_plan_change();

drop policy if exists "Users manage their own payment requests" on public.payment_requests;
create policy "Users manage their own payment requests" on public.payment_requests
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users create payment requests" on public.payment_requests;
create policy "Users create payment requests" on public.payment_requests
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Admins manage payment verification" on public.payment_requests;
create policy "Admins manage payment verification" on public.payment_requests
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
drop policy if exists "Admins read payment requests" on public.payment_requests;
create policy "Admins read payment requests" on public.payment_requests
  for select to authenticated using (
    exists (
      select 1 from public.seller_profiles sp
      where sp.id = auth.uid() and sp.role in ('admin', 'moderator')
    )
  );

create policy "Admins read audit logs" on public.admin_audit_log
  for select to authenticated using (
    exists (
      select 1 from public.seller_profiles sp
      where sp.id = auth.uid() and sp.role in ('admin', 'moderator')
    )
  );
create policy "Admins insert audit entries" on public.admin_audit_log
  for insert to authenticated with check (
    exists (
      select 1 from public.seller_profiles sp
      where sp.id = auth.uid() and sp.role in ('admin', 'moderator')
    )
  );

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
  on table public.seller_profiles to authenticated;

create or replace view public.public_seller_profiles
with (security_barrier = true)
as
select
  id,
  full_name,
  campus_area,
  case when is_contact_public then whatsapp_number else '' end as whatsapp_number
from public.seller_profiles;

revoke all on table public.public_seller_profiles from public, anon, authenticated;
grant select on table public.public_seller_profiles to anon, authenticated;

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
drop policy if exists "Admins moderate accommodation listings" on public.listings;
create policy "Admins moderate accommodation listings" on public.listings
  for update to authenticated using (
    category = 'Accommodation' and exists (
      select 1 from public.seller_profiles sp
      where sp.id = auth.uid() and sp.role in ('admin', 'moderator')
    )
  ) with check (
    category = 'Accommodation' and exists (
      select 1 from public.seller_profiles sp
      where sp.id = auth.uid() and sp.role in ('admin', 'moderator')
    )
  );

drop policy if exists "Authenticated students submit reports" on public.listing_reports;
create policy "Authenticated students submit reports" on public.listing_reports
  for insert to authenticated with check (auth.uid() = reporter_id);
drop policy if exists "Admins read listing reports" on public.listing_reports;
create policy "Applicants read their accommodation applications" on public.accommodation_advertiser_applications
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Applicants create their accommodation applications" on public.accommodation_advertiser_applications;
create policy "Applicants create their accommodation applications" on public.accommodation_advertiser_applications
  for insert to authenticated with check (auth.uid() = user_id and status = 'pending' and authorization_confirmed);
drop policy if exists "Applicants update pending accommodation applications" on public.accommodation_advertiser_applications;
create policy "Applicants update pending accommodation applications" on public.accommodation_advertiser_applications
  for update to authenticated using (auth.uid() = user_id and status in ('pending', 'rejected'))
  with check (auth.uid() = user_id and status = 'pending' and authorization_confirmed);
drop policy if exists "Admins manage accommodation applications" on public.accommodation_advertiser_applications;
create policy "Admins manage accommodation applications" on public.accommodation_advertiser_applications
  for all to authenticated using (
    exists (select 1 from public.seller_profiles sp where sp.id = auth.uid() and sp.role in ('admin', 'moderator'))
  ) with check (
    exists (select 1 from public.seller_profiles sp where sp.id = auth.uid() and sp.role in ('admin', 'moderator'))
  );
revoke all on table public.accommodation_advertiser_applications from public, anon, authenticated;
grant select, insert, update on table public.accommodation_advertiser_applications to authenticated;
create policy "Admins read listing reports" on public.listing_reports
  for select to authenticated using (
    exists (
      select 1 from public.seller_profiles sp
      where sp.id = auth.uid() and sp.role in ('admin', 'moderator')
    )
  );
drop policy if exists "Admins resolve listing reports" on public.listing_reports;
create policy "Admins resolve listing reports" on public.listing_reports
  for delete to authenticated using (
    exists (
      select 1 from public.seller_profiles sp
      where sp.id = auth.uid() and sp.role in ('admin', 'moderator')
    )
  );

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
  insert into public.seller_profiles (id, full_name, campus_area, whatsapp_number, account_type, is_contact_public, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Campus seller'),
    new.raw_user_meta_data ->> 'campus_area',
    coalesce(new.raw_user_meta_data ->> 'whatsapp_number', ''),
    case
      when new.raw_user_meta_data ->> 'account_type' in (
        'student_seller', 'student_business', 'campus_business',
        'accommodation_advertiser', 'regular_advertiser'
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
