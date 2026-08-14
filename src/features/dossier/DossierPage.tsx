import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { DossierPageProps } from './dossier.types'
import { DossierSummary } from './DossierSummary'
import { RecentRangePicker } from './RecentRangePicker'
import { rangeFromValue } from './dossier-formatters'
import { useProfileDossierSummary } from './dossier.hooks'
import { OpeningStats } from './OpeningStats'
import { BlackResponses } from './BlackResponses'
import { TrendsPanel } from './TrendsPanel'
import { RepertoireTree } from './RepertoireTree'

export function DossierPage({ profiles, activeProfile, onSelectProfile }: DossierPageProps) {
  const [rangeValue, setRangeValue] = useState('all')
  const range = rangeFromValue(rangeValue)
  const { data, isLoading, error } = useProfileDossierSummary(activeProfile?.id, range)
  if (!profiles.length) return <section className="page empty"><BarChart3 size={30}/><h2>Primero crea un perfil</h2><p>El dossier analiza únicamente partidas reales de tus perfiles.</p></section>
  const errorCode = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  return <section className="page"><div className="hero dossier-hero"><div><p className="eyebrow">FASE 3C.3</p><h1>Dossier del jugador</h1><p>Resumen, aperturas, tendencias y repertorio basados exclusivamente en partidas reales importadas.</p></div><div className="dossier-controls"><label className="dossier-picker">Perfil<select value={activeProfile?.id ?? ''} onChange={event => onSelectProfile(event.target.value)}>{profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.display_name}</option>)}</select></label><RecentRangePicker value={rangeValue} onChange={setRangeValue}/></div></div>{isLoading ? <section className="page loading"><span className="loader"/>Calculando el dossier…</section> : error ? <section className="empty"><h2>No pudimos cargar el dossier.</h2><p>{errorCode === '42501' ? 'No tienes acceso a este perfil.' : 'Inténtalo de nuevo.'}</p></section> : data?.total_games && activeProfile ? <><DossierSummary summary={data}/><div className="dossier-grid dossier-opening-grid"><OpeningStats profileId={activeProfile.id} range={range} color="white"/><OpeningStats profileId={activeProfile.id} range={range} color="black"/></div><div className="dossier-grid dossier-opening-grid"><BlackResponses profileId={activeProfile.id} range={range}/><TrendsPanel profileId={activeProfile.id} range={range}/></div><RepertoireTree profileId={activeProfile.id} range={range}/></> : <section className="empty"><BarChart3 size={30}/><h2>Aún no hay partidas para analizar</h2><p>Este perfil no tiene partidas reales dentro del rango seleccionado.</p></section>}</section>
}
