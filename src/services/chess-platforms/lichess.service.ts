import { normalizeLichessAccount, LichessUserResponse } from './normalizers'
import { PlatformVerificationError, VerifiedChessAccount } from './types'

const endpoint = (username: string) => `https://lichess.org/api/user/${encodeURIComponent(username)}`

export async function verifyLichessAccount(username: string, fetcher: typeof fetch = fetch): Promise<VerifiedChessAccount> {
  let response: Response
  try { response = await fetcher(endpoint(username), { headers: { Accept: 'application/json' } }) } catch { throw new PlatformVerificationError('error', 'No se pudo conectar con Lichess. Inténtalo de nuevo.') }
  if (response.status === 404) throw new PlatformVerificationError('not_found', 'No encontramos esta cuenta en Lichess.')
  if (!response.ok) throw new PlatformVerificationError('error', response.status === 429 ? 'Lichess limitó temporalmente las consultas. Inténtalo más tarde.' : 'No se pudo verificar la cuenta en Lichess.')
  return normalizeLichessAccount(await response.json() as LichessUserResponse)
}
