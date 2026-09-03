import { GameEvaluation, MoveClassification } from './analysis.types'

export const classificationLabels: Record<Exclude<MoveClassification, null>, string> = {
  best: 'Best', excellent: 'Excellent', good: 'Good', inaccuracy: 'Inaccuracy', mistake: 'Mistake', blunder: 'Blunder', forced: 'Forced',
}

export function moveNumber(ply: number) { return `${Math.ceil(ply / 2)}${ply % 2 === 0 ? '…' : '.'}` }

export function formatCp(value: number | null) { return value === null ? '—' : `${value >= 0 ? '+' : ''}${(value / 100).toFixed(2)}` }
export function formatMate(value: number | null) { return value === null ? null : `${value >= 0 ? 'M' : '-M'}${Math.abs(value)}` }
export function formatEvaluation(value: number | null, mate: number | null, type: GameEvaluation['score_type']) { return type === 'mate' ? formatMate(mate) ?? '—' : formatCp(value) }
export function formatLoss(value: number | null) { return value === null ? '—' : `${value} cp` }
export function isErrorMove(item: GameEvaluation) { return item.classification === 'inaccuracy' || item.classification === 'mistake' || item.classification === 'blunder' }
