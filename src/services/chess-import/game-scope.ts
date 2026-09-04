import type { Platform } from '../chess-accounts.service'

export type GameScopeFilters = { platform?: Platform; accountId?: string; color?: 'white' | 'black'; result?: 'win' | 'draw' | 'loss'; speed?: string }
export type ScopedGame = { profile_id: string; account_id: string; platform: Platform; player_color: 'white' | 'black'; result: 'win' | 'draw' | 'loss'; speed: string | null }

/** A stable, complete cache identity for one page of the games list. */
export function gamesQueryKey(profileId: string | undefined, page: number, filters: GameScopeFilters) {
  return ['games', profileId ?? null, page, filters.platform ?? null, filters.accountId ?? null, filters.color ?? null, filters.result ?? null, filters.speed ?? null] as const
}

/** True only when a previously selected game still belongs to the visible filter scope. */
export function gameMatchesFilters(game: ScopedGame, profileId: string, filters: GameScopeFilters) {
  return game.profile_id === profileId
    && (!filters.platform || game.platform === filters.platform)
    && (!filters.accountId || game.account_id === filters.accountId)
    && (!filters.color || game.player_color === filters.color)
    && (!filters.result || game.result === filters.result)
    && (!filters.speed || game.speed === filters.speed)
}
