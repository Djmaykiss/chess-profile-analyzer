import { useState } from 'react'
import { DossierRange, DossierSort } from './dossier.types'
import { percent, resultLabel } from './dossier-formatters'
import { useProfileBlackResponses } from './dossier.hooks'

export function BlackResponses({ profileId, range }: { profileId: string; range: DossierRange }) {
  const [sort, setSort] = useState<DossierSort>('frequency')
  const { data = [], isLoading, error } = useProfileBlackResponses(profileId, range, sort)
  return <section className="card dossier-section"><div className="card-title"><div><p className="eyebrow">CON NEGRAS</p><h2>Respuestas a la primera jugada rival</h2></div><label className="dossier-sort">Orden<select value={sort} onChange={event => setSort(event.target.value as DossierSort)}><option value="frequency">Más jugadas</option><option value="best">Mejor resultado</option><option value="worst">Peor resultado</option></select></label></div>{isLoading ? <p className="subtle-copy">Leyendo primeras jugadas desde PGN…</p> : error ? <p className="form-error">No pudimos cargar las respuestas con negras.</p> : data.length ? <div className="response-list">{data.map(row => <div key={row.first_move}><strong>{row.first_move}</strong><span>{row.games} partidas</span><small>{resultLabel(row)} · {percent(row)}% victorias</small></div>)}</div> : <p className="subtle-copy">No hay partidas con negras en este rango.</p>}</section>
}
