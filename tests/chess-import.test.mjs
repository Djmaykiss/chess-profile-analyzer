import assert from 'node:assert/strict'
import { externalIdentity, normalizedResult, playerColor, safeImportError, shouldRetry } from '../src/services/chess-import/normalizers.ts'

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
assert.equal(safeImportError(404), 'Cuenta o recurso no encontrado.')
assert.equal(safeImportError(500), 'No se pudo completar la sincronización.')
console.log('Chess import normalization, deduplication and retry tests passed.')
