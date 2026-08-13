import assert from 'node:assert/strict'
import { externalIdentity, normalizedResult, playerColor, safeImportError, shouldRetry } from '../src/services/chess-import/normalizers.ts'
import { playedAt, splitNdjson } from '../supabase/functions/sync-chess-account/normalizers.ts'

assert.equal(playerColor('Player', 'player'), 'white')
assert.equal(playerColor('Player', 'Opponent'), 'black')
assert.equal(normalizedResult('1-0', 'white'), 'win')
assert.equal(normalizedResult('0-1', 'white'), 'loss')
assert.equal(normalizedResult('0-1', 'black'), 'win')
assert.equal(normalizedResult('1-0', 'black'), 'loss')
assert.equal(normalizedResult('1/2-1/2', 'black'), 'draw')

const first = externalIdentity('account-a', 'lichess', 'game-1')
assert.equal(first, externalIdentity('account-a', 'lichess', 'game-1'), 'same account/platform/id deduplicates')
assert.notEqual(first, externalIdentity('account-b', 'lichess', 'game-1'), 'same external id on another account is allowed')
assert.equal(shouldRetry(429), true)
assert.equal(shouldRetry(500), true)
assert.equal(shouldRetry(undefined), true)
assert.equal(shouldRetry(404), false)
assert.equal(playedAt({ end_time: 1750000000 }, {}), '2025-06-15T15:06:40.000Z', 'Chess.com end_time uses Unix seconds, not milliseconds')
assert.deepEqual(splitNdjson('{"id":"one"}\n{"id":"two"', ''), { complete: ['{"id":"one"}'], remainder: '{"id":"two"' }, 'Lichess NDJSON chunks retain incomplete trailing rows')
assert.deepEqual(splitNdjson('}\n', '{"id":"two"'), { complete: ['{"id":"two"}'], remainder: '' }, 'Lichess NDJSON chunks reconstruct split rows')
assert.equal(safeImportError(404), 'Cuenta o recurso no encontrado.')
assert.equal(safeImportError(500), 'No se pudo completar la sincronización.')
console.log('Chess import normalization, deduplication and retry tests passed.')
