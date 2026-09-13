import assert from 'node:assert/strict'
import { originalGameLink } from '../src/services/chess-import/original-game-link.ts'
import type { ChessGame } from '../src/services/chess-import/games.service.ts'

const game: ChessGame = { id: 'g1', profile_id: 'p1', account_id: 'a1', platform: 'chesscom', external_game_id: 'external', game_url: 'https://www.chess.com/game/daily/unverified', played_at: '2026-01-01T00:00:00Z', white_username: 'Michael_Alexander_Perez', black_username: 'Opponent', white_rating: null, black_rating: null, player_color: 'white', result: 'win', rated: true, speed: 'blitz', time_control: '180', eco: null, opening: null, termination: null, pgn: '1. e4 e5 *' }

assert.deepEqual(originalGameLink(game, { profile_url: 'https://www.chess.com/member/michael_alexander_perez' }), {
  href: 'https://www.chess.com/member/michael_alexander_perez',
  label: 'Abrir perfil en Chess.com',
  notice: 'Chess.com devolvió un enlace de partida que no coincide de forma verificable con los jugadores importados. Mostramos el perfil verificado en su lugar.',
})
assert.deepEqual(originalGameLink({ ...game, platform: 'lichess', game_url: 'https://lichess.org/abc' }, null), { href: 'https://lichess.org/abc', label: 'Abrir partida original' })
console.log('Original game-link safety tests passed.')
