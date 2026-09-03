export type AnalysisJobStatus = 'not_requested' | 'queued' | 'running' | 'completed' | 'failed' | 'cancel_requested' | 'cancelled'

export type AnalysisRequest = { job_id: string | null; status: AnalysisJobStatus; reusable: boolean; analysis_id: string | null }

export type AnalysisStatus = { job_id: string | null; status: AnalysisJobStatus; progress: number; positions_done: number; positions_total: number | null; error_message: string | null; analysis_id: string | null; reusable: boolean }

export type AnalysisRecord = {
  id: string
  engine: string
  engine_version: string | null
  depth: number
  analyzed_at: string
  accuracy_white: number | null
  accuracy_black: number | null
  accuracy_formula_version: string | null
  classification_version: string | null
  summary: Record<string, unknown>
}

export type ScoreType = 'cp' | 'mate'
export type MoveClassification = 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'forced' | null

export type GameEvaluation = {
  id: string
  analysis_id: string
  ply: number
  fen: string
  played_move_san: string
  played_move_uci: string
  best_move_san: string | null
  best_move_uci: string | null
  score_type: ScoreType
  eval_before: number | null
  eval_after: number | null
  eval_loss: number | null
  mate_before: number | null
  mate_after: number | null
  classification: MoveClassification
  principal_variation: string | null
  depth: number
  nodes: number | null
  elapsed_ms: number | null
}

export type PersistedAnalysis = { analysis: AnalysisRecord; evaluations: GameEvaluation[] }
