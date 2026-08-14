-- Corrige la ambiguedad entre nombres de salida RETURNS TABLE y columnas del CTE.
-- No modifica datos, indice, importacion, RLS ni grants.
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
    select scoped.id, scoped.result from public.get_profile_dossier_scoped_games(target_profile_id, p_recent_limit, p_date_from) scoped
  ), aggregated as (
    select m.move_sequence as node_sequence, m.san as node_san, m.ply as node_ply,
      case when m.ply = 1 then '' else regexp_replace(m.move_sequence, E'\\s+\\S+$', '') end as parent_sequence,
      count(*)::bigint as grouped_games,
      count(*) filter (where g.result = 'win')::bigint as grouped_wins,
      count(*) filter (where g.result = 'draw')::bigint as grouped_draws,
      count(*) filter (where g.result = 'loss')::bigint as grouped_losses
    from public.game_repertoire_moves m join scoped_games g on g.id = m.game_id
    where m.profile_id = target_profile_id and m.player_color = p_player_color and m.ply <= p_max_ply
    group by m.move_sequence, m.san, m.ply
  ), with_parent_totals as (
    select a.*, sum(a.grouped_games) over (partition by a.parent_sequence) as parent_games from aggregated a
  ), filtered as (
    select * from with_parent_totals where grouped_games >= p_min_games
  )
  select f.node_sequence, f.node_san, f.node_ply, f.grouped_games, f.grouped_wins, f.grouped_draws, f.grouped_losses,
    coalesce(round(100.0 * f.grouped_wins / nullif(f.grouped_games, 0), 1), 0),
    coalesce(round(100.0 * f.grouped_games / nullif(f.parent_games, 0), 1), 0)
  from filtered f order by f.node_ply, f.node_sequence;
end;
$$;
