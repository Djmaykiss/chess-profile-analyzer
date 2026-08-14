-- Fase 3C.1: agregados seguros para el dossier. No modifica importacion ni sincronizacion.
create index if not exists games_profile_color_result_played_at_analytics_idx
  on public.games (profile_id, player_color, result, played_at desc);

create index if not exists games_profile_platform_speed_analytics_idx
  on public.games (profile_id, platform, speed);

create or replace function public.get_profile_dossier_summary(
  target_profile_id uuid,
  p_recent_limit integer default null,
  p_date_from timestamptz default null
) returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  result_json jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if p_recent_limit is not null and p_date_from is not null then
    raise exception 'Use either p_recent_limit or p_date_from, not both' using errcode = '22023';
  end if;

  if p_recent_limit is not null and p_recent_limit not in (20, 50, 100) then
    raise exception 'p_recent_limit must be 20, 50, or 100' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = target_profile_id and p.user_id = auth.uid()
  ) then
    raise exception 'Profile is not accessible to the current user' using errcode = '42501';
  end if;

  with ranked_games as (
    select g.*, row_number() over (order by g.played_at desc, g.id desc) as recent_position
    from public.games g
    where g.profile_id = target_profile_id
      and (p_date_from is null or g.played_at >= p_date_from)
  ), scoped_games as (
    select * from ranked_games
    where p_recent_limit is null or recent_position <= p_recent_limit
  ), totals as (
    select count(*)::bigint as total_games, count(*) filter (where result = 'win')::bigint as wins,
      count(*) filter (where result = 'draw')::bigint as draws, count(*) filter (where result = 'loss')::bigint as losses
    from scoped_games
  ), colors as (
    select player_color, count(*)::bigint as total_games, count(*) filter (where result = 'win')::bigint as wins,
      count(*) filter (where result = 'draw')::bigint as draws, count(*) filter (where result = 'loss')::bigint as losses
    from scoped_games group by player_color
  ), platforms as (
    select platform, count(*)::bigint as total_games, count(*) filter (where result = 'win')::bigint as wins,
      count(*) filter (where result = 'draw')::bigint as draws, count(*) filter (where result = 'loss')::bigint as losses
    from scoped_games group by platform
  ), speeds as (
    select coalesce(speed, 'unknown') as speed, count(*)::bigint as total_games, count(*) filter (where result = 'win')::bigint as wins,
      count(*) filter (where result = 'draw')::bigint as draws, count(*) filter (where result = 'loss')::bigint as losses
    from scoped_games group by coalesce(speed, 'unknown')
  )
  select jsonb_build_object(
    'total_games', totals.total_games, 'wins', totals.wins, 'draws', totals.draws, 'losses', totals.losses,
    'win_rate', coalesce(round(100.0 * totals.wins / nullif(totals.total_games, 0), 1), 0),
    'white', jsonb_build_object('total_games', coalesce((select total_games from colors where player_color = 'white'), 0), 'wins', coalesce((select wins from colors where player_color = 'white'), 0), 'draws', coalesce((select draws from colors where player_color = 'white'), 0), 'losses', coalesce((select losses from colors where player_color = 'white'), 0)),
    'black', jsonb_build_object('total_games', coalesce((select total_games from colors where player_color = 'black'), 0), 'wins', coalesce((select wins from colors where player_color = 'black'), 0), 'draws', coalesce((select draws from colors where player_color = 'black'), 0), 'losses', coalesce((select losses from colors where player_color = 'black'), 0)),
    'platforms', coalesce((select jsonb_agg(jsonb_build_object('platform', platform, 'total_games', total_games, 'wins', wins, 'draws', draws, 'losses', losses) order by platform) from platforms), '[]'::jsonb),
    'speeds', coalesce((select jsonb_agg(jsonb_build_object('speed', speed, 'total_games', total_games, 'wins', wins, 'draws', draws, 'losses', losses) order by total_games desc, speed) from speeds), '[]'::jsonb)
  ) into result_json from totals;
  return result_json;
end;
$$;

revoke all on function public.get_profile_dossier_summary(uuid, integer, timestamptz) from public, anon;
grant execute on function public.get_profile_dossier_summary(uuid, integer, timestamptz) to authenticated;
