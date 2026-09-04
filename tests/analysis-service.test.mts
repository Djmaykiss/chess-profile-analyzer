import assert from 'node:assert/strict'
import { firstRpcRow } from '../src/features/analysis/analysis-normalizers'

const completed = { job_id: '2f2fba77-83b1-4131-87c8-6b5836e915d0', status: 'completed' as const, analysis_id: 'c221d14e-ac21-4c5d-aece-955139abc523', reusable: true }

assert.deepEqual(firstRpcRow([completed]), completed, 'Array RPC response must preserve completed analysis status.')
assert.deepEqual(firstRpcRow(completed), completed, 'Object RPC response must preserve completed analysis status.')
assert.equal(firstRpcRow(null), null, 'Null RPC response must remain absent so the caller falls back to not_requested.')
console.log('Stockfish analysis RPC normalization tests passed.')
