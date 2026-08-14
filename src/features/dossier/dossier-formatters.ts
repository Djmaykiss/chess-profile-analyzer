import { DossierRecord, DossierRange, DossierSummary, DossierTrends, TrendItem } from './dossier.types'

export const EMPTY_RECORD: DossierRecord = { total_games: 0, wins: 0, draws: 0, losses: 0 }
export const EMPTY_DOSSIER: DossierSummary = { ...EMPTY_RECORD, win_rate: 0, white: { ...EMPTY_RECORD }, black: { ...EMPTY_RECORD }, platforms: [], speeds: [] }

const monthsAgo = (months: number) => { const date = new Date(); date.setMonth(date.getMonth() - months); return date.toISOString() }
export const dossierRanges: Array<{ value: string; label: string; range: DossierRange }> = [
  { value: 'all', label: 'Todo el historial', range: { kind: 'all' } },
  { value: 'recent-20', label: 'Últimas 20 partidas', range: { kind: 'recent', recentLimit: 20 } },
  { value: 'recent-50', label: 'Últimas 50 partidas', range: { kind: 'recent', recentLimit: 50 } },
  { value: 'recent-100', label: 'Últimas 100 partidas', range: { kind: 'recent', recentLimit: 100 } },
  { value: 'months-3', label: 'Últimos 3 meses', range: { kind: 'time', label: '3 meses', dateFrom: monthsAgo(3) } },
  { value: 'months-6', label: 'Últimos 6 meses', range: { kind: 'time', label: '6 meses', dateFrom: monthsAgo(6) } },
  { value: 'year-1', label: 'Último año', range: { kind: 'time', label: '1 año', dateFrom: monthsAgo(12) } },
]

export function rangeFromValue(value: string): DossierRange { return dossierRanges.find(item => item.value === value)?.range ?? { kind: 'all' } }
export function percent(record: DossierRecord) { return record.total_games ? Math.round(record.wins * 1000 / record.total_games) / 10 : 0 }
export function resultLabel(record: DossierRecord) { return `${record.wins} V · ${record.draws} T · ${record.losses} D` }
export function normalizeDossier(input: Partial<DossierSummary> | null | undefined): DossierSummary {
  const number = (value: unknown) => Number(value ?? 0)
  const record = (value: Partial<DossierRecord> | undefined): DossierRecord => ({ total_games: number(value?.total_games), wins: number(value?.wins), draws: number(value?.draws), losses: number(value?.losses) })
  return { ...record(input ?? undefined), win_rate: number(input?.win_rate), white: record(input?.white), black: record(input?.black), platforms: (input?.platforms ?? []).map(item => ({ ...record(item), platform: item.platform })), speeds: (input?.speeds ?? []).map(item => ({ ...record(item), speed: item.speed })) }
}

export function classifyFirstMove(san: string | null | undefined) { const move = (san ?? '').replace(/[+#?!]+$/g, ''); return move === 'e4' ? '1.e4' : move === 'd4' ? '1.d4' : move === 'c4' ? '1.c4' : move === 'Nf3' ? '1.Nf3' : 'Otros' }
export function trendLabel(item: TrendItem | null) { if (!item) return 'Muestra insuficiente'; return item.opening ? `${item.eco ?? '—'} · ${item.opening}` : item.label ?? 'Sin datos' }
export function normalizeTrends(input: Partial<DossierTrends> | null | undefined): DossierTrends {
  const number = (value: unknown) => Number(value ?? 0)
  const item = (value: Partial<TrendItem> | null | undefined): TrendItem | null => value ? { total_games: number(value.total_games ?? value.games), games: number(value.games ?? value.total_games), wins: number(value.wins), draws: number(value.draws), losses: number(value.losses), win_rate: number(value.win_rate), label: value.label, color: value.color, eco: value.eco, opening: value.opening } : null
  const comparison = input?.range_vs_history
  return { sample_threshold: number(input?.sample_threshold) || 10, favorite_opening: item(input?.favorite_opening), best_opening: item(input?.best_opening), worst_opening: item(input?.worst_opening), best_color: item(input?.best_color), worst_color: item(input?.worst_color), best_speed: item(input?.best_speed), worst_speed: item(input?.worst_speed), range_vs_history: { range_games: number(comparison?.range_games), range_win_rate: number(comparison?.range_win_rate), all_games: number(comparison?.all_games), all_win_rate: number(comparison?.all_win_rate), win_rate_delta: number(comparison?.win_rate_delta) } }
}
