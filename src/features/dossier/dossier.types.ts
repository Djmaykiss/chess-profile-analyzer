import { Profile } from '../../services/profiles.service'

export type DossierRange =
  | { kind: 'all' }
  | { kind: 'recent'; recentLimit: 20 | 50 | 100 }
  | { kind: 'time'; dateFrom: string; label: '3 meses' | '6 meses' | '1 año' }

export type DossierRecord = { total_games: number; wins: number; draws: number; losses: number }
export type DossierBreakdown = DossierRecord & { platform?: string; speed?: string }
export type DossierSort = 'frequency' | 'best' | 'worst'
export type OpeningStat = DossierRecord & { eco: string; opening: string; games: number; sample_size: number; win_rate: number }
export type BlackResponseStat = DossierRecord & { first_move: string; games: number; sample_size: number; win_rate: number }
export type TrendItem = DossierRecord & { label?: string; color?: string; eco?: string; opening?: string; games: number; win_rate: number }
export type DossierTrends = { sample_threshold: number; favorite_opening: TrendItem | null; best_opening: TrendItem | null; worst_opening: TrendItem | null; best_color: TrendItem | null; worst_color: TrendItem | null; best_speed: TrendItem | null; worst_speed: TrendItem | null; range_vs_history: { range_games: number; range_win_rate: number; all_games: number; all_win_rate: number; win_rate_delta: number } }
export type RepertoireNode = DossierRecord & { move_sequence: string; san: string; ply: number; games: number; win_rate: number; percentage: number }
export type RepertoireBuildResult = { completed: boolean; processedGames: number; indexedMoves: number; batchGames?: number }
export type DossierSummary = DossierRecord & {
  win_rate: number
  white: DossierRecord
  black: DossierRecord
  platforms: DossierBreakdown[]
  speeds: DossierBreakdown[]
}

export type DossierPageProps = { profiles: Profile[]; activeProfile: Profile | null; onSelectProfile: (profileId: string) => void }
