export type WorkerConfig = { supabaseUrl: string; serviceRoleKey: string; stockfishPath: string; depth: number; movetimeMs?: number; pollIntervalMs: number; workerId: string; runOnce: boolean }
const required = (name: string) => { const value = process.env[name]; if (!value) throw new Error(`Missing required worker environment variable: ${name}`); return value }
const integer = (name: string, fallback: number) => { const value = Number(process.env[name] ?? fallback); if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`); return value }
export const loadConfig = (): WorkerConfig => {
  const depth = integer('ANALYSIS_DEPTH', 16); if (depth < 8 || depth > 30) throw new Error('ANALYSIS_DEPTH must be between 8 and 30')
  const movetime = process.env.ANALYSIS_MOVETIME_MS ? integer('ANALYSIS_MOVETIME_MS', 1) : undefined
  return { supabaseUrl: required('SUPABASE_URL'), serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'), stockfishPath: process.env.STOCKFISH_PATH ?? 'stockfish', depth, movetimeMs: movetime, pollIntervalMs: integer('WORKER_POLL_INTERVAL_MS', 3000), workerId: process.env.WORKER_ID ?? 'stockfish-worker-1', runOnce: process.env.WORKER_RUN_ONCE !== 'false' }
}
