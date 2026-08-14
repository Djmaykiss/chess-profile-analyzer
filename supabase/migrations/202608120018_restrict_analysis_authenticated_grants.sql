-- Fase 3D.2: corrige privilegios heredados no requeridos para Data API.
-- authenticated debe poder leer exclusivamente sus filas mediante RLS.
revoke all privileges on table public.game_analysis_jobs from authenticated;
revoke all privileges on table public.game_analysis from authenticated;
revoke all privileges on table public.game_evaluations from authenticated;
grant select on table public.game_analysis_jobs, public.game_analysis, public.game_evaluations to authenticated;
