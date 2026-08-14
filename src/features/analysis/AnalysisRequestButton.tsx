import { useCancelGameAnalysis, useGameAnalysisStatus, useRequestGameAnalysis } from './analysis.hooks'
import { AnalysisStatus } from './AnalysisStatus'

export function AnalysisRequestButton({ gameId }: { gameId: string }) {
  const { data: status, error } = useGameAnalysisStatus(gameId)
  const request = useRequestGameAnalysis(gameId)
  const cancel = useCancelGameAnalysis(gameId)
  const canCancel = Boolean(status?.job_id && (status.status === 'queued' || status.status === 'running' || status.status === 'cancel_requested'))
  const message = error || request.error || cancel.error
  return <section className="analysis-request"><p className="eyebrow">ANÁLISIS PROFUNDO</p><h3>Stockfish</h3><AnalysisStatus status={status}/><div className="card-actions">{canCancel ? <button className="secondary" disabled={cancel.isPending || status?.status === 'cancel_requested'} onClick={() => status?.job_id && cancel.mutate(status.job_id)}>{status?.status === 'cancel_requested' ? 'Cancelación solicitada' : 'Cancelar análisis'}</button> : <button className="secondary" disabled={request.isPending || status?.status === 'completed'} onClick={() => request.mutate()}>{request.isPending ? 'Solicitando…' : status?.status === 'completed' ? 'Análisis disponible' : 'Analizar con Stockfish'}</button>}</div>{message && <p className="form-error">No se pudo actualizar la solicitud de análisis.</p>}</section>
}
