import { DossierRange } from './dossier.types'
import { Profile } from '../../services/profiles.service'
import { useProfileComparison } from './dossier.hooks'
import { HeadToHead } from './HeadToHead'

export function ProfileComparison({ leftProfileId, rightId, profiles, range, onSelect }: { leftProfileId: string; rightId: string; profiles: Profile[]; range: DossierRange; onSelect: (value: string) => void }) {
  const { data, isLoading, error } = useProfileComparison(leftProfileId, rightId, range)
  if (!rightId) return null
  return <section className="card"><p className="eyebrow">COMPARACIÓN</p><div className="comparison-heading"><h2>Comparar perfiles</h2><select value={rightId} onChange={event => onSelect(event.target.value)}>{profiles.filter(profile => profile.id !== leftProfileId).map(profile => <option key={profile.id} value={profile.id}>{profile.display_name}</option>)}</select></div>{isLoading ? <p className="subtle-copy">Comparando datos reales…</p> : error || !data ? <p className="subtle-copy">No se pudo cargar la comparación.</p> : <><div className="comparison-grid"><ComparisonSide title="Perfil activo" data={data.left.summary}/><ComparisonSide title="Comparado" data={data.right.summary}/></div><HeadToHead data={data.head_to_head}/></>}</section>
}
function ComparisonSide({ title, data }: { title: string; data: { total_games: number; wins: number; draws: number; losses: number; win_rate: number } }) { return <div className="scouting-block"><h3>{title}</h3><strong>{data.total_games} partidas</strong><span>{data.wins}V / {data.draws}T / {data.losses}D · {data.win_rate}%</span></div> }
