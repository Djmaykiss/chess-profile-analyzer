import { useQuery } from '@tanstack/react-query'
import { isSupabaseConfigured } from '../../services/supabase'
import { getProfileBlackResponses, getProfileDossierSummary, getProfileDossierTrends, getProfileOpeningStats } from './dossier.service'
import { DossierRange, DossierSort } from './dossier.types'

export const useProfileDossierSummary = (profileId: string | undefined, range: DossierRange) => useQuery({ queryKey: ['profile-dossier-summary', profileId, range], queryFn: () => getProfileDossierSummary(profileId!, range), enabled: Boolean(profileId && isSupabaseConfigured) })
export const useProfileOpeningStats = (profileId: string | undefined, color: 'white' | 'black', range: DossierRange, sort: DossierSort) => useQuery({ queryKey: ['profile-opening-stats', profileId, color, range, sort], queryFn: () => getProfileOpeningStats(profileId!, color, range, sort), enabled: Boolean(profileId && isSupabaseConfigured) })
export const useProfileBlackResponses = (profileId: string | undefined, range: DossierRange, sort: DossierSort) => useQuery({ queryKey: ['profile-black-responses', profileId, range, sort], queryFn: () => getProfileBlackResponses(profileId!, range, sort), enabled: Boolean(profileId && isSupabaseConfigured) })
export const useProfileDossierTrends = (profileId: string | undefined, range: DossierRange) => useQuery({ queryKey: ['profile-dossier-trends', profileId, range], queryFn: () => getProfileDossierTrends(profileId!, range), enabled: Boolean(profileId && isSupabaseConfigured) })
