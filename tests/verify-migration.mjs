import { readFileSync } from 'node:fs'

const sql = readFileSync(new URL('../supabase/migrations/202608120001_initial_auth_profiles_accounts.sql', import.meta.url), 'utf8')
const verificationSql = readFileSync(new URL('../supabase/migrations/202608120002_chess_account_verification.sql', import.meta.url), 'utf8')
const importSql = readFileSync(new URL('../supabase/migrations/202608120003_games_and_sync_runs.sql', import.meta.url), 'utf8')
const resumableBackfillSql = readFileSync(new URL('../supabase/migrations/202608120006_lichess_resumable_backfill.sql', import.meta.url), 'utf8')
const reconciliationSql = readFileSync(new URL('../supabase/migrations/202608120007_reconcile_djmaykiss_lichess_backfill.sql', import.meta.url), 'utf8')
const variantRecoverySql = readFileSync(new URL('../supabase/migrations/202608120008_resume_djmaykiss_after_variant_page.sql', import.meta.url), 'utf8')
const functionRolloutRecoverySql = readFileSync(new URL('../supabase/migrations/202608120009_reopen_djmaykiss_after_function_rollout.sql', import.meta.url), 'utf8')
const timestampBoundaryRecoverySql = readFileSync(new URL('../supabase/migrations/202608120010_reconcile_djmaykiss_timestamp_boundary.sql', import.meta.url), 'utf8')
const dossierSql = readFileSync(new URL('../supabase/migrations/202608120011_dossier_analytics.sql', import.meta.url), 'utf8')
const openingsTrendsSql = readFileSync(new URL('../supabase/migrations/202608120012_dossier_openings_trends.sql', import.meta.url), 'utf8')
const edgeFunction = readFileSync(new URL('../supabase/functions/sync-chess-account/index.ts', import.meta.url), 'utf8')
const required = [
  'alter table public.profiles enable row level security',
  'alter table public.chess_accounts enable row level security',
  'create unique index chess_accounts_profile_platform_username_unique',
  'lower(username)',
  'profiles_select_own', 'profiles_insert_own', 'profiles_update_own', 'profiles_delete_own',
  'accounts_select_own_profiles', 'accounts_insert_own_profiles', 'accounts_update_own_profiles', 'accounts_delete_own_profiles',
]
const missing = required.filter((item) => !sql.includes(item))
if (missing.length) throw new Error(`La migración no cumple los controles requeridos: ${missing.join(', ')}`)
const verificationFields = ['verification_status', 'verified_at', 'verification_error', 'rating_bullet', 'rating_blitz', 'rating_rapid', 'rating_classical', "'pending', 'verified', 'not_found', 'error'"]
const missingFields = verificationFields.filter((field) => !verificationSql.includes(field))
if (missingFields.length) throw new Error(`La migración de verificación no cumple los campos requeridos: ${missingFields.join(', ')}`)
const importRequirements = ['create table public.games', 'create table public.sync_runs', 'unique(account_id, platform, external_game_id)', 'games_select_own_profiles', 'sync_runs_select_own_profiles', 'grant select on table public.games to authenticated', 'grant select on table public.sync_runs to authenticated', 'grant execute on function public.get_profile_basic_stats(uuid) to authenticated']
const missingImport = importRequirements.filter((item) => !importSql.includes(item))
if (missingImport.length) throw new Error(`Import migration requirements missing: ${missingImport.join(', ')}`)
const resumableRequirements = ['add column lichess_backfill_until bigint', 'add column lichess_backfill_complete boolean not null default false', 'add column lichess_backfill_updated_at timestamptz', "sync_scope text not null default 'incremental'", "check (sync_scope in ('backfill', 'incremental'))", 'add column has_more boolean not null default false', 'add column backfill_complete boolean', 'games_account_played_at_desc_idx']
const missingResumable = resumableRequirements.filter((item) => !resumableBackfillSql.toLowerCase().includes(item))
if (missingResumable.length) throw new Error(`Resumable backfill migration requirements missing: ${missingResumable.join(', ')}`)
if (!reconciliationSql.includes("WHERE id = '92431cbd-067a-4045-a503-bc3a96f5ffe0'::uuid") || !reconciliationSql.includes("platform = 'lichess'")) throw new Error('Djmaykiss reconciliation migration must remain narrowly scoped.')
if (!variantRecoverySql.includes("WHERE id = '92431cbd-067a-4045-a503-bc3a96f5ffe0'::uuid") || !variantRecoverySql.includes("platform = 'lichess'")) throw new Error('Djmaykiss variant recovery migration must remain narrowly scoped.')
if (!functionRolloutRecoverySql.includes("WHERE id = '92431cbd-067a-4045-a503-bc3a96f5ffe0'::uuid") || !functionRolloutRecoverySql.includes("platform = 'lichess'")) throw new Error('Djmaykiss function rollout recovery migration must remain narrowly scoped.')
if (!timestampBoundaryRecoverySql.includes("WHERE id = '92431cbd-067a-4045-a503-bc3a96f5ffe0'::uuid") || !timestampBoundaryRecoverySql.includes("platform = 'lichess'")) throw new Error('Djmaykiss timestamp recovery migration must remain narrowly scoped.')
if (!edgeFunction.includes("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')") || edgeFunction.includes('VITE_SUPABASE_SERVICE_ROLE_KEY')) throw new Error('service_role guardrail failed.')
if (!edgeFunction.includes('x-client-info')) throw new Error('Edge Function CORS must allow the Supabase client header.')
const dossierRequirements = ['games_profile_color_result_played_at_analytics_idx', 'games_profile_platform_speed_analytics_idx', 'create or replace function public.get_profile_dossier_summary', 'security invoker', 'p_recent_limit integer default null', 'p_date_from timestamptz default null', 'p_recent_limit is not null and p_date_from is not null', "p_recent_limit not in (20, 50, 100)", 'auth.uid()', 'revoke all on function public.get_profile_dossier_summary(uuid, integer, timestamptz) from public, anon', 'grant execute on function public.get_profile_dossier_summary(uuid, integer, timestamptz) to authenticated']
const missingDossier = dossierRequirements.filter((item) => !dossierSql.includes(item))
if (missingDossier.length) throw new Error(`Dossier analytics migration requirements missing: ${missingDossier.join(', ')}`)
const openingsTrendsRequirements = ['games_profile_color_played_at_opening_analytics_idx', 'games_profile_speed_played_at_trend_analytics_idx', 'create or replace function public.get_profile_dossier_scoped_games', 'create or replace function public.get_profile_opening_stats', 'create or replace function public.get_profile_black_response_stats', 'create or replace function public.get_profile_dossier_trends', 'security invoker', "when 'e4' then '1.e4'", "when 'd4' then '1.d4'", "when 'c4' then '1.c4'", "when 'Nf3' then '1.Nf3'", "else 'Otros'", 'having count(*) >= 10', 'revoke all on function public.get_profile_opening_stats', 'grant execute on function public.get_profile_dossier_trends']
const missingOpeningsTrends = openingsTrendsRequirements.filter((item) => !openingsTrendsSql.includes(item))
if (missingOpeningsTrends.length) throw new Error(`Openings and trends migration requirements missing: ${missingOpeningsTrends.join(', ')}`)
console.log('Migration security guardrails passed.')
