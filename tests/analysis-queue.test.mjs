import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(new URL('../supabase/migrations/202608120017_stockfish_analysis_queue.sql', import.meta.url), 'utf8')
const grantsFix = readFileSync(new URL('../supabase/migrations/202608120018_restrict_analysis_authenticated_grants.sql', import.meta.url), 'utf8')
const cacheFix = readFileSync(new URL('../supabase/migrations/202608120019_fix_stockfish_analysis_cache_version.sql', import.meta.url), 'utf8')
const required = [
  'create table public.game_analysis_jobs', 'create table public.game_analysis', 'create table public.game_evaluations',
  "status in ('queued', 'running', 'completed', 'failed', 'cancel_requested', 'cancelled')", 'progress between 0 and 100', 'requested_depth between 8 and 30',
  'game_analysis_jobs_active_dedupe_idx', "status in ('queued', 'running', 'cancel_requested')", 'source_pgn_hash text not null', "score_type in ('cp', 'mate')",
  'enable row level security', 'analysis_jobs_select_own_profiles', 'analysis_select_own_profiles', 'evaluations_select_own_profiles',
  'create or replace function public.request_game_analysis', 'create or replace function public.cancel_game_analysis', 'create or replace function public.get_game_analysis_status',
  'auth.uid()', 'Game is not accessible to the current user', 'for update skip locked', 'create or replace function public.recover_stale_game_analysis_jobs',
  'cpa-accuracy-v1', 'cpa-classification-v1', 'grant execute on function public.request_game_analysis', 'to authenticated', 'to service_role'
]
for (const text of required) assert.ok(migration.includes(text), `Missing queue contract: ${text}`)
assert.ok(!migration.includes('grant insert on public.game_analysis_jobs to authenticated'), 'Frontend must not receive direct job inserts.')
assert.ok(!migration.includes('grant insert on public.game_analysis to authenticated'), 'Frontend must not write analyses.')
assert.ok(!migration.includes('grant insert on public.game_evaluations to authenticated'), 'Frontend must not write evaluations.')
assert.ok(migration.includes("coalesce(engine_version, '')"), 'Nullable engine versions must be deduplicated deterministically.')
assert.ok(grantsFix.includes('revoke all privileges on table public.game_analysis_jobs from authenticated') && grantsFix.includes('grant select on table public.game_analysis_jobs, public.game_analysis, public.game_evaluations to authenticated'), 'Authenticated must retain only SELECT on analysis tables.')
assert.ok(cacheFix.includes("a.engine_version = '17.1'") && cacheFix.includes('grant execute on function public.request_game_analysis'), 'Completed Stockfish 17.1 analyses must be reusable without changing caller permissions.')
console.log('Stockfish analysis queue contract tests passed.')
