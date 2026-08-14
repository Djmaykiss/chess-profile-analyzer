import { DossierRange, TrendItem } from './dossier.types'
import { trendLabel } from './dossier-formatters'
import { useProfileDossierTrends } from './dossier.hooks'

function Trend({ title, item }: { title: string; item: TrendItem | null }) { return <div className="trend-item"><span>{title}</span><strong>{trendLabel(item)}</strong>{item ? <small>{item.games} partidas · {item.win_rate}% victorias</small> : <small>Se requieren al menos 10 partidas.</small>}</div> }

export function TrendsPanel({ profileId, range }: { profileId: string; range: DossierRange }) {
  const { data, isLoading, error } = useProfileDossierTrends(profileId, range)
  return <section className="card dossier-section trends-panel"><p className="eyebrow">TENDENCIAS CON MUESTRA MÍNIMA</p><h2>Lo que muestran las partidas</h2>{isLoading ? <p className="subtle-copy">Calculando tendencias…</p> : error || !data ? <p className="form-error">No pudimos cargar las tendencias.</p> : <><p className="subtle-copy">Las aperturas destacadas requieren al menos {data.sample_threshold} partidas; no son conclusiones absolutas.</p><div className="trends-grid"><Trend title="Apertura más frecuente" item={data.favorite_opening}/><Trend title="Mejor apertura" item={data.best_opening}/><Trend title="Peor apertura" item={data.worst_opening}/><Trend title="Color más fuerte" item={data.best_color}/><Trend title="Color más débil" item={data.worst_color}/><Trend title="Ritmo más fuerte" item={data.best_speed}/><Trend title="Ritmo más débil" item={data.worst_speed}/></div><p className="trend-comparison">Rango actual: {data.range_vs_history.range_games} partidas · {data.range_vs_history.range_win_rate}% victorias. Historial: {data.range_vs_history.all_games} partidas · {data.range_vs_history.all_win_rate}% ({data.range_vs_history.win_rate_delta >= 0 ? '+' : ''}{data.range_vs_history.win_rate_delta} pp).</p></>}</section>
}
