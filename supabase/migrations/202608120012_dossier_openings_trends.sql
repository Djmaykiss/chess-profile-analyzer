-- Fase 3C.2: lectura analitica de aperturas y tendencias.
-- No modifica partidas, sincronizacion, RLS existente, grants existentes ni Edge Functions.
create index if not exists games_profile_color_played_at_opening_analytics_idx
  on public.games (profile_id, player_color, played_at desc) include (eco, opening, result, speed);

create index if not exists games_profile_speed_played_at_trend_analytics_idx
  on public.games (profile_id, speed, played_at desc) include (result, player_color);

create or replace function public.get_profile_dossier_scoped_games(
  target_profile_id uuid,
  p_recent_limit integer default null,
  p_date_from timestamptz default null
) returns setof public.games
language plpgsql
stable
security invoker
set search_path = public
as $$
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
  if not exists (select 1 from public.profiles p where p.id = target_profile_id and p.user_id = auth.uid()) then
    raise exception 'Profile is not accessible to the current user' using errcode = '42501';
  end if;

  return query
  with ranked_games as (
    select g.*, row_number() over (order by g.played_at desc, g.id desc) as recent_position
    from public.games g
    where g.profile_id = target_profile_id
      and (p_date_from is null or g.played_at >= p_date_from)
  )
  select g.* from ranked_games g
  where p_recent_limit is null or g.recent_position <= p_recent_limit;
end;
$$;

create or replace function public.get_profile_opening_stats(
  target_profile_id uuid,
  p_color text,
  p_recent_limit integer default null,
  p_date_from timestamptz default null,
  p_limit integer default 10,
  p_sort text default 'frequency'
) returns table(eco text, opening text, games bigint, wins bigint, draws bigint, losses bigint, win_rate numeric, sample_size bigint)
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if p_color not in ('white', 'black') then
    raise exception 'p_color must be white or black' using errcode = '22023';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 20 then
    raise exception 'p_limit must be between 1 and 20' using errcode = '22023';
  end if;
  if p_sort not in ('frequency', 'best', 'worst') then
    raise exception 'p_sort must be frequency, best, or worst' using errcode = '22023';
  end if;

  return query
  with opening_rows as (
    select coalesce(nullif(g.eco, ''), '—') as grouped_eco,
      coalesce(nullif(g.opening, ''), 'Sin nombre') as grouped_opening,
      count(*)::bigint as grouped_games,
      count(*) filter (where g.result = 'win')::bigint as grouped_wins,
      count(*) filter (where g.result = 'draw')::bigint as grouped_draws,
      count(*) filter (where g.result = 'loss')::bigint as grouped_losses
    from public.get_profile_dossier_scoped_games(target_profile_id, p_recent_limit, p_date_from) g
    where g.player_color = p_color
    group by coalesce(nullif(g.eco, ''), '—'), coalesce(nullif(g.opening, ''), 'Sin nombre')
  ), calculated as (
    select grouped_eco, grouped_opening, grouped_games, grouped_wins, grouped_draws, grouped_losses,
      coalesce(round(100.0 * grouped_wins / nullif(grouped_games, 0), 1), 0) as grouped_win_rate
    from opening_rows
  )
  select grouped_eco, grouped_opening, grouped_games, grouped_wins, grouped_draws, grouped_losses, grouped_win_rate, grouped_games
  from calculated
  order by
    case when p_sort = 'frequency' then grouped_games end desc nulls last,
    case when p_sort = 'best' then grouped_win_rate end desc nulls last,
    case when p_sort = 'worst' then grouped_win_rate end asc nulls last,
    grouped_games desc, grouped_eco, grouped_opening
  limit p_limit;
end;
$$;

create or replace function public.get_profile_black_response_stats(
  target_profile_id uuid,
  p_recent_limit integer default null,
  p_date_from timestamptz default null,
  p_limit integer default 10,
  p_sort text default 'frequency'
) returns table(first_move text, games bigint, wins bigint, draws bigint, losses bigint, win_rate numeric, sample_size bigint)
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if p_limit is null or p_limit < 1 or p_limit > 20 then
    raise exception 'p_limit must be between 1 and 20' using errcode = '22023';
  end if;
  if p_sort not in ('frequency', 'best', 'worst') then
    raise exception 'p_sort must be frequency, best, or worst' using errcode = '22023';
  end if;

  return query
  with black_games as (
    select g.*, substring(regexp_replace(g.pgn, E'(?s)^.*?\\r?\\n\\r?\\n', '') from E'^\\s*1\\.\\s*([^\\s\\{\\(]+)') as first_san
    from public.get_profile_dossier_scoped_games(target_profile_id, p_recent_limit, p_date_from) g
    where g.player_color = 'black'
  ), grouped as (
    select case regexp_replace(coalesce(first_san, ''), E'[+#?!]+$', '', 'g')
      when 'e4' then '1.e4' when 'd4' then '1.d4' when 'c4' then '1.c4' when 'Nf3' then '1.Nf3' else 'Otros' end as grouped_first_move,
      count(*)::bigint as grouped_games,
      count(*) filter (where result = 'win')::bigint as grouped_wins,
      count(*) filter (where result = 'draw')::bigint as grouped_draws,
      count(*) filter (where result = 'loss')::bigint as grouped_losses
    from black_games group by 1
  ), calculated as (
    select grouped_first_move, grouped_games, grouped_wins, grouped_draws, grouped_losses,
      coalesce(round(100.0 * grouped_wins / nullif(grouped_games, 0), 1), 0) as grouped_win_rate
    from grouped
  )
  select grouped_first_move, grouped_games, grouped_wins, grouped_draws, grouped_losses, grouped_win_rate, grouped_games
  from calculated
  order by
    case when p_sort = 'frequency' then grouped_games end desc nulls last,
    case when p_sort = 'best' then grouped_win_rate end desc nulls last,
    case when p_sort = 'worst' then grouped_win_rate end asc nulls last,
    grouped_games desc, grouped_first_move
  limit p_limit;
end;
$$;

create or replace function public.get_profile_dossier_trends(
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
  with scoped_games as (
    select * from public.get_profile_dossier_scoped_games(target_profile_id, p_recent_limit, p_date_from)
  ), opening_candidates as (
    select g.player_color, coalesce(nullif(g.eco, ''), '—') as eco, coalesce(nullif(g.opening, ''), 'Sin nombre') as opening,
      count(*)::bigint as games, count(*) filter (where g.result = 'win')::bigint as wins,
      count(*) filter (where g.result = 'draw')::bigint as draws, count(*) filter (where g.result = 'loss')::bigint as losses,
      coalesce(round(100.0 * count(*) filter (where g.result = 'win') / nullif(count(*), 0), 1), 0) as win_rate
    from scoped_games g group by g.player_color, coalesce(nullif(g.eco, ''), '—'), coalesce(nullif(g.opening, ''), 'Sin nombre')
    having count(*) >= 10
  ), color_candidates as (
    select g.player_color as label, count(*)::bigint as games, count(*) filter (where g.result = 'win')::bigint as wins,
      count(*) filter (where g.result = 'draw')::bigint as draws, count(*) filter (where g.result = 'loss')::bigint as losses,
      coalesce(round(100.0 * count(*) filter (where g.result = 'win') / nullif(count(*), 0), 1), 0) as win_rate
    from scoped_games g group by g.player_color having count(*) >= 10
  ), speed_candidates as (
    select coalesce(nullif(g.speed, ''), 'Sin ritmo') as label, count(*)::bigint as games, count(*) filter (where g.result = 'win')::bigint as wins,
      count(*) filter (where g.result = 'draw')::bigint as draws, count(*) filter (where g.result = 'loss')::bigint as losses,
      coalesce(round(100.0 * count(*) filter (where g.result = 'win') / nullif(count(*), 0), 1), 0) as win_rate
    from scoped_games g group by coalesce(nullif(g.speed, ''), 'Sin ritmo') having count(*) >= 10
  ), current_stats as (
    select count(*)::bigint as games, count(*) filter (where result = 'win')::bigint as wins,
      coalesce(round(100.0 * count(*) filter (where result = 'win') / nullif(count(*), 0), 1), 0) as win_rate from scoped_games
  ), all_stats as (
    select count(*)::bigint as games, count(*) filter (where result = 'win')::bigint as wins,
      coalesce(round(100.0 * count(*) filter (where result = 'win') / nullif(count(*), 0), 1), 0) as win_rate
    from public.get_profile_dossier_scoped_games(target_profile_id, null, null)
  )
  select jsonb_build_object(
    'sample_threshold', 10,
    'favorite_opening', coalesce((select jsonb_build_object('color', player_color, 'eco', eco, 'opening', opening, 'games', games, 'wins', wins, 'draws', draws, 'losses', losses, 'win_rate', win_rate) from opening_candidates order by games desc, win_rate desc limit 1), 'null'::jsonb),
    'best_opening', coalesce((select jsonb_build_object('color', player_color, 'eco', eco, 'opening', opening, 'games', games, 'wins', wins, 'draws', draws, 'losses', losses, 'win_rate', win_rate) from opening_candidates order by win_rate desc, games desc limit 1), 'null'::jsonb),
    'worst_opening', coalesce((select jsonb_build_object('color', player_color, 'eco', eco, 'opening', opening, 'games', games, 'wins', wins, 'draws', draws, 'losses', losses, 'win_rate', win_rate) from opening_candidates order by win_rate asc, games desc limit 1), 'null'::jsonb),
    'best_color', coalesce((select jsonb_build_object('label', label, 'games', games, 'wins', wins, 'draws', draws, 'losses', losses, 'win_rate', win_rate) from color_candidates order by win_rate desc, games desc limit 1), 'null'::jsonb),
    'worst_color', coalesce((select jsonb_build_object('label', label, 'games', games, 'wins', wins, 'draws', draws, 'losses', losses, 'win_rate', win_rate) from color_candidates order by win_rate asc, games desc limit 1), 'null'::jsonb),
    'best_speed', coalesce((select jsonb_build_object('label', label, 'games', games, 'wins', wins, 'draws', draws, 'losses', losses, 'win_rate', win_rate) from speed_candidates order by win_rate desc, games desc limit 1), 'null'::jsonb),
    'worst_speed', coalesce((select jsonb_build_object('label', label, 'games', games, 'wins', wins, 'draws', draws, 'losses', losses, 'win_rate', win_rate) from speed_candidates order by win_rate asc, games desc limit 1), 'null'::jsonb),
    'range_vs_history', jsonb_build_object('range_games', (select games from current_stats), 'range_win_rate', (select win_rate from current_stats), 'all_games', (select games from all_stats), 'all_win_rate', (select win_rate from all_stats), 'win_rate_delta', coalesce((select win_rate from current_stats), 0) - coalesce((select win_rate from all_stats), 0))
  ) into result_json;
  return result_json;
end;
$$;

revoke all on function public.get_profile_dossier_scoped_games(uuid, integer, timestamptz) from public, anon;
revoke all on function public.get_profile_opening_stats(uuid, text, integer, timestamptz, integer, text) from public, anon;
revoke all on function public.get_profile_black_response_stats(uuid, integer, timestamptz, integer, text) from public, anon;
revoke all on function public.get_profile_dossier_trends(uuid, integer, timestamptz) from public, anon;
grant execute on function public.get_profile_dossier_scoped_games(uuid, integer, timestamptz) to authenticated;
grant execute on function public.get_profile_opening_stats(uuid, text, integer, timestamptz, integer, text) to authenticated;
grant execute on function public.get_profile_black_response_stats(uuid, integer, timestamptz, integer, text) to authenticated;
grant execute on function public.get_profile_dossier_trends(uuid, integer, timestamptz) to authenticated;
