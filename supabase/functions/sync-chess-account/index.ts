import { createClient } from 'npm:@supabase/supabase-js@2'
import { lichessPageUrl, nextLichessBackfillState, playedAt, splitNdjson } from './normalizers.ts'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const safeError = 'No se pudo completar la sincronización.'
const messageFor = (stage: string) => stage === 'session' ? 'Sesión inválida.' : stage === 'profile' || stage === 'account' ? 'La cuenta no pertenece al perfil.' : stage === 'sync_run' ? 'Error al guardar sincronización.' : stage === 'lichess' ? 'Error al consultar Lichess.' : 'Error interno de sincronización.'
const staleRunMessage = 'La ejecución anterior superó el tiempo máximo y fue cerrada de forma segura.'
const staleRunThresholdMs = 20 * 60 * 1000
const headers = (pgn: string) => Object.fromEntries([...pgn.matchAll(/^\[([^ ]+) "(.*)"\]$/gm)].map(([, key, value]) => [key, value]))
const resultFor = (value: string, color: string) => value === '1/2-1/2' ? 'draw' : (value === '1-0') === (color === 'white') ? 'win' : 'loss'
const toGame = (account: any, profileId: string, id: string, pgn: string, raw: any = {}) => { const h = headers(pgn); const white = h.White ?? raw.white?.username; const black = h.Black ?? raw.black?.username; const color = white?.toLowerCase() === account.username.toLowerCase() ? 'white' : 'black'; return { profile_id: profileId, account_id: account.id, platform: account.platform, external_game_id: id, game_url: raw.url ?? h.Site ?? null, played_at: playedAt(raw, h), white_username: white, black_username: black, white_rating: Number(h.WhiteElo ?? raw.white?.rating) || null, black_rating: Number(h.BlackElo ?? raw.black?.rating) || null, player_color: color, result: resultFor(h.Result ?? '1/2-1/2', color), rated: raw.rated ?? null, speed: raw.time_class ?? raw.speed ?? null, time_control: raw.time_control ?? h.TimeControl ?? null, eco: raw.eco?.split('/').pop() ?? h.ECO ?? null, opening: raw.opening ?? h.Opening ?? null, termination: raw.termination ?? h.Termination ?? null, pgn } }
async function fetchWithRetry(url: string, init?: RequestInit) { for (let attempt = 0; attempt < 3; attempt += 1) { const response = await fetch(url, init); if (response.status !== 429 || attempt === 2) return response; await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1))) } throw new Error('unreachable') }
async function upsertBatches(admin: any, games: any[]) { for (let offset = 0; offset < games.length; offset += 200) { const { error } = await admin.from('games').upsert(games.slice(offset, offset + 200), { onConflict: 'account_id,platform,external_game_id', ignoreDuplicates: true }); if (error) throw error } }
async function requireWrite(operation: PromiseLike<{ error: unknown }>) { const { error } = await operation; if (error) throw error }
async function importLichessStream(response: Response, account: any, profileId: string, admin: any, runId: string) {
  if (!response.body) throw new Error('lichess response body unavailable')
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let remainder = ''; let received = 0; let found = 0; let oldest: number | undefined; let batch: any[] = []
  const flush = async () => { if (!batch.length) return; await upsertBatches(admin, batch); batch = []; await requireWrite(admin.from('sync_runs').update({ games_found: found }).eq('id', runId)) }
  while (true) {
    const { value, done } = await reader.read()
    const split = splitNdjson(decoder.decode(value ?? new Uint8Array(), { stream: !done }), remainder); remainder = split.remainder
    for (const line of split.complete) { const game = JSON.parse(line); received += 1; oldest = Math.min(oldest ?? Number.MAX_SAFE_INTEGER, Number(game.lastMoveAt ?? game.createdAt)); if (!game.pgn || (game.variant && game.variant !== 'standard')) continue; batch.push(toGame(account, profileId, game.id, game.pgn, game)); found += 1; if (batch.length >= 200) await flush() }
    if (done) break
  }
  if (remainder.trim()) { const game = JSON.parse(remainder); received += 1; oldest = Math.min(oldest ?? Number.MAX_SAFE_INTEGER, Number(game.lastMoveAt ?? game.createdAt)); if (game.pgn && (!game.variant || game.variant === 'standard')) { batch.push(toGame(account, profileId, game.id, game.pgn, game)); found += 1 } }
  await flush(); return { received, found, oldest }
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  let admin: any; let runId: string | undefined; let stage = 'session'
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return Response.json({ error: 'No autorizado' }, { status: 401, headers: cors })
    const url = Deno.env.get('SUPABASE_URL'); const anon = Deno.env.get('SUPABASE_ANON_KEY'); const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !anon || !service) throw new Error('missing function runtime configuration')
    const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return Response.json({ error: 'No autorizado' }, { status: 401, headers: cors })
    const { accountId, profileId } = await request.json(); stage = 'profile'
    admin = createClient(url, service)
    const { data: profile } = await admin.from('profiles').select('id').eq('id', profileId).eq('user_id', user.id).single()
    if (!profile) return Response.json({ error: 'Perfil no encontrado' }, { status: 403, headers: cors })
    stage = 'account'; const { data: account } = await admin.from('chess_accounts').select('*').eq('id', accountId).eq('profile_id', profileId).eq('verification_status', 'verified').eq('is_active', true).single()
    if (!account) return Response.json({ error: 'Cuenta no sincronizable' }, { status: 404, headers: cors })
    const staleBefore = new Date(Date.now() - staleRunThresholdMs).toISOString()
    await requireWrite(admin.from('sync_runs').update({ status: 'failed', finished_at: new Date().toISOString(), error_message: staleRunMessage }).eq('account_id', accountId).eq('status', 'running').lt('started_at', staleBefore))
    const { data: activeRun } = await admin.from('sync_runs').select('id').eq('account_id', accountId).eq('status', 'running').gte('started_at', staleBefore).maybeSingle()
    if (activeRun) return Response.json({ error: 'Ya hay una sincronización en curso.' }, { status: 409, headers: cors })
    const isLichessBackfill = account.platform === 'lichess' && !account.lichess_backfill_complete
    stage = 'sync_run'; const { data: run, error: runError } = await admin.from('sync_runs').insert({ profile_id: profileId, account_id: accountId, status: 'running', sync_scope: isLichessBackfill ? 'backfill' : 'incremental' }).select().single()
    if (runError) throw runError
    runId = run.id
    const since = account.last_sync_at ? Date.parse(account.last_sync_at) : 0
    const { count: before } = await admin.from('games').select('id', { count: 'exact', head: true }).eq('account_id', accountId)
    let games: any[] = []; let found = 0; let backfillState = { hasMore: false, backfillComplete: true, until: null as number | null }
    if (account.platform === 'chesscom') {
      const archiveResponse = await fetchWithRetry(`https://api.chess.com/pub/player/${encodeURIComponent(account.username)}/games/archives`)
      if (!archiveResponse.ok) throw new Error('archive unavailable')
      const { archives = [] } = await archiveResponse.json()
      for (const archive of archives.filter((item: string) => !since || Date.parse(item.replace('/games/', '/01/')) >= since - 31 * 864e5)) { const response = await fetchWithRetry(archive); if (!response.ok) throw new Error('archive unavailable'); const data = await response.json(); games.push(...(data.games ?? []).filter((game: any) => game.rules === 'chess' && game.pgn).map((game: any) => toGame(account, profileId, game.uuid ?? game.url, game.pgn, game))) }; found = games.length
    } else {
      stage = 'lichess'; const response = await fetchWithRetry(lichessPageUrl(account.username, isLichessBackfill ? { until: account.lichess_backfill_until ?? Date.now() } : { since }), { headers: { Accept: 'application/x-ndjson' } })
      if (!response.ok) throw new Error('lichess unavailable')
      const page = await importLichessStream(response, account, profileId, admin, runId); found = page.found
      backfillState = isLichessBackfill ? nextLichessBackfillState(page.received, page.oldest) : backfillState
      await requireWrite(admin.from('chess_accounts').update({ lichess_backfill_until: backfillState.until, lichess_backfill_complete: backfillState.backfillComplete, lichess_backfill_updated_at: new Date().toISOString(), ...(backfillState.hasMore ? {} : { last_sync_at: new Date().toISOString() }) }).eq('id', accountId))
    }
    if (account.platform === 'chesscom') await upsertBatches(admin, games)
    const { count: after } = await admin.from('games').select('id', { count: 'exact', head: true }).eq('account_id', accountId)
    const imported = Math.max(0, (after ?? 0) - (before ?? 0)); const completedAt = new Date().toISOString()
    if (account.platform === 'chesscom') await requireWrite(admin.from('chess_accounts').update({ last_sync_at: completedAt }).eq('id', accountId))
    await requireWrite(admin.from('sync_runs').update({ status: 'completed', finished_at: completedAt, games_found: found, games_imported: imported, games_skipped: found - imported, has_more: backfillState.hasMore, backfill_complete: backfillState.backfillComplete }).eq('id', runId))
    return Response.json({ runId, found, imported, skipped: found - imported, hasMore: backfillState.hasMore, backfillComplete: backfillState.backfillComplete }, { headers: cors })
  } catch (_error) { const message = messageFor(stage); const error = _error as { code?: string; message?: string; details?: string; hint?: string }; console.error(JSON.stringify({ stage, code: error.code ?? null, message: error.message ?? null, details: error.details ?? null, hint: error.hint ?? null })); if (admin && runId) await admin.from('sync_runs').update({ status: 'failed', finished_at: new Date().toISOString(), error_message: message }).eq('id', runId); return Response.json({ error: message }, { status: 500, headers: cors }) }
})
