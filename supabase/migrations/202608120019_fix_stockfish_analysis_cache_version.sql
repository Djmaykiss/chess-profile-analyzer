-- Fase 3D.3: el worker persiste explícitamente Stockfish 17.1.
-- Reutilizar solo el resultado equivalente de esa misma versión evita jobs redundantes
-- sin cambiar datos existentes, RLS ni permisos de tablas.
create or replace function public.request_game_analysis(p_game_id uuid, p_requested_depth integer default 16)
returns table(job_id uuid, status text, reusable boolean, analysis_id uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare owned_game public.games%rowtype; config_hash text; cached_analysis_id uuid; existing_job public.game_analysis_jobs%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if p_requested_depth not between 8 and 30 then raise exception 'requested_depth must be between 8 and 30' using errcode = '22023'; end if;
  select g.* into owned_game from public.games g join public.profiles p on p.id = g.profile_id where g.id = p_game_id and p.user_id = auth.uid();
  if not found then raise exception 'Game is not accessible to the current user' using errcode = '42501'; end if;
  config_hash := md5(jsonb_build_object('accuracy_formula_version','cpa-accuracy-v1','classification_version','cpa-classification-v1','cp_loss_cap',1000,'depth',p_requested_depth)::text);
  select a.id into cached_analysis_id from public.game_analysis a
  where a.game_id = owned_game.id and a.engine = 'stockfish' and a.engine_version = '17.1'
    and a.depth = p_requested_depth and a.analysis_config_hash = config_hash and a.source_pgn_hash = md5(owned_game.pgn)
  limit 1;
  if cached_analysis_id is not null then return query select null::uuid, 'completed'::text, true, cached_analysis_id; return; end if;
  select j.* into existing_job from public.game_analysis_jobs j
  where j.game_id = owned_game.id and j.engine = 'stockfish' and coalesce(j.engine_version, '') = ''
    and j.requested_depth = p_requested_depth and j.analysis_config_hash = config_hash
    and j.status in ('queued', 'running', 'cancel_requested') order by j.created_at desc limit 1;
  if found then return query select existing_job.id, existing_job.status, false, null::uuid; return; end if;
  insert into public.game_analysis_jobs(profile_id, game_id, status, requested_depth, engine, analysis_config_hash)
  values (owned_game.profile_id, owned_game.id, 'queued', p_requested_depth, 'stockfish', config_hash)
  returning id, game_analysis_jobs.status into job_id, status;
  reusable := false; analysis_id := null; return next;
end;
$$;

revoke all on function public.request_game_analysis(uuid, integer) from public, anon;
grant execute on function public.request_game_analysis(uuid, integer) to authenticated;
