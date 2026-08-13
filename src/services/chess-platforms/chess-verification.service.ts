import { verifyChessComAccount } from './chesscom.service'
import { verifyLichessAccount } from './lichess.service'
import { ChessPlatform, VerifiedChessAccount } from './types'

export function verifyChessAccount(platform: ChessPlatform, username: string): Promise<VerifiedChessAccount> {
  return platform === 'lichess' ? verifyLichessAccount(username) : verifyChessComAccount(username)
}
