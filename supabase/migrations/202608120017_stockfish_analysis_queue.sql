-- Fase 3D.2: infraestructura de cola para análisis futuro. No ejecuta ningún engine.
create table public.game_analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'cancel_requested', 'cancelled')),
  requested_depth integer not null check (requested_depth between 8 and 30),
  engine text not null default 'stockfish',
  engine_version text,
  analysis_config_hash text not null,
  priority integer not null default 0,
  progress integer not null default 0 check (progress between 0 and 100),
  positions_total integer check (positions_total is null or positions_total >= 0),
  positions_done integer not null default 0 check (positions_done >= 0),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  started_at timestamptz,
  heartbeat_at timestamptz,
  finished_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (positions_total is null or positions_done <= positions_total)
);
create trigger game_analysis_jobs_set_updated_at before update on public.game_analysis_jobs for each row execute function public.set_updated_at();
create index game_analysis_jobs_profile_created_idx on public.game_analysis_jobs(profile_id, created_at desc);
create index game_analysis_jobs_queue_idx on public.game_analysis_jobs(priority desc, created_at asc) where status = 'queued';
create unique index game_analysis_jobs_active_dedupe_idx on public.game_analysis_jobs(game_id, engine, coalesce(engine_version, ''), requested_depth, analysis_config_hash) where status in ('queued', 'running', 'cancel_requested');

create table public.game_analysis (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  engine text not null default 'stockfish',
  engine_version text,
  depth integer not null check (depth between 8 and 30),
  analysis_config jsonb not null default '{}'::jsonb,
  analysis_config_hash text not null,
  source_pgn_hash text not null,
  accuracy_white numeric,
  accuracy_black numeric,
  accuracy_formula_version text,
  classification_version text,
  summary jsonb not null default '{}'::jsonb,
  analyzed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (accuracy_white is null or accuracy_white between 0 and 100),
  check (accuracy_black is null or accuracy_black between 0 and 100)
);
create unique index game_analysis_version_dedupe_idx on public.game_analysis(game_id, engine, coalesce(engine_version, ''), depth, analysis_config_hash, source_pgn_hash);
create index game_analysis_profile_analyzed_idx on public.game_analysis(profile_id, analyzed_at desc);

create table public.game_evaluations (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.game_analysis(id) on delete cascade,
  ply integer not null check (ply > 0),
  fen text not null,
  played_move_san text not null,
  played_move_uci text not null,
  best_move_san text,
  best_move_uci text,
  score_type text not null check (score_type in ('cp', 'mate')),
  eval_before integer,
  eval_after integer,
  eval_loss integer check (eval_loss is null or eval_loss >= 0),
  mate_before integer,
  mate_after integer,
  classification text check (classification is null or classification in ('best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder', 'forced')),
  principal_variation text,
  depth integer not null check (depth between 1 and 99),
  nodes bigint check (nodes is null or nodes >= 0),
  elapsed_ms integer check (elapsed_ms is null or elapsed_ms >= 0),
  created_at timestamptz not null default now(),
  unique (analysis_id, ply),
  check ((score_type = 'cp' and mate_before is null and mate_after is null) or score_type = 'mate')
);
create index game_evaluations_analysis_ply_idx on public.game_evaluations(analysis_id, ply);

alter table public.game_analysis_jobs enable row level security;
alter table public.game_analysis enable row level security;
alter table public.game_evaluations enable row level security;
create policy "analysis_jobs_select_own_profiles" on public.game_analysis_jobs for select using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid())));
create policy "analysis_select_own_profiles" on public.game_analysis for select using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = (select auth.uid())));
create policy "evaluations_select_own_profiles" on public.game_evaluations for select using (exists (select 1 from public.game_analysis a join public.profiles p on p.id = a.profile_id where a.id = analysis_id and p.user_id = (select auth.uid())));
grant select on public.game_analysis_jobs, public.game_analysis, public.game_evaluations to authenticated;
grant select, insert, update on public.game_analysis_jobs, public.game_analysis, public.game_evaluations to service_role;

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
  select a.id into cached_analysis_id from public.game_analysis a where a.game_id = owned_game.id and a.engine = 'stockfish' and coalesce(a.engine_version, '') = '' and a.depth = p_requested_depth and a.analysis_config_hash = config_hash and a.source_pgn_hash = md5(owned_game.pgn) limit 1;
  if cached_analysis_id is not null then return query select null::uuid, 'completed'::text, true, cached_analysis_id; return; end if;
  select j.* into existing_job from public.game_analysis_jobs j where j.game_id = owned_game.id and j.engine = 'stockfish' and coalesce(j.engine_version, '') = '' and j.requested_depth = p_requested_depth and j.analysis_config_hash = config_hash and j.status in ('queued', 'running', 'cancel_requested') order by j.created_at desc limit 1;
  if found then return query select existing_job.id, existing_job.status, false, null::uuid; return; end if;
  insert into public.game_analysis_jobs(profile_id, game_id, status, requested_depth, engine, analysis_config_hash) values (owned_game.profile_id, owned_game.id, 'queued', p_requested_depth, 'stockfish', config_hash) returning id, game_analysis_jobs.status into job_id, status;
  reusable := false; analysis_id := null; return next;
end;
$$;

create or replace function public.cancel_game_analysis(p_job_id uuid)
returns table(job_id uuid, status text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare job public.game_analysis_jobs%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  select j.* into job from public.game_analysis_jobs j join public.profiles p on p.id = j.profile_id where j.id = p_job_id and p.user_id = auth.uid() for update;
  if not found then raise exception 'Analysis job is not accessible to the current user' using errcode = '42501'; end if;
  if job.status = 'queued' then update public.game_analysis_jobs set status = 'cancelled', finished_at = now() where id = job.id returning id, game_analysis_jobs.status into job_id, status;
  elsif job.status = 'running' then update public.game_analysis_jobs set status = 'cancel_requested' where id = job.id returning id, game_analysis_jobs.status into job_id, status;
  else job_id := job.id; status := job.status; end if;
  return next;
end;
$$;

create or replace function public.get_game_analysis_status(p_game_id uuid)
returns table(job_id uuid, status text, progress integer, positions_done integer, positions_total integer, error_message text, analysis_id uuid, reusable boolean)
language plpgsql security definer set search_path = public, pg_temp as $$
declare owned_game public.games%rowtype; latest_job public.game_analysis_jobs%rowtype; cached_analysis_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  select g.* into owned_game from public.games g join public.profiles p on p.id = g.profile_id where g.id = p_game_id and p.user_id = auth.uid();
  if not found then raise exception 'Game is not accessible to the current user' using errcode = '42501'; end if;
  select j.* into latest_job from public.game_analysis_jobs j where j.game_id = owned_game.id order by j.created_at desc limit 1;
  select a.id into cached_analysis_id from public.game_analysis a where a.game_id = owned_game.id and a.source_pgn_hash = md5(owned_game.pgn) order by a.analyzed_at desc limit 1;
  job_id := latest_job.id; status := coalesce(latest_job.status, case when cached_analysis_id is not null then 'completed' else 'not_requested' end); progress := coalesce(latest_job.progress, case when cached_analysis_id is not null then 100 else 0 end); positions_done := coalesce(latest_job.positions_done, 0); positions_total := latest_job.positions_total; error_message := latest_job.error_message; analysis_id := cached_analysis_id; reusable := cached_analysis_id is not null; return next;
end;
$$;

-- Backend-only contract for a future worker. It claims one queued job atomically; no engine is created here.
create or replace function public.claim_analysis_job(p_worker_id text default 'worker')
returns table(id uuid, profile_id uuid, game_id uuid, requested_depth integer, engine text, engine_version text, analysis_config_hash text, attempt_count integer)
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return query with candidate as (
    select j.id from public.game_analysis_jobs j where j.status = 'queued' order by j.priority desc, j.created_at asc for update skip locked limit 1
  ), claimed as (
    update public.game_analysis_jobs j set status = 'running', started_at = coalesce(j.started_at, now()), heartbeat_at = now(), attempt_count = j.attempt_count + 1, error_message = null
    from candidate where j.id = candidate.id
    returning j.id, j.profile_id, j.game_id, j.requested_depth, j.engine, j.engine_version, j.analysis_config_hash, j.attempt_count
  ) select * from claimed;
end;
$$;

create or replace function public.recover_stale_game_analysis_jobs(p_stale_after interval default interval '10 minutes', p_max_attempts integer default 3)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare affected integer;
begin
  update public.game_analysis_jobs set status = case when attempt_count >= p_max_attempts then 'failed' else 'queued' end, finished_at = case when attempt_count >= p_max_attempts then now() else null end, error_message = case when attempt_count >= p_max_attempts then 'El análisis agotó los reintentos permitidos.' else 'El worker dejó de responder; el trabajo fue reencolado.' end, heartbeat_at = null
  where status = 'running' and heartbeat_at < now() - p_stale_after;
  get diagnostics affected = row_count; return affected;
end;
$$;

revoke all on function public.request_game_analysis(uuid, integer), public.cancel_game_analysis(uuid), public.get_game_analysis_status(uuid), public.claim_analysis_job(text), public.recover_stale_game_analysis_jobs(interval, integer) from public, anon;
grant execute on function public.request_game_analysis(uuid, integer), public.cancel_game_analysis(uuid), public.get_game_analysis_status(uuid) to authenticated;
grant execute on function public.claim_analysis_job(text), public.recover_stale_game_analysis_jobs(interval, integer) to service_role;
