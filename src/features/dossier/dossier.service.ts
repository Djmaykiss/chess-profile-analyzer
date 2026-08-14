import { requireSupabase } from '../../services/supabase'
import { normalizeDossier, normalizeTrends } from './dossier-formatters'
import { BlackResponseStat, DossierRange, DossierSort, DossierSummary, DossierTrends, OpeningStat } from './dossier.types'

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
