import type { ChessAccount } from '../chess-accounts.service'
import type { ChessGame } from './games.service'

export type OriginalGameLink = { href: string; label: string; notice?: string }

export function originalGameLink(game: ChessGame, account?: Pick<ChessAccount, 'profile_url'> | null): OriginalGameLink | null {
  if (game.platform === 'lichess' && game.game_url) return { href: game.game_url, label: 'Abrir partida original' }
  if (game.platform === 'chesscom' && account?.profile_url) {
    return {
      href: account.profile_url,
      label: 'Abrir perfil en Chess.com',
      notice: 'Chess.com devolvió un enlace de partida que no coincide de forma verificable con los jugadores importados. Mostramos el perfil verificado en su lugar.',
    }
  }
  return null
}
