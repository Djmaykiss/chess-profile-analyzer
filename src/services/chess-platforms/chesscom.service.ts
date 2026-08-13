import { ChessComProfileResponse, ChessComStatsResponse, normalizeChessComAccount } from './normalizers'
import { PlatformVerificationError, VerifiedChessAccount } from './types'

const endpoint = (username: string) => `https://api.chess.com/pub/player/${encodeURIComponent(username)}`

export async function verifyChessComAccount(username: string, fetcher: typeof fetch = fetch): Promise<VerifiedChessAccount> {
  let profileResponse: Response
  try { profileResponse = await fetcher(endpoint(username), { headers: { Accept: 'application/json' } }) } catch { throw new PlatformVerificationError('error', 'No se pudo conectar con Chess.com. Inténtalo de nuevo.') }
  if (profileResponse.status === 404 || profileResponse.status === 410) throw new PlatformVerificationError('not_found', 'No encontramos esta cuenta en Chess.com.')
  if (!profileResponse.ok) throw new PlatformVerificationError('error', profileResponse.status === 429 ? 'Chess.com limitó temporalmente las consultas. Inténtalo más tarde.' : 'No se pudo verificar la cuenta en Chess.com.')
  const profile = await profileResponse.json() as ChessComProfileResponse
  let stats: ChessComStatsResponse = {}
  try {
    const statsResponse = await fetcher(`${endpoint(profile.username)}/stats`, { headers: { Accept: 'application/json' } })
    if (statsResponse.ok) stats = await statsResponse.json() as ChessComStatsResponse
  } catch { /* The profile remains a valid verification when public stats are unavailable. */ }
  return normalizeChessComAccount(profile, stats)
}
