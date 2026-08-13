export type ImportedGame = { accountId: string; platform: 'lichess' | 'chesscom'; externalGameId: string; username: string; white: string; black: string; result: 'win' | 'draw' | 'loss'; color: 'white' | 'black'; whiteRating: number | null; blackRating: number | null; speed: string | null; eco: string | null; opening: string | null; termination: string | null }

export function playerColor(username: string, white: string): 'white' | 'black' { return username.trim().toLowerCase() === white.trim().toLowerCase() ? 'white' : 'black' }
export function normalizedResult(pgnResult: string, color: 'white' | 'black'): ImportedGame['result'] { if (pgnResult === '1/2-1/2') return 'draw'; return (pgnResult === '1-0') === (color === 'white') ? 'win' : 'loss' }
export function externalIdentity(accountId: string, platform: ImportedGame['platform'], externalGameId: string) { return `${accountId}:${platform}:${externalGameId}` }
export function shouldRetry(status: number | undefined) { return status === 429 || (status !== undefined && status >= 500) || status === undefined }
export function safeImportError(status?: number) { if (status === 404) return 'Cuenta o recurso no encontrado.'; if (status === 429) return 'El proveedor limitó temporalmente la solicitud.'; return 'No se pudo completar la sincronización.' }
