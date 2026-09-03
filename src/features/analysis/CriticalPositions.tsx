import { GameEvaluation } from './analysis.types'
import { formatLoss, moveNumber } from './analysis-formatters'

export function CriticalPositions({ evaluations, onSelect }: { evaluations: GameEvaluation[]; onSelect: (item: GameEvaluation) => void }) {
  const critical = evaluations.filter(item => ['blunder', 'mistake', 'inaccuracy'].includes(item.classification ?? '')).sort((a, b) => (b.eval_loss ?? -1) - (a.eval_loss ?? -1)).slice(0, 8)
  if (!critical.length) return null
  return <section className="analysis-panel"><p className="eyebrow">POSICIONES CRÍTICAS</p><h3>Mayores pérdidas de evaluación</h3><p className="analysis-note">Priorizadas por pérdida de evaluación; no infieren una causa táctica.</p><div className="critical-list">{critical.map(item => <button type="button" onClick={() => onSelect(item)} key={item.id}><span>{moveNumber(item.ply)} {item.played_move_san}</span><b className={item.classification ?? ''}>{item.classification}</b><strong>{formatLoss(item.eval_loss)}</strong><small>Mejor: {item.best_move_san ?? '—'}{item.principal_variation ? ` · ${item.principal_variation}` : ''}</small></button>)}</div></section>
}
