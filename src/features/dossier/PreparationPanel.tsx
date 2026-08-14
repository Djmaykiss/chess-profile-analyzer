import { ProfileScouting, ScoutingEvidence } from './dossier.types'
const Sentence = ({ row, kind }: { row: ScoutingEvidence; kind: string }) => <li key={`${kind}-${row.move_sequence ?? row.opening}`}><strong>{kind}:</strong> {row.move_sequence ?? `${row.eco ?? '—'} · ${row.opening ?? 'Sin nombre'}`} aparece en {row.games} partidas ({row.win_rate}% victorias; {row.confidence}).</li>
export function PreparationPanel({ scouting, isRival }: { scouting?: ProfileScouting; isRival: boolean }) {
  if (!isRival || !scouting) return null
  return <section className="card"><p className="eyebrow">PREPARACIÓN ESTADÍSTICA</p><h2>Qué preparar contra este rival</h2><ul className="preparation-list">{scouting.white_first_moves.slice(0, 2).map(row => <Sentence key={`w-${row.move_sequence}`} row={row} kind="Con blancas"/>)}{scouting.black_responses.slice(0, 2).map(row => <Sentence key={`b-${row.move_sequence}`} row={row} kind="Con negras"/>)}{scouting.worst_openings.slice(0, 2).map(row => <Sentence key={`o-${row.opening}`} row={row} kind="Apertura con resultado bajo"/>)}</ul></section>
}
