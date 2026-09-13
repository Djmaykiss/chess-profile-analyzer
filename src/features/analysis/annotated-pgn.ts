import { Chess } from 'chess.js'
import type { ChessGame } from '../../services/chess-import/games.service'
import { classificationLabels, formatEvaluation, formatLoss, moveNumber } from './analysis-formatters'
import type { AnalysisRecord, GameEvaluation } from './analysis.types'

const commentSafe = (text: string) => text.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim()
const isWhitePly = (ply: number) => ply % 2 === 1

function playerLabel(game: Pick<ChessGame, 'player_color'>, ply: number) {
  const playerMove = game.player_color === 'white' ? isWhitePly(ply) : !isWhitePly(ply)
  return playerMove ? 'tu jugada' : 'la jugada rival'
}

function moveComment(game: Pick<ChessGame, 'player_color'>, evaluation: GameEvaluation) {
  const classification = evaluation.classification ? classificationLabels[evaluation.classification] : 'Sin clasificar'
  const evaluationText = `${formatEvaluation(evaluation.eval_before, evaluation.mate_before, evaluation.score_type)} → ${formatEvaluation(evaluation.eval_after, evaluation.mate_after, evaluation.score_type)}`
  const bestMove = evaluation.best_move_san ? ` Mejor jugada: ${evaluation.best_move_san}.` : ''
  const loss = evaluation.eval_loss === null ? '' : ` Pérdida: ${formatLoss(evaluation.eval_loss)}.`
  return `${playerLabel(game, evaluation.ply)}: ${classification}. Evaluación: ${evaluationText}.${loss}${bestMove}`
}

function principalVariation(evaluation: GameEvaluation) {
  if (!evaluation.principal_variation || !evaluation.fen || !evaluation.best_move_uci) return null
  const uci = evaluation.principal_variation.trim().split(/\s+/).filter(move => /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(move)).slice(0, 6)
  if (!uci.length || uci[0].toLowerCase() !== evaluation.best_move_uci.toLowerCase()) return null
  try {
    const board = new Chess(evaluation.fen)
    const san: string[] = []
    for (const move of uci) {
      const parsed = board.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4]?.toLowerCase() })
      if (!parsed) return null
      san.push(parsed.san)
    }
    const prefix = isWhitePly(evaluation.ply) ? `${Math.ceil(evaluation.ply / 2)}.` : `${Math.ceil(evaluation.ply / 2)}...`
    return san.length ? `(${prefix} ${san.join(' ')})` : null
  } catch {
    return null
  }
}

function introduction(game: Pick<ChessGame, 'white_username' | 'black_username' | 'player_color' | 'result' | 'speed' | 'eco' | 'opening'>, analysis: AnalysisRecord, evaluations: GameEvaluation[]) {
  const ownErrors = evaluations.filter(item => (game.player_color === 'white' ? isWhitePly(item.ply) : !isWhitePly(item.ply)) && ['inaccuracy', 'mistake', 'blunder'].includes(item.classification ?? ''))
  const opponentErrors = evaluations.filter(item => (game.player_color === 'white' ? !isWhitePly(item.ply) : isWhitePly(item.ply)) && ['inaccuracy', 'mistake', 'blunder'].includes(item.classification ?? ''))
  const ownBlunders = ownErrors.filter(item => item.classification === 'blunder').length
  const opponentBlunders = opponentErrors.filter(item => item.classification === 'blunder').length
  const accuracy = game.player_color === 'white' ? analysis.accuracy_white : analysis.accuracy_black
  const phase = game.opening?.trim() || game.eco?.trim() || 'Apertura no identificada'
  const suggestions = ownBlunders ? 'Estudia táctica de una jugada y revisa amenazas forzadas antes de mover.' : ownErrors.length ? 'Revisa las posiciones críticas y compara tu plan con la línea principal.' : 'Mantén el método: identifica amenazas, candidatos y el plan rival antes de decidir.'
  return commentSafe(`==================================================== ANÁLISIS PROFUNDO · Chess Profile Analyzer ==================================================== Introducción: ${game.white_username} vs ${game.black_username}. ${phase}. Ritmo: ${game.speed ?? 'no identificado'}. Este informe usa el análisis persistido de Stockfish ${analysis.engine_version ?? analysis.engine} a profundidad ${analysis.depth}; es una métrica propia y no equivale a Chess.com ni Lichess. Resultado desde tu perspectiva: ${game.result}. Accuracy estimada: ${accuracy ?? 'no disponible'}. Momentos críticos propios: ${ownErrors.length}, incluyendo ${ownBlunders} blunders; del rival: ${opponentErrors.length}, incluyendo ${opponentBlunders}. Fortalezas observadas: decisiones clasificadas como best, excellent, good o forced. Debilidades observadas: inaccuracy, mistake y blunder de esta partida; no representan por sí solas todo tu nivel. Plan de estudio: ${suggestions} Conclusión: prioriza las jugadas con mayor pérdida de evaluación y reproduce sus variantes cortas en un tablero.`)
}

function headersFrom(source: string, analysis: AnalysisRecord) {
  const original = source.match(/^\s*(\[[^\r\n]+\]\s*\r?\n)+/)
  const headers = original?.[0]?.trim() ?? ''
  const annotation = `[Annotator "Chess Profile Analyzer — análisis estimado Stockfish ${analysis.engine_version ?? analysis.engine} d${analysis.depth}"]`
  return `${headers}${headers ? '\n' : ''}${annotation}`
}

export function buildAnnotatedPgn(game: Pick<ChessGame, 'pgn' | 'white_username' | 'black_username' | 'player_color' | 'result' | 'speed' | 'eco' | 'opening'>, analysis: AnalysisRecord, evaluations: GameEvaluation[]) {
  const board = new Chess()
  board.loadPgn(game.pgn)
  const history = board.history()
  const evaluationByPly = new Map(evaluations.map(item => [item.ply, item]))
  const body: string[] = [`{${introduction(game, analysis, evaluations)}}`]
  history.forEach((san, index) => {
    const ply = index + 1
    if (isWhitePly(ply)) body.push(`${Math.ceil(ply / 2)}.`)
    else if (index === 0) body.push('1...')
    body.push(san)
    const evaluation = evaluationByPly.get(ply)
    if (!evaluation) return
    body.push(`{${commentSafe(moveComment(game, evaluation))}}`)
    const variation = principalVariation(evaluation)
    if (variation && variation !== `(${moveNumber(ply)} ${evaluation.played_move_san})`) body.push(variation)
  })
  const result = ({ win: game.player_color === 'white' ? '1-0' : '0-1', loss: game.player_color === 'white' ? '0-1' : '1-0', draw: '1/2-1/2' } as const)[game.result]
  return `${headersFrom(game.pgn, analysis)}\n\n${body.join(' ')} ${result}\n`
}

export function annotatedPgnFilename(game: Pick<ChessGame, 'white_username' | 'black_username' | 'played_at'>) {
  const names = `${game.white_username}-vs-${game.black_username}`.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '')
  return `${names}-${new Date(game.played_at).toISOString().slice(0, 10)}-analisis.pgn`
}

export function downloadAnnotatedPgn(filename: string, pgn: string) {
  const href = URL.createObjectURL(new Blob([pgn], { type: 'application/x-chess-pgn;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(href)
}
