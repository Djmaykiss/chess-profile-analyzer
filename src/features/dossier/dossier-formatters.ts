import { DossierRecord, DossierRange, DossierSummary } from './dossier.types'

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
