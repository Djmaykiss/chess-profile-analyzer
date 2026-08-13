import { requireSupabase } from '../supabase'

export type SyncRun = { id: string; profile_id: string; account_id: string | null; status: 'pending' | 'running' | 'completed' | 'failed'; started_at: string; finished_at: string | null; games_found: number; games_imported: number; games_skipped: number; games_failed: number; error_message: string | null }
export type SyncResult = { runId: string; found: number; imported: number; skipped?: number }
const safeMessages = new Set(['Sesión inválida.', 'La cuenta no pertenece al perfil.', 'Error al guardar sincronización.', 'Error al consultar Lichess.', 'Error interno de sincronización.'])

export async function syncChessAccount(profileId: string, accountId: string): Promise<SyncResult> {
  const client = requireSupabase()
  const { data: { session } } = await client.auth.getSession()
  if (!session) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.')
  const { data, error } = await client.functions.invoke('sync-chess-account', { body: { profileId, accountId }, headers: { Authorization: `Bearer ${session.access_token}` } })
  if (error) { const response = (error as { context?: unknown }).context; if (response instanceof Response) { const body = await response.json().catch(() => null) as { error?: string } | null; if (body?.error && safeMessages.has(body.error)) throw new Error(body.error) }; throw new Error('No se pudo iniciar la sincronización. Revisa tu conexión e inténtalo de nuevo.') }
  if (!data?.runId) throw new Error('La sincronización no devolvió un resultado válido.')
  return data as SyncResult
}

export async function listSyncRuns(profileId: string): Promise<SyncRun[]> {
  const { data, error } = await requireSupabase().from('sync_runs').select('*').eq('profile_id', profileId).order('started_at', { ascending: false }).limit(12)
  if (error) throw error
  return (data ?? []) as SyncRun[]
}
