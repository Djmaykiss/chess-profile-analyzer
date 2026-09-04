import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GameFilters, getProfileBasicStats, listGames } from '../services/chess-import/games.service'
import { gamesQueryKey } from '../services/chess-import/game-scope'
import { listSyncRuns, syncChessAccount } from '../services/chess-import/sync.service'
import { ChessAccount } from '../services/chess-accounts.service'
import { isSupabaseConfigured } from '../services/supabase'

// Do not retain a previous account's rows while a different filter is loading.
// A stale row could otherwise be opened just as the filter changes.
export const useGames = (profileId: string | undefined, page: number, filters: GameFilters) => useQuery({ queryKey: gamesQueryKey(profileId, page, filters), queryFn: () => listGames(profileId!, page, filters), enabled: Boolean(profileId && isSupabaseConfigured) })
export const useProfileBasicStats = (profileId?: string) => useQuery({ queryKey: ['profile-basic-stats', profileId], queryFn: () => getProfileBasicStats(profileId!), enabled: Boolean(profileId && isSupabaseConfigured) })
export const useSyncRuns = (profileId?: string) => useQuery({ queryKey: ['sync-runs', profileId], queryFn: () => listSyncRuns(profileId!), enabled: Boolean(profileId && isSupabaseConfigured) })

export function useSyncChessAccount(profileId: string) {
  const client = useQueryClient()
  return useMutation({ mutationFn: (accountId: string) => syncChessAccount(profileId, accountId), onSettled: () => Promise.all([client.invalidateQueries({ queryKey: ['games', profileId] }), client.invalidateQueries({ queryKey: ['sync-runs', profileId] }), client.invalidateQueries({ queryKey: ['profile-basic-stats', profileId] }), client.invalidateQueries({ queryKey: ['chess-accounts', profileId] })]) })
}
export function useSyncAllChessAccounts(profileId: string) {
  const client = useQueryClient()
  return useMutation({ mutationFn: async (accounts: ChessAccount[]) => { const results = await Promise.allSettled(accounts.map(account => syncChessAccount(profileId, account.id))); return { completed: results.filter(result => result.status === 'fulfilled').length, failed: results.filter(result => result.status === 'rejected').length } }, onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: ['games', profileId] }), client.invalidateQueries({ queryKey: ['sync-runs', profileId] }), client.invalidateQueries({ queryKey: ['profile-basic-stats', profileId] }), client.invalidateQueries({ queryKey: ['chess-accounts', profileId] })]) })
}
