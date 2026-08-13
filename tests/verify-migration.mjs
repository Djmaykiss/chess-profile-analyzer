import { readFileSync } from 'node:fs'

const sql = readFileSync(new URL('../supabase/migrations/202608120001_initial_auth_profiles_accounts.sql', import.meta.url), 'utf8')
const verificationSql = readFileSync(new URL('../supabase/migrations/202608120002_chess_account_verification.sql', import.meta.url), 'utf8')
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
console.log('Migration security guardrails passed.')
