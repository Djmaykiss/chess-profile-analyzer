import { createClient } from '@supabase/supabase-js'
import { WorkerConfig } from './config.js'

export const createAdmin = (config: WorkerConfig) => createClient(config.supabaseUrl, config.serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
export type ClaimedJob = { id: string; profile_id: string; game_id: string; requested_depth: number; engine: string; engine_version: string | null; analysis_config_hash: string; attempt_count: number }
export type StoredGame = { id: string; profile_id: string; pgn: string }
