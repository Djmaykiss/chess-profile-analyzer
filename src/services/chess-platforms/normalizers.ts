import { AccountRatings, VerifiedChessAccount } from './types'

type LichessPerf = { rating?: number; games?: number; prov?: boolean }
export type LichessUserResponse = { id: string; username: string; url?: string; perfs?: Record<string, LichessPerf> }
export type ChessComProfileResponse = { player_id?: number; username: string; url?: string }
export type ChessComStatsResponse = Record<string, { last?: { rating?: number } }>

function rating(perf?: LichessPerf) {
  return perf && perf.games && !perf.prov && Number.isInteger(perf.rating) ? perf.rating : undefined
}

export function normalizeLichessAccount(data: LichessUserResponse, verifiedAt = new Date().toISOString()): VerifiedChessAccount {
  const perfs = data.perfs ?? {}
  const ratings: AccountRatings = { bullet: rating(perfs.bullet), blitz: rating(perfs.blitz), rapid: rating(perfs.rapid), classical: rating(perfs.classical) }
  return { platform: 'lichess', username: data.username, platformUserId: data.id, profileUrl: data.url ?? `https://lichess.org/@/${encodeURIComponent(data.username)}`, ratings, verifiedAt }
}

function chessComRating(stats: ChessComStatsResponse, key: string) {
  const value = stats[key]?.last?.rating
  return Number.isInteger(value) ? value : undefined
}

export function normalizeChessComAccount(profile: ChessComProfileResponse, stats: ChessComStatsResponse, verifiedAt = new Date().toISOString()): VerifiedChessAccount {
  const ratings: AccountRatings = { bullet: chessComRating(stats, 'chess_bullet'), blitz: chessComRating(stats, 'chess_blitz'), rapid: chessComRating(stats, 'chess_rapid'), classical: chessComRating(stats, 'chess_daily') }
  return { platform: 'chesscom', username: profile.username, platformUserId: profile.player_id?.toString(), profileUrl: profile.url ?? `https://www.chess.com/member/${encodeURIComponent(profile.username)}`, ratings, verifiedAt }
}
