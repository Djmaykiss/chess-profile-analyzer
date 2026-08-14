import { useQuery } from '@tanstack/react-query'
import { isSupabaseConfigured } from '../../services/supabase'
import { getProfileDossierSummary } from './dossier.service'
import { DossierRange } from './dossier.types'

export const useProfileDossierSummary = (profileId: string | undefined, range: DossierRange) => useQuery({ queryKey: ['profile-dossier-summary', profileId, range], queryFn: () => getProfileDossierSummary(profileId!, range), enabled: Boolean(profileId && isSupabaseConfigured) })
