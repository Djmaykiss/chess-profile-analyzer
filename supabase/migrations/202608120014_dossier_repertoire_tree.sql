-- Fase 3C.3: indice derivado e idempotente para repertorio real desde PGN.
create table public.game_repertoire_moves (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  account_id uuid references public.chess_accounts(id) on delete set null,
  player_color text not null check (player_color in ('white', 'black')),
  ply integer not null check (ply > 0),
  san text not null,
  uci text,
  fen_after text,
  move_sequence text not null,
  played_at timestamptz,
  created_at timestamptz not null default now(),
  unique (game_id, ply)
);
create index game_repertoire_moves_profile_color_ply_sequence_idx on public.game_repertoire_moves (profile_id, player_color, ply, move_sequence);
create index game_repertoire_moves_game_idx on public.game_repertoire_moves (game_id);
alter table public.game_repertoire_moves enable row level security;
create policy "repertoire_moves_select_own_profiles" on public.game_repertoire_moves for select using (
  exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid()))
);
grant select on table public.game_repertoire_moves to authenticated;

create table public.repertoire_index_jobs (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  last_game_id uuid,
  processed_games integer not null default 0,
  indexed_moves integer not null default 0,
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text
);
alter table public.repertoire_index_jobs enable row level security;
create policy "repertoire_jobs_select_own_profiles" on public.repertoire_index_jobs for select using (
  exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid()))
);
grant select on table public.repertoire_index_jobs to authenticated;

create or replace function public.get_profile_repertoire_tree(
  target_profile_id uuid,
  p_player_color text,
  p_recent_limit integer default null,
  p_date_from timestamptz default null,
  p_max_ply integer default 8,
  p_min_games integer default 3
) returns table(move_sequence text, san text, ply integer, games bigint, wins bigint, draws bigint, losses bigint, win_rate numeric, percentage numeric)
language plpgsql stable security invoker set search_path = public as $$
begin
  if p_player_color not in ('white', 'black') then raise exception 'p_player_color must be white or black' using errcode = '22023'; end if;
  if p_max_ply is null or p_max_ply < 1 or p_max_ply > 12 then raise exception 'p_max_ply must be between 1 and 12' using errcode = '22023'; end if;
  if p_min_games is null or p_min_games < 1 or p_min_games > 100 then raise exception 'p_min_games must be between 1 and 100' using errcode = '22023'; end if;
  return query
  with scoped_games as (
    select id, result from public.get_profile_dossier_scoped_games(target_profile_id, p_recent_limit, p_date_from)
  ), aggregated as (
    select m.move_sequence, m.san, m.ply,
      case when m.ply = 1 then '' else regexp_replace(m.move_sequence, E'\\s+\\S+$', '') end as parent_sequence,
      count(*)::bigint as grouped_games,
      count(*) filter (where g.result = 'win')::bigint as grouped_wins,
      count(*) filter (where g.result = 'draw')::bigint as grouped_draws,
      count(*) filter (where g.result = 'loss')::bigint as grouped_losses
    from public.game_repertoire_moves m join scoped_games g on g.id = m.game_id
    where m.profile_id = target_profile_id and m.player_color = p_player_color and m.ply <= p_max_ply
    group by m.move_sequence, m.san, m.ply
  ), filtered as (
    select *, sum(grouped_games) over (partition by parent_sequence) as parent_games from aggregated where grouped_games >= p_min_games
  )
  select move_sequence, san, ply, grouped_games, grouped_wins, grouped_draws, grouped_losses,
    coalesce(round(100.0 * grouped_wins / nullif(grouped_games, 0), 1), 0),
    coalesce(round(100.0 * grouped_games / nullif(parent_games, 0), 1), 0)
  from filtered order by ply, move_sequence;
end;
$$;

revoke all on function public.get_profile_repertoire_tree(uuid, text, integer, timestamptz, integer, integer) from public, anon;
grant execute on function public.get_profile_repertoire_tree(uuid, text, integer, timestamptz, integer, integer) to authenticated;
grant select, insert, update on table public.game_repertoire_moves to service_role;
grant select, insert, update on table public.repertoire_index_jobs to service_role;
