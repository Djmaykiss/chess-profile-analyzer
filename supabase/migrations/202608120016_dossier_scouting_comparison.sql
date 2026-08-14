-- Fase 3C.4: scouting y comparacion, exclusivamente de lectura analitica.
-- No modifica games, PGN, sincronizacion, RLS existente, grants existentes ni Stockfish.
create index if not exists game_repertoire_moves_profile_color_sequence_scout_idx
  on public.game_repertoire_moves (profile_id, player_color, ply, move_sequence);
create index if not exists games_usernames_head_to_head_idx
  on public.games (lower(white_username), lower(black_username), played_at desc);

create or replace function public.get_profile_scouting(
  target_profile_id uuid,
  p_recent_limit integer default null,
  p_date_from timestamptz default null
) returns jsonb language plpgsql stable security invoker set search_path = public as $$
declare result_json jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication is required' using errcode='42501'; end if;
  -- The scoped helper enforces auth.uid(), ownership and mutually exclusive ranges.
  perform 1 from public.get_profile_dossier_scoped_games(target_profile_id, p_recent_limit, p_date_from) limit 1;
  with scoped as (
    select * from public.get_profile_dossier_scoped_games(target_profile_id, p_recent_limit, p_date_from)
  ), move_stats as (
    select m.player_color, m.move_sequence, m.san, m.ply, count(*)::bigint games,
      count(*) filter(where s.result='win')::bigint wins, count(*) filter(where s.result='draw')::bigint draws, count(*) filter(where s.result='loss')::bigint losses
    from public.game_repertoire_moves m join scoped s on s.id=m.game_id
    where m.profile_id=target_profile_id and m.ply <= 4
    group by m.player_color,m.move_sequence,m.san,m.ply
  ), nodes as (
    select *, coalesce(round(100.0*wins/nullif(games,0),1),0) win_rate,
      case when games < 5 then 'insuficiente' when games < 10 then 'muestra pequeña' when games < 30 then 'evidencia moderada' else 'evidencia fuerte' end confidence
    from move_stats
  ), openings as (
    select coalesce(nullif(eco,''),'—') eco, coalesce(nullif(opening,''),'Sin nombre') opening, count(*)::bigint games,
      count(*) filter(where result='win')::bigint wins, count(*) filter(where result='draw')::bigint draws, count(*) filter(where result='loss')::bigint losses
    from scoped group by 1,2
  ), opening_rows as (
    select *, coalesce(round(100.0*wins/nullif(games,0),1),0) win_rate,
      case when games < 5 then 'insuficiente' when games < 10 then 'muestra pequeña' when games < 30 then 'evidencia moderada' else 'evidencia fuerte' end confidence from openings
  ), color_rows as (
    select player_color label,count(*)::bigint games,count(*) filter(where result='win')::bigint wins,count(*) filter(where result='draw')::bigint draws,count(*) filter(where result='loss')::bigint losses from scoped group by player_color
  ), speed_rows as (
    select coalesce(nullif(speed,''),'Sin ritmo') label,count(*)::bigint games,count(*) filter(where result='win')::bigint wins,count(*) filter(where result='draw')::bigint draws,count(*) filter(where result='loss')::bigint losses from scoped group by 1
  )
  select jsonb_build_object(
    'sample_rules', jsonb_build_object('under_5','insuficiente','from_5_to_9','muestra pequeña','from_10_to_29','evidencia moderada','from_30','evidencia fuerte'),
    'white_first_moves', coalesce((select jsonb_agg(jsonb_build_object('move_sequence',move_sequence,'san',san,'ply',ply,'games',games,'wins',wins,'draws',draws,'losses',losses,'win_rate',win_rate,'percentage',round(100.0*games/nullif((select count(*) from scoped where player_color='white'),0),1),'sample_size',games,'confidence',confidence) order by games desc) from (select * from nodes where ply=1 and player_color='white' order by games desc limit 5) q),'[]'::jsonb),
    'black_responses', coalesce((select jsonb_agg(jsonb_build_object('move_sequence',move_sequence,'san',san,'ply',ply,'games',games,'wins',wins,'draws',draws,'losses',losses,'win_rate',win_rate,'sample_size',games,'confidence',confidence) order by games desc) from (select * from nodes where ply=2 and player_color='black' order by games desc limit 8) q),'[]'::jsonb),
    'favorite_openings', coalesce((select jsonb_agg(to_jsonb(q)) from (select eco,opening,games,wins,draws,losses,win_rate,games sample_size,confidence from opening_rows order by games desc limit 5) q),'[]'::jsonb),
    'best_openings', coalesce((select jsonb_agg(to_jsonb(q)) from (select eco,opening,games,wins,draws,losses,win_rate,games sample_size,confidence from opening_rows where games>=10 order by win_rate desc,games desc limit 5) q),'[]'::jsonb),
    'worst_openings', coalesce((select jsonb_agg(to_jsonb(q)) from (select eco,opening,games,wins,draws,losses,win_rate,games sample_size,confidence from opening_rows where games>=10 order by win_rate asc,games desc limit 5) q),'[]'::jsonb),
    'recurrent_lines', coalesce((select jsonb_agg(jsonb_build_object('move_sequence',move_sequence,'san',san,'ply',ply,'games',games,'wins',wins,'draws',draws,'losses',losses,'win_rate',win_rate,'sample_size',games,'confidence',confidence) order by games desc) from (select * from nodes where ply between 2 and 4 order by games desc limit 8) q),'[]'::jsonb),
    'best_lines', coalesce((select jsonb_agg(jsonb_build_object('move_sequence',move_sequence,'san',san,'ply',ply,'games',games,'wins',wins,'draws',draws,'losses',losses,'win_rate',win_rate,'sample_size',games,'confidence',confidence) order by win_rate desc,games desc) from (select * from nodes where games>=10 order by win_rate desc,games desc limit 5) q),'[]'::jsonb),
    'worst_lines', coalesce((select jsonb_agg(jsonb_build_object('move_sequence',move_sequence,'san',san,'ply',ply,'games',games,'wins',wins,'draws',draws,'losses',losses,'win_rate',win_rate,'sample_size',games,'confidence',confidence) order by win_rate asc,games desc) from (select * from nodes where games>=10 order by win_rate asc,games desc limit 5) q),'[]'::jsonb),
    'best_color', coalesce((select jsonb_build_object('label',label,'games',games,'wins',wins,'draws',draws,'losses',losses,'win_rate',round(100.0*wins/nullif(games,0),1),'sample_size',games) from color_rows order by round(100.0*wins/nullif(games,0),1) desc,games desc limit 1),'null'::jsonb),
    'best_speed', coalesce((select jsonb_build_object('label',label,'games',games,'wins',wins,'draws',draws,'losses',losses,'win_rate',round(100.0*wins/nullif(games,0),1),'sample_size',games) from speed_rows where games>=10 order by round(100.0*wins/nullif(games,0),1) desc,games desc limit 1),'null'::jsonb)
  ) into result_json;
  return result_json;
end; $$;

create or replace function public.compare_profile_dossiers(
  left_profile_id uuid, right_profile_id uuid, p_recent_limit integer default null, p_date_from timestamptz default null
) returns jsonb language plpgsql stable security invoker set search_path = public as $$
declare output jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication is required' using errcode='42501'; end if;
  if left_profile_id = right_profile_id then raise exception 'Choose two different profiles' using errcode='22023'; end if;
  perform 1 from public.get_profile_dossier_scoped_games(left_profile_id,p_recent_limit,p_date_from) limit 1;
  perform 1 from public.get_profile_dossier_scoped_games(right_profile_id,p_recent_limit,p_date_from) limit 1;
  with left_aliases as (select lower(username) username from public.chess_accounts where profile_id=left_profile_id),
  right_aliases as (select lower(username) username from public.chess_accounts where profile_id=right_profile_id),
  direct_games as (
    select g.*, case when lower(g.white_username) in(select username from left_aliases) then 'white' else 'black' end left_color
    from public.games g where (lower(g.white_username) in(select username from left_aliases) and lower(g.black_username) in(select username from right_aliases)) or (lower(g.black_username) in(select username from left_aliases) and lower(g.white_username) in(select username from right_aliases))
  ), head_to_head as (
    select count(*)::bigint games,count(*) filter(where (left_color='white' and result='win') or (left_color='black' and result='loss'))::bigint left_wins,
      count(*) filter(where result='draw')::bigint draws,count(*) filter(where (left_color='white' and result='loss') or (left_color='black' and result='win'))::bigint right_wins from direct_games
  ) select jsonb_build_object(
    'left', jsonb_build_object('summary',public.get_profile_dossier_summary(left_profile_id,p_recent_limit,p_date_from),'scouting',public.get_profile_scouting(left_profile_id,p_recent_limit,p_date_from),'ratings',coalesce((select jsonb_agg(jsonb_build_object('platform',platform,'username',username,'bullet',rating_bullet,'blitz',rating_blitz,'rapid',rating_rapid,'classical',rating_classical)) from public.chess_accounts where profile_id=left_profile_id and verification_status='verified'),'[]'::jsonb)),
    'right', jsonb_build_object('summary',public.get_profile_dossier_summary(right_profile_id,p_recent_limit,p_date_from),'scouting',public.get_profile_scouting(right_profile_id,p_recent_limit,p_date_from),'ratings',coalesce((select jsonb_agg(jsonb_build_object('platform',platform,'username',username,'bullet',rating_bullet,'blitz',rating_blitz,'rapid',rating_rapid,'classical',rating_classical)) from public.chess_accounts where profile_id=right_profile_id and verification_status='verified'),'[]'::jsonb)),
    'head_to_head', jsonb_build_object('games',(select games from head_to_head),'left_wins',(select left_wins from head_to_head),'draws',(select draws from head_to_head),'right_wins',(select right_wins from head_to_head),'recent_games',coalesce((select jsonb_agg(jsonb_build_object('played_at',played_at,'game_url',game_url,'white_username',white_username,'black_username',black_username,'left_color',left_color,'result',result) order by played_at desc) from (select * from direct_games order by played_at desc limit 10) q),'[]'::jsonb))
  ) into output;
  return output;
end; $$;

revoke all on function public.get_profile_scouting(uuid, integer, timestamptz) from public, anon;
revoke all on function public.compare_profile_dossiers(uuid, uuid, integer, timestamptz) from public, anon;
grant execute on function public.get_profile_scouting(uuid, integer, timestamptz) to authenticated;
grant execute on function public.compare_profile_dossiers(uuid, uuid, integer, timestamptz) to authenticated;
