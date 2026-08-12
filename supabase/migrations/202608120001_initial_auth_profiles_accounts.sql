-- Fase 2: perfiles y cuentas públicas. MODIFICA esquema: crear tablas, trigger, índices y políticas RLS.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  country text,
  notes text,
  profile_type text not null default 'self' check (profile_type in ('self', 'rival', 'student', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_user_id_idx on public.profiles(user_id);

create table public.chess_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('lichess', 'chesscom')),
  username text not null,
  platform_user_id text,
  profile_url text,
  is_active boolean not null default true,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index chess_accounts_profile_id_idx on public.chess_accounts(profile_id);
create unique index chess_accounts_profile_platform_username_unique on public.chess_accounts(profile_id, platform, lower(username));

create function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger chess_accounts_set_updated_at before update on public.chess_accounts for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.chess_accounts enable row level security;

create policy "profiles_select_own" on public.profiles for select using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "profiles_delete_own" on public.profiles for delete using ((select auth.uid()) = user_id);

create policy "accounts_select_own_profiles" on public.chess_accounts for select using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid())));
create policy "accounts_insert_own_profiles" on public.chess_accounts for insert with check (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid())));
create policy "accounts_update_own_profiles" on public.chess_accounts for update using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid()))) with check (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid())));
create policy "accounts_delete_own_profiles" on public.chess_accounts for delete using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid())));
