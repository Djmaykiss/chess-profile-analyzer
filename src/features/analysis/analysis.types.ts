export type AnalysisJobStatus = 'not_requested' | 'queued' | 'running' | 'completed' | 'failed' | 'cancel_requested' | 'cancelled'

export type AnalysisRequest = { job_id: string | null; status: AnalysisJobStatus; reusable: boolean; analysis_id: string | null }

export type AnalysisStatus = { job_id: string | null; status: AnalysisJobStatus; progress: number; positions_done: number; positions_total: number | null; error_message: string | null; analysis_id: string | null; reusable: boolean }
