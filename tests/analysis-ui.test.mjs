import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const service = readFileSync(new URL('../src/features/analysis/analysis.service.ts', import.meta.url), 'utf8')
const panel = readFileSync(new URL('../src/features/analysis/GameAnalysisPanel.tsx', import.meta.url), 'utf8')
const detail = readFileSync(new URL('../src/features/analysis/MoveAnalysisDetail.tsx', import.meta.url), 'utf8')
const summary = readFileSync(new URL('../src/features/analysis/AnalysisSummary.tsx', import.meta.url), 'utf8')

assert.ok(service.includes("from('game_analysis')") && service.includes("from('game_evaluations')"), 'UI must read persisted analysis data only.')
assert.ok(!/\.insert\(|\.update\(|service_role/i.test(service), 'Analysis presentation must not write results or expose backend credentials.')
assert.ok(panel.includes('status.status !== \'completed\'') && panel.includes('AnalysisRequestButton'), 'Queued/running states must retain the existing request UI.')
assert.ok(summary.includes('Accuracy estimada por Chess Profile Analyzer') && summary.includes('No equivale a Chess.com ni Lichess'), 'Accuracy disclaimer must stay visible.')
assert.ok(detail.includes('mate_before') && detail.includes('mate_after') && detail.includes('principal_variation'), 'Move detail must preserve mate and PV separately from centipawns.')
console.log('Stockfish analysis UI contract tests passed.')
