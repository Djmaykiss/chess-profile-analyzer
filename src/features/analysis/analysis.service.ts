import { requireSupabase } from '../../services/supabase'
import { AnalysisRequest, AnalysisStatus } from './analysis.types'

function row<T>(data: T[] | null): T { return data?.[0] ?? ({} as T) }

export async function requestGameAnalysis(gameId: string, requestedDepth = 16): Promise<AnalysisRequest> {
  const { data, error } = await requireSupabase().rpc('request_game_analysis', { p_game_id: gameId, p_requested_depth: requestedDepth })
  if (error) throw error
  return row<AnalysisRequest>(data)
}

export async function cancelGameAnalysis(jobId: string): Promise<Pick<AnalysisStatus, 'job_id' | 'status'>> {
  const { data, error } = await requireSupabase().rpc('cancel_game_analysis', { p_job_id: jobId })
  if (error) throw error
  return row<Pick<AnalysisStatus, 'job_id' | 'status'>>(data)
}

export async function getGameAnalysisStatus(gameId: string): Promise<AnalysisStatus> {
  const { data, error } = await requireSupabase().rpc('get_game_analysis_status', { p_game_id: gameId })
  if (error) throw error
  return { job_id: null, status: 'not_requested', progress: 0, positions_done: 0, positions_total: null, error_message: null, analysis_id: null, reusable: false, ...row<Partial<AnalysisStatus>>(data) }
}
