import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChessAccountInput, createChessAccount, deleteChessAccount, listChessAccounts } from '../services/chess-accounts.service'
import { isSupabaseConfigured } from '../services/supabase'

export const useChessAccounts = (profileId?: string) => useQuery({ queryKey: ['chess-accounts', profileId], queryFn: () => listChessAccounts(profileId!), enabled: Boolean(profileId && isSupabaseConfigured) })
export const useCreateChessAccount = (profileId?: string) => { const client = useQueryClient(); return useMutation({ mutationFn: (input: ChessAccountInput) => createChessAccount(input), onSuccess: () => client.invalidateQueries({ queryKey: ['chess-accounts', profileId] }) }) }
export const useDeleteChessAccount = (profileId?: string) => { const client = useQueryClient(); return useMutation({ mutationFn: deleteChessAccount, onSuccess: () => client.invalidateQueries({ queryKey: ['chess-accounts', profileId] }) }) }
