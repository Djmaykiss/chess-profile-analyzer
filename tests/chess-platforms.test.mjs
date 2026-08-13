import assert from 'node:assert/strict'
import { normalizeChessComAccount, normalizeLichessAccount } from '../src/services/chess-platforms/normalizers.ts'
import { verifyChessComAccount } from '../src/services/chess-platforms/chesscom.service.ts'
import { verifyLichessAccount } from '../src/services/chess-platforms/lichess.service.ts'

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const fixedDate = '2026-08-12T00:00:00.000Z'

const lichess = normalizeLichessAccount({ id: 'canonical', username: 'Canonical', url: 'https://lichess.org/@/Canonical', perfs: { blitz: { games: 12, rating: 1667 }, rapid: { games: 0, rating: 1500, prov: true } } }, fixedDate)
assert.deepEqual(lichess, { platform: 'lichess', username: 'Canonical', platformUserId: 'canonical', profileUrl: 'https://lichess.org/@/Canonical', ratings: { bullet: undefined, blitz: 1667, rapid: undefined, classical: undefined }, verifiedAt: fixedDate })

const chesscom = normalizeChessComAccount({ player_id: 42, username: 'CanonicalChess', url: 'https://www.chess.com/member/CanonicalChess' }, { chess_blitz: { last: { rating: 1497 } }, chess_rapid: { last: { rating: 1310 } } }, fixedDate)
assert.equal(chesscom.username, 'CanonicalChess')
assert.equal(chesscom.platformUserId, '42')
assert.equal(chesscom.ratings.blitz, 1497)
assert.equal(chesscom.ratings.rapid, 1310)
assert.equal(chesscom.ratings.bullet, undefined)

const foundLichess = await verifyLichessAccount('input', async () => jsonResponse({ id: 'real-id', username: 'RealName', perfs: {} }))
assert.equal(foundLichess.username, 'RealName')
await assert.rejects(() => verifyLichessAccount('missing', async () => new Response('', { status: 404 })), error => error.status === 'not_found')
await assert.rejects(() => verifyLichessAccount('offline', async () => { throw new Error('offline') }), error => error.status === 'error')

let chessComCalls = 0
const foundChessCom = await verifyChessComAccount('input', async () => {
  chessComCalls += 1
  return chessComCalls === 1 ? jsonResponse({ player_id: 7, username: 'CanonicalChess', url: 'https://www.chess.com/member/CanonicalChess' }) : jsonResponse({ chess_bullet: { last: { rating: 1100 } } })
})
assert.equal(foundChessCom.ratings.bullet, 1100)
await assert.rejects(() => verifyChessComAccount('missing', async () => new Response('', { status: 404 })), error => error.status === 'not_found')
console.log('Chess platform normalization and verification tests passed.')
