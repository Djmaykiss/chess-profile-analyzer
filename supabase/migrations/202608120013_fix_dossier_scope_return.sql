-- Corrige el contrato SETOF public.games del helper analitico de 3C.2.
-- No modifica datos, importacion, sincronizacion, RLS ni grants.
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
  with ranked_game_ids as (
    select g.id, row_number() over (order by g.played_at desc, g.id desc) as recent_position
    from public.games g
    where g.profile_id = target_profile_id
      and (p_date_from is null or g.played_at >= p_date_from)
  )
  select g.*
  from public.games g
  join ranked_game_ids ranked on ranked.id = g.id
  where p_recent_limit is null or ranked.recent_position <= p_recent_limit;
end;
$$;
