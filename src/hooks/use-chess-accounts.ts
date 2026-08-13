import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChessAccount, ChessAccountInput, createChessAccount, deleteChessAccount, listChessAccounts, verifyAndUpdateChessAccount } from '../services/chess-accounts.service'
import { isSupabaseConfigured } from '../services/supabase'

export const useChessAccounts = (profileId?: string) => useQuery({ queryKey: ['chess-accounts', profileId], queryFn: () => listChessAccounts(profileId!), enabled: Boolean(profileId && isSupabaseConfigured) })
export const useCreateChessAccount = (profileId?: string) => { const client = useQueryClient(); return useMutation({ mutationFn: (input: ChessAccountInput) => createChessAccount(input), onSuccess: () => client.invalidateQueries({ queryKey: ['chess-accounts', profileId] }) }) }
export const useDeleteChessAccount = (profileId?: string) => { const client = useQueryClient(); return useMutation({ mutationFn: deleteChessAccount, onSuccess: () => client.invalidateQueries({ queryKey: ['chess-accounts', profileId] }) }) }
export const useVerifyChessAccount = (profileId?: string) => { const client = useQueryClient(); return useMutation({ mutationFn: (account: ChessAccount) => verifyAndUpdateChessAccount(account), onSuccess: () => client.invalidateQueries({ queryKey: ['chess-accounts', profileId] }) }) }
