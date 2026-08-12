import { readFileSync } from 'node:fs'

const sql = readFileSync(new URL('../supabase/migrations/202608120001_initial_auth_profiles_accounts.sql', import.meta.url), 'utf8')
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
console.log('Migration security guardrails passed.')
