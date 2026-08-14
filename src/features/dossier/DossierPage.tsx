import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { DossierPageProps } from './dossier.types'
import { DossierSummary } from './DossierSummary'
import { RecentRangePicker } from './RecentRangePicker'
import { rangeFromValue } from './dossier-formatters'
import { useProfileDossierSummary, useProfileScouting } from './dossier.hooks'
import { OpeningStats } from './OpeningStats'
import { BlackResponses } from './BlackResponses'
import { TrendsPanel } from './TrendsPanel'
import { RepertoireTree } from './RepertoireTree'
import { ScoutingPanel } from './ScoutingPanel'
import { ProfileComparison } from './ProfileComparison'
import { PreparationPanel } from './PreparationPanel'

export function DossierPage({ profiles, activeProfile, onSelectProfile }: DossierPageProps) {
  const [rangeValue, setRangeValue] = useState('all')
  const [comparisonId, setComparisonId] = useState('')
  const range = rangeFromValue(rangeValue)
  const { data, isLoading, error } = useProfileDossierSummary(activeProfile?.id, range)
  const { data: scouting } = useProfileScouting(activeProfile?.id, range)
  if (!profiles.length) return <section className="page empty"><BarChart3 size={30}/><h2>Primero crea un perfil</h2><p>El dossier analiza únicamente partidas reales de tus perfiles.</p></section>
  const errorCode = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  const comparableId = comparisonId || profiles.find(profile => profile.id !== activeProfile?.id)?.id || ''
  return <section className="page"><div className="hero dossier-hero"><div><p className="eyebrow">FASE 3C.4</p><h1>Dossier del jugador</h1><p>Resumen, aperturas, tendencias, repertorio y scouting basados exclusivamente en partidas reales importadas.</p></div><div className="dossier-controls"><label className="dossier-picker">Perfil<select value={activeProfile?.id ?? ''} onChange={event => onSelectProfile(event.target.value)}>{profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.display_name}</option>)}</select></label><RecentRangePicker value={rangeValue} onChange={setRangeValue}/></div></div>{isLoading ? <section className="page loading"><span className="loader"/>Calculando el dossier…</section> : error ? <section className="empty"><h2>No pudimos cargar el dossier.</h2><p>{errorCode === '42501' ? 'No tienes acceso a este perfil.' : 'Inténtalo de nuevo.'}</p></section> : data?.total_games && activeProfile ? <><DossierSummary summary={data}/><div className="dossier-grid dossier-opening-grid"><OpeningStats profileId={activeProfile.id} range={range} color="white"/><OpeningStats profileId={activeProfile.id} range={range} color="black"/></div><div className="dossier-grid dossier-opening-grid"><BlackResponses profileId={activeProfile.id} range={range}/><TrendsPanel profileId={activeProfile.id} range={range}/></div><RepertoireTree profileId={activeProfile.id} range={range}/><ScoutingPanel profileId={activeProfile.id} range={range} rival={activeProfile.profile_type === 'rival'}/><PreparationPanel scouting={scouting} isRival={activeProfile.profile_type === 'rival'}/><ProfileComparison leftProfileId={activeProfile.id} rightId={comparableId} profiles={profiles} range={range} onSelect={setComparisonId}/></> : <section className="empty"><BarChart3 size={30}/><h2>Aún no hay partidas para analizar</h2><p>Este perfil no tiene partidas reales dentro del rango seleccionado.</p></section>}</section>
}
