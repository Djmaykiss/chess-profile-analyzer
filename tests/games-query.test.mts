import assert from 'node:assert/strict'
import type { ChessGame } from '../src/services/chess-import/games.service.ts'
import { gameMatchesFilters, gamesQueryKey } from '../src/services/chess-import/game-scope.ts'
import { openingLabels } from '../src/features/dossier/opening-labels.ts'

const base: ChessGame = { id: 'a1', profile_id: 'profile-a', account_id: 'account-a', platform: 'chesscom', external_game_id: 'game-a1', game_url: null, played_at: '2026-09-04T00:00:00.000Z', white_username: 'Account_A', black_username: 'Opponent', white_rating: null, black_rating: null, player_color: 'white', result: 'win', rated: true, speed: 'blitz', time_control: '300', eco: null, opening: null, termination: null, pgn: '1. e4 e5 *' }
const accountB: ChessGame = { ...base, id: 'b1', account_id: 'account-b', external_game_id: 'game-b1' }

assert.notDeepEqual(gamesQueryKey('profile-a', 0, { accountId: 'account-a' }), gamesQueryKey('profile-a', 0, { accountId: 'account-b' }), 'Account A and B must never share a games cache key')
assert.notDeepEqual(gamesQueryKey('profile-a', 0, { accountId: 'account-a', speed: 'blitz' }), gamesQueryKey('profile-a', 0, { accountId: 'account-a', speed: 'rapid' }), 'Rapid filter changes must have a separate cache key')
assert.equal(gameMatchesFilters(base, 'profile-a', { accountId: 'account-a', platform: 'chesscom' }), true, 'A1 remains selectable in Account A')
assert.equal(gameMatchesFilters(base, 'profile-a', { accountId: 'account-b' }), false, 'After switching to Account B, stale A1 must be closed')
assert.equal(gameMatchesFilters(accountB, 'profile-a', { accountId: 'account-b' }), true, 'B1 opens after an A-to-B switch')
assert.equal(gameMatchesFilters(accountB, 'profile-b', {}), false, 'A profile change closes any old selected game')
assert.deepEqual(openingLabels(null, null), { eco: 'ECO no identificado', opening: 'Apertura no identificada' })
assert.deepEqual(openingLabels('—', 'Sin nombre'), { eco: 'ECO no identificado', opening: 'Apertura no identificada' })
console.log('Games cache scope, stale selection, and opening labels tests passed.')
