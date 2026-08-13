export function playedAt(raw: { end_time?: number | string; lastMoveAt?: number | string; createdAt?: number | string }, header: Record<string, string>) {
  if (raw.end_time !== undefined && raw.end_time !== null) return new Date(Number(raw.end_time) * 1000).toISOString()
  const timestamp = raw.lastMoveAt ?? raw.createdAt
  if (timestamp !== undefined && timestamp !== null) return new Date(Number(timestamp)).toISOString()
  const value = Date.parse(`${header.UTCDate ?? header.Date ?? ''} ${header.UTCTime ?? '00:00:00'}`)
  return Number.isNaN(value) ? new Date().toISOString() : new Date(value).toISOString()
}

export function splitNdjson(chunk: string, remainder = '') {
  const lines = `${remainder}${chunk}`.split('\n')
  return { complete: lines.slice(0, -1).filter(Boolean), remainder: lines.at(-1) ?? '' }
}

export const lichessPageSize = 500
export function lichessPageUrl(username: string, options: { until?: number; since?: number }) {
  const params = new URLSearchParams({ pgnInJson: 'true', clocks: 'false', max: String(lichessPageSize) })
  if (options.until) params.set('until', String(options.until))
  if (options.since) params.set('since', String(options.since))
  return `https://lichess.org/api/games/user/${encodeURIComponent(username)}?${params}`
}

export function nextLichessBackfillState(received: number, oldest: number | undefined) {
  const hasMore = received === lichessPageSize && typeof oldest === 'number' && Number.isFinite(oldest)
  // Keep the boundary timestamp in the next request. Lichess can assign the
  // same lastMoveAt millisecond to multiple games; the unique game identity
  // safely absorbs this one-record overlap without skipping siblings.
  return { hasMore, backfillComplete: !hasMore, until: hasMore ? oldest : null }
}
