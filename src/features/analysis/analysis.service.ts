import { requireSupabase } from '../../services/supabase'
import { AnalysisRecord, AnalysisRequest, AnalysisStatus, GameEvaluation, PersistedAnalysis } from './analysis.types'

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

export async function getPersistedAnalysis(analysisId: string): Promise<PersistedAnalysis> {
  const client = requireSupabase()
  const [{ data: analysis, error: analysisError }, { data: evaluations, error: evaluationsError }] = await Promise.all([
    client.from('game_analysis').select('id, engine, engine_version, depth, analyzed_at, accuracy_white, accuracy_black, accuracy_formula_version, classification_version, summary').eq('id', analysisId).maybeSingle(),
    client.from('game_evaluations').select('id, analysis_id, ply, fen, played_move_san, played_move_uci, best_move_san, best_move_uci, score_type, eval_before, eval_after, eval_loss, mate_before, mate_after, classification, principal_variation, depth, nodes, elapsed_ms').eq('analysis_id', analysisId).order('ply'),
  ])
  if (analysisError) throw analysisError
  if (evaluationsError) throw evaluationsError
  if (!analysis) throw new Error('El análisis no está disponible.')
  return { analysis: analysis as AnalysisRecord, evaluations: (evaluations ?? []) as GameEvaluation[] }
}
