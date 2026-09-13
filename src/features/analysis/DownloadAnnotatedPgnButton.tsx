import { Download } from 'lucide-react'
import type { ChessGame } from '../../services/chess-import/games.service'
import { annotatedPgnFilename, buildAnnotatedPgn, downloadAnnotatedPgn } from './annotated-pgn'
import type { PersistedAnalysis } from './analysis.types'

export function DownloadAnnotatedPgnButton({ game, data }: { game: ChessGame; data: PersistedAnalysis }) {
  const download = () => downloadAnnotatedPgn(annotatedPgnFilename(game), buildAnnotatedPgn(game, data.analysis, data.evaluations))
  return <button type="button" className="secondary compact" onClick={download}><Download size={16}/>Descargar PGN analizado</button>
}
