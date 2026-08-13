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
