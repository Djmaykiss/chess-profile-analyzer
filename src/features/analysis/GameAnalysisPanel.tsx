import { useEffect, useMemo, useState } from 'react'
import { useGameAnalysisStatus, usePersistedAnalysis } from './analysis.hooks'
import { AnalysisRequestButton } from './AnalysisRequestButton'
import { AnalysisStatus } from './AnalysisStatus'
import { AnalysisSummary } from './AnalysisSummary'
import { CriticalPositions } from './CriticalPositions'
import { MoveAnalysisDetail } from './MoveAnalysisDetail'
import { AnalysisFilter, MoveAnalysisList } from './MoveAnalysisList'
import { DownloadAnnotatedPgnButton } from './DownloadAnnotatedPgnButton'
import type { ChessGame } from '../../services/chess-import/games.service'

export function GameAnalysisPanel({ game }: { game: ChessGame }) {
  const gameId = game.id
  const { data: status, isLoading: statusLoading, error: statusError } = useGameAnalysisStatus(gameId)
  const { data, isLoading, error } = usePersistedAnalysis(status?.analysis_id)
  const [filter, setFilter] = useState<AnalysisFilter>('all')
  const [selectedPly, setSelectedPly] = useState<number | null>(null)
  const selected = useMemo(() => data?.evaluations.find(item => item.ply === selectedPly) ?? data?.evaluations[0] ?? null, [data, selectedPly])
  useEffect(() => { if (data?.evaluations.length && selectedPly === null) setSelectedPly(data.evaluations[0].ply) }, [data, selectedPly])

  if (statusLoading) return <section className="analysis-request"><p className="analysis-note">Cargando estado del análisis…</p></section>
  if (statusError) return <section className="analysis-request"><p className="form-error">No se pudo cargar el análisis persistido.</p></section>
  if (!status || status.status !== 'completed' || !status.analysis_id) return <AnalysisRequestButton gameId={gameId}/>
  if (isLoading) return <section className="analysis-request"><p className="analysis-note">Cargando evaluaciones persistidas…</p></section>
  if (error || !data) return <section className="analysis-request"><AnalysisStatus status={status}/><p className="form-error">No se pudieron cargar las evaluaciones del análisis.</p></section>

  return <div className="game-analysis"><div className="analysis-download"><DownloadAnnotatedPgnButton game={game} data={data}/><p className="analysis-note">Genera un PGN nuevo con comentarios, variantes verificadas y consejos basados en el análisis persistido. El PGN original no se modifica.</p></div><AnalysisSummary analysis={data.analysis} evaluations={data.evaluations}/><CriticalPositions evaluations={data.evaluations} onSelect={item => setSelectedPly(item.ply)}/><div className="analysis-workspace"><MoveAnalysisList evaluations={data.evaluations} selectedPly={selected?.ply ?? null} filter={filter} onFilter={setFilter} onSelect={item => setSelectedPly(item.ply)}/>{selected && <MoveAnalysisDetail evaluations={data.evaluations} selected={selected} onSelect={item => setSelectedPly(item.ply)}/>}</div></div>
}
