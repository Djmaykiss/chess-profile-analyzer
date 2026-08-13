-- Fase 3B: partidas normalizadas, ejecuciones de sincronización y métricas básicas.
create table public.games (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade, account_id uuid not null references public.chess_accounts(id) on delete cascade,
 platform text not null check(platform in ('lichess','chesscom')), external_game_id text not null, game_url text,
 played_at timestamptz not null, white_username text not null, black_username text not null, white_rating integer, black_rating integer,
 player_color text not null check(player_color in ('white','black')), result text not null check(result in ('win','draw','loss')),
 rated boolean, speed text, time_control text, eco text, opening text, termination text, pgn text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(account_id, platform, external_game_id)
);
create index games_profile_played_at_idx on public.games(profile_id, played_at desc);
create index games_account_played_at_idx on public.games(account_id, played_at desc);
create index games_profile_filters_idx on public.games(profile_id, platform, result, speed);
create trigger games_set_updated_at before update on public.games for each row execute function public.set_updated_at();
alter table public.games enable row level security;
create policy "games_select_own_profiles" on public.games for select using (exists (select 1 from public.profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
grant select on table public.games to authenticated;

create table public.sync_runs (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade, account_id uuid references public.chess_accounts(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','running','completed','failed')), started_at timestamptz not null default now(), finished_at timestamptz,
 games_found integer not null default 0, games_imported integer not null default 0, games_skipped integer not null default 0, games_failed integer not null default 0, error_message text, created_at timestamptz not null default now()
);
create index sync_runs_profile_started_at_idx on public.sync_runs(profile_id, started_at desc);
alter table public.sync_runs enable row level security;
create policy "sync_runs_select_own_profiles" on public.sync_runs for select using (exists (select 1 from public.profiles p where p.id=profile_id and p.user_id=(select auth.uid())));
grant select on table public.sync_runs to authenticated;

create function public.get_profile_basic_stats(target_profile_id uuid) returns table(total_games bigint,wins bigint,draws bigint,losses bigint,win_rate numeric)
language sql stable security invoker set search_path=public as $$
 select count(*), count(*) filter(where result='win'), count(*) filter(where result='draw'), count(*) filter(where result='loss'), coalesce(round(100.0*count(*) filter(where result='win')/nullif(count(*),0),1),0)
 from public.games g where g.profile_id=target_profile_id and exists(select 1 from public.profiles p where p.id=target_profile_id and p.user_id=auth.uid());
$$;
grant execute on function public.get_profile_basic_stats(uuid) to authenticated;
