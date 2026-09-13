import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { annotatedPgnFilename, buildAnnotatedPgn } from '../src/features/analysis/annotated-pgn'
import type { AnalysisRecord, GameEvaluation } from '../src/features/analysis/analysis.types'
import type { ChessGame } from '../src/services/chess-import/games.service'

const game: ChessGame = {
  id: 'game-1', profile_id: 'profile-1', account_id: 'account-1', platform: 'chesscom', external_game_id: 'external-1', game_url: null,
  played_at: '2026-09-13T00:00:00.000Z', white_username: 'White_Player', black_username: 'Black_Player', white_rating: 1500, black_rating: 1500,
  player_color: 'white', result: 'win', rated: true, speed: 'blitz', time_control: '180', eco: 'C20', opening: 'King Pawn Game', termination: null,
  pgn: '[Event "Test"]\n[Site "Local"]\n[Date "2026.09.13"]\n[White "White_Player"]\n[Black "Black_Player"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 1-0',
}

const analysis: AnalysisRecord = { id: 'analysis-1', engine: 'Stockfish', engine_version: '17.1', depth: 16, analyzed_at: '2026-09-13T00:00:00.000Z', accuracy_white: 72.5, accuracy_black: 61.2, accuracy_formula_version: 'cpa-accuracy-v1', classification_version: 'cpa-classification-v1', summary: {} }
const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const evaluations: GameEvaluation[] = [{ id: 'evaluation-1', analysis_id: 'analysis-1', ply: 1, fen: startFen, played_move_san: 'e4', played_move_uci: 'e2e4', best_move_san: 'd4', best_move_uci: 'd2d4', score_type: 'cp', eval_before: 10, eval_after: 20, eval_loss: 0, mate_before: null, mate_after: null, classification: 'best', principal_variation: 'd2d4 d7d5', depth: 16, nodes: 1000, elapsed_ms: 12 }]

const exported = buildAnnotatedPgn(game, analysis, evaluations)
assert.match(exported, /Annotator "Chess Profile Analyzer/)
assert.match(exported, /ANÁLISIS PROFUNDO/)
assert.match(exported, /Mejor jugada: d4/)
assert.match(exported, /\(1\. d4 d5\)/)
assert.equal(new Chess().loadPgn(exported), undefined)
assert.equal(annotatedPgnFilename(game), 'White_Player-vs-Black_Player-2026-09-13-analisis.pgn')
console.log('Annotated PGN export tests passed.')
