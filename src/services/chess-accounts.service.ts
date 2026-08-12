import { requireSupabase } from './supabase'

export type Platform = 'lichess' | 'chesscom'
export type ChessAccount = { id: string; profile_id: string; platform: Platform; username: string; platform_user_id: string | null; profile_url: string | null; is_active: boolean; last_sync_at: string | null; created_at: string; updated_at: string }
export type ChessAccountInput = Pick<ChessAccount, 'profile_id' | 'platform' | 'username'>

export async function listChessAccounts(profileId: string) { const { data, error } = await requireSupabase().from('chess_accounts').select('*').eq('profile_id', profileId).order('created_at'); if (error) throw error; return data as ChessAccount[] }
export async function createChessAccount(input: ChessAccountInput) { const { data, error } = await requireSupabase().from('chess_accounts').insert(input).select().single(); if (error) throw error; return data as ChessAccount }
export async function deleteChessAccount(id: string) { const { error } = await requireSupabase().from('chess_accounts').delete().eq('id', id); if (error) throw error }
