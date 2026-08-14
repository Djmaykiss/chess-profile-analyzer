import { requireSupabase } from '../../services/supabase'
import { normalizeDossier, normalizeTrends } from './dossier-formatters'
import { BlackResponseStat, DossierRange, DossierSort, DossierSummary, DossierTrends, OpeningStat, RepertoireBuildResult, RepertoireIndexJob, RepertoireNode } from './dossier.types'

export async function getProfileDossierSummary(profileId: string, range: DossierRange): Promise<DossierSummary> {
  const { data, error } = await requireSupabase().rpc('get_profile_dossier_summary', {
    target_profile_id: profileId,
    p_recent_limit: range.kind === 'recent' ? range.recentLimit : null,
    p_date_from: range.kind === 'time' ? range.dateFrom : null,
  })
  if (error) throw error
  return normalizeDossier(data)
}

const rangeParams = (range: DossierRange) => ({ p_recent_limit: range.kind === 'recent' ? range.recentLimit : null, p_date_from: range.kind === 'time' ? range.dateFrom : null })
const numericStats = <T extends Record<string, unknown>>(rows: T[] | null) => (rows ?? []).map(row => ({ ...row, games: Number(row.games ?? 0), total_games: Number(row.games ?? 0), wins: Number(row.wins ?? 0), draws: Number(row.draws ?? 0), losses: Number(row.losses ?? 0), win_rate: Number(row.win_rate ?? 0), sample_size: Number(row.sample_size ?? 0) }))

export async function getProfileOpeningStats(profileId: string, color: 'white' | 'black', range: DossierRange, sort: DossierSort): Promise<OpeningStat[]> {
  const { data, error } = await requireSupabase().rpc('get_profile_opening_stats', { target_profile_id: profileId, p_color: color, p_limit: 20, p_sort: sort, ...rangeParams(range) })
  if (error) throw error
  return numericStats(data) as OpeningStat[]
}

export async function getProfileBlackResponses(profileId: string, range: DossierRange, sort: DossierSort): Promise<BlackResponseStat[]> {
  const { data, error } = await requireSupabase().rpc('get_profile_black_response_stats', { target_profile_id: profileId, p_limit: 10, p_sort: sort, ...rangeParams(range) })
  if (error) throw error
  return numericStats(data) as BlackResponseStat[]
}

export async function getProfileDossierTrends(profileId: string, range: DossierRange): Promise<DossierTrends> {
  const { data, error } = await requireSupabase().rpc('get_profile_dossier_trends', { target_profile_id: profileId, ...rangeParams(range) })
  if (error) throw error
  return normalizeTrends(data)
}

export async function getProfileRepertoireTree(profileId: string, playerColor: 'white' | 'black', range: DossierRange, maxPly: number, minGames: number): Promise<RepertoireNode[]> {
  const { data, error } = await requireSupabase().rpc('get_profile_repertoire_tree', { target_profile_id: profileId, p_player_color: playerColor, p_max_ply: maxPly, p_min_games: minGames, ...rangeParams(range) })
  if (error) throw error
  return numericStats(data).map(row => ({ ...row, move_sequence: String(row.move_sequence), san: String(row.san), ply: Number(row.ply), percentage: Number(row.percentage ?? 0) })) as RepertoireNode[]
}

export async function buildProfileRepertoireIndex(profileId: string): Promise<RepertoireBuildResult> {
  const client = requireSupabase(); const { data: { session } } = await client.auth.getSession()
  if (!session) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.')
  const { data, error } = await client.functions.invoke('build-repertoire-index', { body: { profileId }, headers: { Authorization: `Bearer ${session.access_token}` } })
  if (error || !data) throw new Error('No se pudo preparar el repertorio.')
  return data as RepertoireBuildResult
}

export async function getRepertoireIndexJob(profileId: string): Promise<RepertoireIndexJob | null> {
  const { data, error } = await requireSupabase().from('repertoire_index_jobs').select('status, processed_games, indexed_moves, last_game_id, error_message').eq('profile_id', profileId).maybeSingle()
  if (error) throw error
  if (!data) return null
  return { status: data.status as RepertoireIndexJob['status'], processedGames: Number(data.processed_games ?? 0), indexedMoves: Number(data.indexed_moves ?? 0), lastGameId: data.last_game_id, errorMessage: data.error_message }
}
