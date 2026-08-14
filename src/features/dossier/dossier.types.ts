import { Profile } from '../../services/profiles.service'

export type DossierRange =
  | { kind: 'all' }
  | { kind: 'recent'; recentLimit: 20 | 50 | 100 }
  | { kind: 'time'; dateFrom: string; label: '3 meses' | '6 meses' | '1 año' }

export type DossierRecord = { total_games: number; wins: number; draws: number; losses: number }
export type DossierBreakdown = DossierRecord & { platform?: string; speed?: string }
export type DossierSummary = DossierRecord & {
  win_rate: number
  white: DossierRecord
  black: DossierRecord
  platforms: DossierBreakdown[]
  speeds: DossierBreakdown[]
}

export type DossierPageProps = { profiles: Profile[]; activeProfile: Profile | null; onSelectProfile: (profileId: string) => void }
