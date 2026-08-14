import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { averageAccuracy, moveAccuracy } from '../src/accuracy.ts'
import { classifyCpLoss, classifyMateEvent } from '../src/classifications.ts'
import { evalLossForPlayer, pgnHash, scoreToWhitePerspective } from '../src/analysis.ts'

assert.equal(classifyCpLoss(0), 'best'); assert.equal(classifyCpLoss(11), 'excellent'); assert.equal(classifyCpLoss(61), 'inaccuracy'); assert.equal(classifyCpLoss(251), 'blunder'); assert.equal(classifyCpLoss(1, true), 'forced')
assert.equal(classifyMateEvent(3, null), 'blunder'); assert.equal(classifyMateEvent(null, -2), 'blunder'); assert.equal(classifyMateEvent(3, 2), 'best')
assert.equal(moveAccuracy(0), 100); assert.ok(Math.abs(moveAccuracy(120) - 100 * Math.exp(-1)) < 1e-9); assert.equal(moveAccuracy(9999), moveAccuracy(1000)); assert.equal(moveAccuracy(null, 'kept'), 100); assert.equal(moveAccuracy(null, 'lost'), 0); assert.equal(averageAccuracy([]), null); assert.equal(averageAccuracy([100, 80]), 90)
const chess = new Chess(); const first = chess.move('e4'); assert.equal(first.san, 'e4'); assert.equal(chess.fen().split(' ')[1], 'b', 'FEN after white move must give black to move.'); const second = chess.move('c5'); assert.equal(second.san, 'c5'); assert.equal(chess.fen().split(' ')[1], 'w', 'FEN after black move must give white to move.')
assert.equal(scoreToWhitePerspective(42, 'w'), 42); assert.equal(scoreToWhitePerspective(42, 'b'), -42)
assert.equal(evalLossForPlayer(40, -80, 'white'), 120, 'White loses when White-perspective score falls.'); assert.equal(evalLossForPlayer(40, -80, 'black'), 0)
assert.equal(evalLossForPlayer(40, 160, 'black'), 120, 'Black loses when White-perspective score rises.'); assert.equal(evalLossForPlayer(40, 160, 'white'), 0)
assert.equal(pgnHash('1. e4 e5 2. Nf3'), pgnHash('1. e4 e5 2. Nf3')); assert.notEqual(pgnHash('1. e4 e5'), pgnHash('1. d4 d5'))
console.log('Worker analysis policy, FEN and perspective tests passed.')
