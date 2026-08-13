import { requireSupabase } from './supabase'
import { verifyChessAccount } from './chess-platforms/chess-verification.service'
import { AccountRatings, PlatformVerificationError, VerificationStatus } from './chess-platforms/types'

export type Platform = 'lichess' | 'chesscom'
export type ChessAccount = { id: string; profile_id: string; platform: Platform; username: string; platform_user_id: string | null; profile_url: string | null; is_active: boolean; last_sync_at: string | null; verification_status: VerificationStatus; verified_at: string | null; verification_error: string | null; rating_bullet: number | null; rating_blitz: number | null; rating_rapid: number | null; rating_classical: number | null; created_at: string; updated_at: string }
export type ChessAccountInput = Pick<ChessAccount, 'profile_id' | 'platform' | 'username'>
export type ChessAccountVerification = Pick<ChessAccount, 'username' | 'platform_user_id' | 'profile_url' | 'verification_status' | 'verified_at' | 'verification_error' | 'rating_bullet' | 'rating_blitz' | 'rating_rapid' | 'rating_classical'>

export async function listChessAccounts(profileId: string) { const { data, error } = await requireSupabase().from('chess_accounts').select('*').eq('profile_id', profileId).order('created_at'); if (error) throw error; return data as ChessAccount[] }
export async function createChessAccount(input: ChessAccountInput) { const { data, error } = await requireSupabase().from('chess_accounts').insert(input).select().single(); if (error) throw error; return data as ChessAccount }
export async function deleteChessAccount(id: string) { const { error } = await requireSupabase().from('chess_accounts').delete().eq('id', id); if (error) throw error }

function verificationPayload(account: ChessAccount, status: VerificationStatus, error: string | null, ratings: AccountRatings = {}): ChessAccountVerification {
  return { username: account.username, platform_user_id: null, profile_url: null, verification_status: status, verified_at: null, verification_error: error, rating_bullet: ratings.bullet ?? null, rating_blitz: ratings.blitz ?? null, rating_rapid: ratings.rapid ?? null, rating_classical: ratings.classical ?? null }
}

export async function verifyAndUpdateChessAccount(account: ChessAccount) {
  try {
    const verified = await verifyChessAccount(account.platform, account.username)
    const { data, error } = await requireSupabase().from('chess_accounts').update({ username: verified.username, platform_user_id: verified.platformUserId ?? null, profile_url: verified.profileUrl, verification_status: 'verified', verified_at: verified.verifiedAt, verification_error: null, rating_bullet: verified.ratings.bullet ?? null, rating_blitz: verified.ratings.blitz ?? null, rating_rapid: verified.ratings.rapid ?? null, rating_classical: verified.ratings.classical ?? null }).eq('id', account.id).select().single()
    if (error) throw error
    return data as ChessAccount
  } catch (caught) {
    if (!(caught instanceof PlatformVerificationError)) throw caught
    const status = caught.status
    const message = caught.message
    const { data, error } = await requireSupabase().from('chess_accounts').update(verificationPayload(account, status, message)).eq('id', account.id).select().single()
    if (error) throw error
    return data as ChessAccount
  }
}
