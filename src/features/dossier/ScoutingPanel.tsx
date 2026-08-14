import { DossierRange, ProfileScouting, ScoutingEvidence } from './dossier.types'
import { useProfileScouting } from './dossier.hooks'

const EvidenceList = ({ title, rows }: { title: string; rows: ScoutingEvidence[] }) => <div className="scouting-block"><h3>{title}</h3>{rows.length ? <ul>{rows.slice(0, 5).map((row, index) => <li key={`${row.move_sequence ?? row.opening ?? row.label}-${index}`}><strong>{row.move_sequence ?? row.san ?? `${row.eco ?? '—'} · ${row.opening ?? row.label ?? 'Sin nombre'}`}</strong><span>{row.games} partidas · {row.wins}V/{row.draws}T/{row.losses}D · {row.win_rate}% · {row.confidence}</span></li>)}</ul> : <p className="subtle-copy">Muestra insuficiente.</p>}</div>

export function ScoutingPanel({ profileId, range, rival }: { profileId: string; range: DossierRange; rival: boolean }) {
  const { data, isLoading, error } = useProfileScouting(profileId, range)
  if (isLoading) return <section className="card"><p className="subtle-copy">Construyendo scouting estadístico…</p></section>
  if (error || !data) return <section className="card"><h2>Scouting</h2><p className="subtle-copy">No hay evidencia disponible para este rango.</p></section>
  return <section className="card scouting-panel"><p className="eyebrow">{rival ? 'CÓMO JUEGA ESTE JUGADOR' : 'SCOUTING ESTADÍSTICO'}</p><h2>{rival ? 'Cómo juega este jugador' : 'Patrones basados en evidencia'}</h2><p className="subtle-copy">Las etiquetas reflejan tamaño de muestra; no son evaluación de engine.</p><div className="dossier-grid scouting-grid"><EvidenceList title="Con blancas" rows={data.white_first_moves}/><EvidenceList title="Con negras" rows={data.black_responses}/><EvidenceList title="Aperturas frecuentes" rows={data.favorite_openings}/><EvidenceList title="Líneas recurrentes" rows={data.recurrent_lines}/><EvidenceList title="Fortalezas estadísticas" rows={[...data.best_openings, ...data.best_lines]}/><EvidenceList title="Resultados a vigilar" rows={[...data.worst_openings, ...data.worst_lines]}/></div></section>
}
