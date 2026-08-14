import { useState } from 'react'
import { DossierRange, DossierSort, OpeningStat } from './dossier.types'
import { percent, resultLabel } from './dossier-formatters'
import { useProfileOpeningStats } from './dossier.hooks'

const sortOptions: Array<{ value: DossierSort; label: string }> = [{ value: 'frequency', label: 'Más jugadas' }, { value: 'best', label: 'Mejor resultado' }, { value: 'worst', label: 'Peor resultado' }]

export function OpeningStats({ profileId, range, color }: { profileId: string; range: DossierRange; color: 'white' | 'black' }) {
  const [sort, setSort] = useState<DossierSort>('frequency')
  const { data = [], isLoading, error } = useProfileOpeningStats(profileId, color, range, sort)
  const title = color === 'white' ? 'Aperturas con blancas' : 'Aperturas con negras'
  return <section className="card dossier-section"><div className="card-title"><div><p className="eyebrow">APERTURAS REALES</p><h2>{title}</h2></div><label className="dossier-sort">Orden<select value={sort} onChange={event => setSort(event.target.value as DossierSort)}>{sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div>{isLoading ? <p className="subtle-copy">Calculando aperturas…</p> : error ? <p className="form-error">No pudimos cargar las aperturas.</p> : <OpeningRows rows={data}/>}</section>
}

function OpeningRows({ rows }: { rows: OpeningStat[] }) { return rows.length ? <div className="opening-table"><div className="opening-head"><span>Apertura</span><span>Partidas</span><span>V/T/D</span><span>Win rate</span></div>{rows.map(row => <div className="opening-row" key={`${row.eco}-${row.opening}`}><span><b>{row.eco || '—'}</b><small>{row.opening || 'Sin nombre'}</small></span><span>{row.games}</span><span>{resultLabel(row)}</span><span>{percent(row)}%</span></div>)}</div> : <p className="subtle-copy">No hay aperturas con datos reales en este rango.</p> }
