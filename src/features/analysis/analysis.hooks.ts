import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelGameAnalysis, getGameAnalysisStatus, requestGameAnalysis } from './analysis.service'

const active = new Set(['queued', 'running', 'cancel_requested'])
export const useGameAnalysisStatus = (gameId?: string) => useQuery({ queryKey: ['game-analysis-status', gameId], queryFn: () => getGameAnalysisStatus(gameId!), enabled: Boolean(gameId), refetchInterval: query => active.has(query.state.data?.status ?? '') ? 4000 : false })
export function useRequestGameAnalysis(gameId: string) { const client = useQueryClient(); return useMutation({ mutationFn: () => requestGameAnalysis(gameId), onSuccess: () => client.invalidateQueries({ queryKey: ['game-analysis-status', gameId] }) }) }
export function useCancelGameAnalysis(gameId: string) { const client = useQueryClient(); return useMutation({ mutationFn: (jobId: string) => cancelGameAnalysis(jobId), onSuccess: () => client.invalidateQueries({ queryKey: ['game-analysis-status', gameId] }) }) }
