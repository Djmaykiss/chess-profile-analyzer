import { Chess, Move } from 'chess.js'
import { createHash } from 'node:crypto'
import { Stockfish } from './stockfish.js'
import { classifyCpLoss, classifyMateEvent, Classification } from './classifications.js'
import { averageAccuracy, moveAccuracy } from './accuracy.js'

export type PersistedEvaluation = { ply: number; fen: string; played_move_san: string; played_move_uci: string; best_move_san: string | null; best_move_uci: string | null; score_type: 'cp' | 'mate'; eval_before: number | null; eval_after: number | null; eval_loss: number | null; mate_before: number | null; mate_after: number | null; classification: Classification; principal_variation: string | null; depth: number; nodes: number | null; elapsed_ms: number }
export type AnalysisResult = { evaluations: PersistedEvaluation[]; accuracyWhite: number | null; accuracyBlack: number | null; summary: Record<string, unknown>; positionsTotal: number }
/** UCI expresses scores from the side-to-move perspective; persisted cp is always White's perspective. */
export const scoreToWhitePerspective = (value: number, turn: 'w' | 'b') => turn === 'w' ? value : -value
/** A loss is always measured from the player who made the move, never from White by default. */
export const evalLossForPlayer = (beforeWhite: number, afterWhite: number, playerColor: 'white' | 'black') => Math.max(0, playerColor === 'white' ? beforeWhite - afterWhite : afterWhite - beforeWhite)
const uci = (move: Move) => `${move.from}${move.to}${move.promotion ?? ''}`
const sanForUci = (fen: string, candidate: string | null) => { if (!candidate || candidate.length < 4) return null; try { const chess = new Chess(fen); return chess.move({ from: candidate.slice(0, 2), to: candidate.slice(2, 4), promotion: candidate[4] })?.san ?? null } catch { return null } }
const mateOutcome = (best: number | null, actual: number | null, color: 'white' | 'black'): 'kept' | 'lost' | undefined => { const bestPlayer = best === null ? null : color === 'white' ? best : -best; const actualPlayer = actual === null ? null : color === 'white' ? actual : -actual; if (bestPlayer !== null && bestPlayer > 0 && actualPlayer !== null && actualPlayer > 0) return 'kept'; if ((bestPlayer !== null && bestPlayer > 0 && (actualPlayer === null || actualPlayer <= 0)) || (actualPlayer !== null && actualPlayer < 0)) return 'lost'; return undefined }
export const pgnHash = (pgn: string) => createHash('md5').update(pgn).digest('hex')
export async function analysePgn(pgn: string, engine: Stockfish, depth: number, movetimeMs: number | undefined, cancelled: () => Promise<boolean>, onProgress: (done: number, total: number) => Promise<void>): Promise<AnalysisResult | null> {
  const source = new Chess(); source.loadPgn(pgn); const history = source.history({ verbose: true }); const chess = new Chess(); const evaluations: PersistedEvaluation[] = []; const whiteAccuracy: number[] = []; const blackAccuracy: number[] = []
  for (let index = 0; index < history.length; index += 1) {
    if (await cancelled()) return null
    const played = history[index]; const fen = chess.fen(); const turn = chess.turn(); const playerColor = turn === 'w' ? 'white' : 'black'; const before = await engine.analyse(fen, depth, movetimeMs)
    chess.move({ from: played.from, to: played.to, promotion: played.promotion }); const afterFen = chess.fen(); const after = await engine.analyse(afterFen, depth, movetimeMs)
    const beforeWhite = scoreToWhitePerspective(before.score.value, turn); const afterWhite = scoreToWhitePerspective(after.score.value, chess.turn()); const isMate = before.score.type === 'mate' || after.score.type === 'mate'
    const loss = isMate ? null : evalLossForPlayer(beforeWhite, afterWhite, playerColor); const bestMateWhite = before.score.type === 'mate' ? beforeWhite : null; const actualMateWhite = after.score.type === 'mate' ? afterWhite : null; const outcome = mateOutcome(bestMateWhite, actualMateWhite, playerColor); const classification = isMate ? classifyMateEvent(playerColor === 'white' ? bestMateWhite : bestMateWhite === null ? null : -bestMateWhite, playerColor === 'white' ? actualMateWhite : actualMateWhite === null ? null : -actualMateWhite) : classifyCpLoss(loss ?? 0, before.bestMove === uci(played)); const accuracy = moveAccuracy(loss, outcome)
    ;(playerColor === 'white' ? whiteAccuracy : blackAccuracy).push(accuracy)
    evaluations.push({ ply: index + 1, fen, played_move_san: played.san, played_move_uci: uci(played), best_move_san: sanForUci(fen, before.bestMove), best_move_uci: before.bestMove, score_type: isMate ? 'mate' : 'cp', eval_before: isMate ? null : beforeWhite, eval_after: isMate ? null : afterWhite, eval_loss: loss, mate_before: bestMateWhite, mate_after: actualMateWhite, classification, principal_variation: before.pv, depth: Math.min(before.depth, after.depth), nodes: before.nodes, elapsed_ms: before.elapsedMs + after.elapsedMs })
    await onProgress(index + 1, history.length)
  }
  const counts = Object.fromEntries(['best','excellent','good','inaccuracy','mistake','blunder','forced'].map(name => [name, evaluations.filter(item => item.classification === name).length]))
  return { evaluations, accuracyWhite: averageAccuracy(whiteAccuracy), accuracyBlack: averageAccuracy(blackAccuracy), positionsTotal: history.length, summary: { label: 'Accuracy estimada por Chess Profile Analyzer', classification_counts: counts, critical_plies: evaluations.filter(item => item.classification === 'blunder' || item.classification === 'mistake').map(item => item.ply).slice(0, 10) } }
}
