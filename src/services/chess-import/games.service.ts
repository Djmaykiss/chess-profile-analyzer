import { Platform } from '../chess-accounts.service'
import { requireSupabase } from '../supabase'

export type GameResult = 'win' | 'draw' | 'loss'
export type PlayerColor = 'white' | 'black'
export type ChessGame = { id: string; profile_id: string; account_id: string; platform: Platform; external_game_id: string; game_url: string | null; played_at: string; white_username: string; black_username: string; white_rating: number | null; black_rating: number | null; player_color: PlayerColor; result: GameResult; rated: boolean | null; speed: string | null; time_control: string | null; eco: string | null; opening: string | null; termination: string | null; pgn: string }
export type GameFilters = { platform?: Platform; accountId?: string; color?: PlayerColor; result?: GameResult; speed?: string }
export type GamesPage = { games: ChessGame[]; total: number }
export type ProfileBasicStats = { total_games: number; wins: number; draws: number; losses: number; win_rate: number }

export async function listGames(profileId: string, page: number, filters: GameFilters, pageSize = 50): Promise<GamesPage> {
  let query = requireSupabase().from('games').select('*', { count: 'exact' }).eq('profile_id', profileId)
  if (filters.platform) query = query.eq('platform', filters.platform)
  if (filters.accountId) query = query.eq('account_id', filters.accountId)
  if (filters.color) query = query.eq('player_color', filters.color)
  if (filters.result) query = query.eq('result', filters.result)
  if (filters.speed) query = query.eq('speed', filters.speed)
  const from = page * pageSize
  const { data, error, count } = await query.order('played_at', { ascending: false }).range(from, from + pageSize - 1)
  if (error) throw error
  return { games: (data ?? []) as ChessGame[], total: count ?? 0 }
}

export async function getProfileBasicStats(profileId: string): Promise<ProfileBasicStats> {
  const { data, error } = await requireSupabase().rpc('get_profile_basic_stats', { target_profile_id: profileId })
  if (error) throw error
  const row = data?.[0]
  return { total_games: Number(row?.total_games ?? 0), wins: Number(row?.wins ?? 0), draws: Number(row?.draws ?? 0), losses: Number(row?.losses ?? 0), win_rate: Number(row?.win_rate ?? 0) }
}
