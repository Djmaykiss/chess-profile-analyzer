import { requireSupabase } from '../../services/supabase'
import { normalizeDossier } from './dossier-formatters'
import { DossierRange, DossierSummary } from './dossier.types'

export async function getProfileDossierSummary(profileId: string, range: DossierRange): Promise<DossierSummary> {
  const { data, error } = await requireSupabase().rpc('get_profile_dossier_summary', {
    target_profile_id: profileId,
    p_recent_limit: range.kind === 'recent' ? range.recentLimit : null,
    p_date_from: range.kind === 'time' ? range.dateFrom : null,
  })
  if (error) throw error
  return normalizeDossier(data)
}
