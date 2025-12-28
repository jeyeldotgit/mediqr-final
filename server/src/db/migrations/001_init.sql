-- 001_init.sql
-- Base schema for MediQR backend on Supabase PostgreSQL.

-- Ensure UUID generation is available.
create extension if not exists "pgcrypto";

--------------------------------------------------------------------------------
-- profiles
--------------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key
    references auth.users (id) on delete cascade,
  role text not null check (role in ('citizen', 'doctor', 'paramedic', 'er_admin')),
  public_key text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Allow authenticated users to read and update their own profile.
create policy "profiles_self_select" on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles_self_update" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow the backend (service role) full access.
create policy "profiles_service_role_all" on public.profiles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

--------------------------------------------------------------------------------
-- medical_blobs
--------------------------------------------------------------------------------

create table if not exists public.medical_blobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null
    references public.profiles (id) on delete cascade,
  storage_path text not null,
  category text not null check (category in ('identity', 'allergies', 'medications', 'records')),
  iv text not null,
  updated_at timestamptz not null default now()
);

alter table public.medical_blobs enable row level security;

-- In the current architecture, access to blobs should go through the backend
-- using the service role. RLS enforces that only the service role can read/write.
create policy "medical_blobs_service_role_all" on public.medical_blobs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

--------------------------------------------------------------------------------
-- recovery_shards
--------------------------------------------------------------------------------

create table if not exists public.recovery_shards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references public.profiles (id) on delete cascade,
  guardian_id uuid not null
    references public.profiles (id) on delete cascade,
  encrypted_shard text not null
);

alter table public.recovery_shards enable row level security;

-- Only the backend (service role) should interact with shards directly.
create policy "recovery_shards_service_role_all" on public.recovery_shards
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

--------------------------------------------------------------------------------
-- access_logs
--------------------------------------------------------------------------------

create table if not exists public.access_logs (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null
    references public.profiles (id),
  patient_id uuid not null
    references public.profiles (id),
  method text not null check (method in ('QR_SCAN', 'BREAK_GLASS')),
  "timestamp" timestamptz not null default now()
);

alter table public.access_logs enable row level security;

-- Access logs are append-only and managed by the backend using the service role.
create policy "access_logs_service_role_all" on public.access_logs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


