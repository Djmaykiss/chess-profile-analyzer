import { AnalysisStatus as Status } from './analysis.types'

const labels: Record<Status['status'], string> = { not_requested: 'Sin solicitar', queued: 'En cola', running: 'En análisis', completed: 'Análisis disponible', failed: 'No se pudo analizar', cancel_requested: 'Cancelación solicitada', cancelled: 'Cancelado' }

export function AnalysisStatus({ status }: { status?: Status }) {
  if (!status || status.status === 'not_requested') return <p className="analysis-note">El motor de análisis aún no está conectado.</p>
  return <div className="analysis-status"><strong>{labels[status.status]}</strong>{status.reusable && <span>Resultado reutilizable disponible.</span>}{status.status === 'queued' && <span>El motor de análisis aún no está conectado.</span>}{status.status === 'running' && <span>{status.positions_total ? `${status.positions_done}/${status.positions_total} posiciones` : `${status.progress}%`}</span>}{status.error_message && <span className="form-error">{status.error_message}</span>}</div>
}
