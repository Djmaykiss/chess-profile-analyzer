export type ChessPlatform = 'lichess' | 'chesscom'
export type VerificationStatus = 'pending' | 'verified' | 'not_found' | 'error'

export type AccountRatings = {
  bullet?: number
  blitz?: number
  rapid?: number
  classical?: number
}

export type VerifiedChessAccount = {
  platform: ChessPlatform
  username: string
  platformUserId?: string
  profileUrl: string
  ratings: AccountRatings
  verifiedAt: string
}

export class PlatformVerificationError extends Error {
  constructor(public readonly status: VerificationStatus, message: string) {
    super(message)
    this.name = 'PlatformVerificationError'
  }
}
