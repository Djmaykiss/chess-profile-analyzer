import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const safeError = 'No se pudo completar la sincronización.'
const messageFor = (stage: string) => stage === 'session' ? 'Sesión inválida.' : stage === 'profile' || stage === 'account' ? 'La cuenta no pertenece al perfil.' : stage === 'sync_run' ? 'Error al guardar sincronización.' : stage === 'lichess' ? 'Error al consultar Lichess.' : 'Error interno de sincronización.'
const headers = (pgn: string) => Object.fromEntries([...pgn.matchAll(/^\[([^ ]+) "(.*)"\]$/gm)].map(([, key, value]) => [key, value]))
const resultFor = (value: string, color: string) => value === '1/2-1/2' ? 'draw' : (value === '1-0') === (color === 'white') ? 'win' : 'loss'
const playedAt = (raw: any, header: Record<string, string>) => { const timestamp = raw.end_time ?? raw.lastMoveAt ?? raw.createdAt; if (timestamp) return new Date(Number(timestamp)).toISOString(); const value = Date.parse(`${header.UTCDate ?? header.Date ?? ''} ${header.UTCTime ?? '00:00:00'}`); return Number.isNaN(value) ? new Date().toISOString() : new Date(value).toISOString() }
const toGame = (account: any, profileId: string, id: string, pgn: string, raw: any = {}) => { const h = headers(pgn); const white = h.White ?? raw.white?.username; const black = h.Black ?? raw.black?.username; const color = white?.toLowerCase() === account.username.toLowerCase() ? 'white' : 'black'; return { profile_id: profileId, account_id: account.id, platform: account.platform, external_game_id: id, game_url: raw.url ?? h.Site ?? null, played_at: playedAt(raw, h), white_username: white, black_username: black, white_rating: Number(h.WhiteElo ?? raw.white?.rating) || null, black_rating: Number(h.BlackElo ?? raw.black?.rating) || null, player_color: color, result: resultFor(h.Result ?? '1/2-1/2', color), rated: raw.rated ?? null, speed: raw.time_class ?? raw.speed ?? null, time_control: raw.time_control ?? h.TimeControl ?? null, eco: raw.eco?.split('/').pop() ?? h.ECO ?? null, opening: raw.opening ?? h.Opening ?? null, termination: raw.termination ?? h.Termination ?? null, pgn } }
async function fetchWithRetry(url: string, init?: RequestInit) { for (let attempt = 0; attempt < 3; attempt += 1) { const response = await fetch(url, init); if (response.status !== 429 || attempt === 2) return response; await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1))) } throw new Error('unreachable') }
async function upsertBatches(admin: any, games: any[]) { for (let offset = 0; offset < games.length; offset += 200) { const { error } = await admin.from('games').upsert(games.slice(offset, offset + 200), { onConflict: 'account_id,platform,external_game_id', ignoreDuplicates: true }); if (error) throw error } }

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  let admin: any; let runId: string | undefined; let stage = 'session'
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return Response.json({ error: 'No autorizado' }, { status: 401, headers: cors })
    const url = Deno.env.get('SUPABASE_URL')!; const anon = Deno.env.get('SUPABASE_ANON_KEY')!; const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return Response.json({ error: 'No autorizado' }, { status: 401, headers: cors })
    const { accountId, profileId } = await request.json(); stage = 'profile'
    admin = createClient(url, service)
    const { data: profile } = await admin.from('profiles').select('id').eq('id', profileId).eq('user_id', user.id).single()
    if (!profile) return Response.json({ error: 'Perfil no encontrado' }, { status: 403, headers: cors })
    stage = 'account'; const { data: account } = await admin.from('chess_accounts').select('*').eq('id', accountId).eq('profile_id', profileId).eq('verification_status', 'verified').eq('is_active', true).single()
    if (!account) return Response.json({ error: 'Cuenta no sincronizable' }, { status: 404, headers: cors })
    stage = 'sync_run'; const { data: run, error: runError } = await admin.from('sync_runs').insert({ profile_id: profileId, account_id: accountId, status: 'running' }).select().single()
    if (runError) throw runError
    runId = run.id
    const since = account.last_sync_at ? Date.parse(account.last_sync_at) : 0
    let games: any[] = []
    if (account.platform === 'chesscom') {
      const archiveResponse = await fetchWithRetry(`https://api.chess.com/pub/player/${encodeURIComponent(account.username)}/games/archives`)
      if (!archiveResponse.ok) throw new Error('archive unavailable')
      const { archives = [] } = await archiveResponse.json()
      for (const archive of archives.filter((item: string) => !since || Date.parse(item.replace('/games/', '/01/')) >= since - 31 * 864e5)) { const response = await fetchWithRetry(archive); if (!response.ok) throw new Error('archive unavailable'); const data = await response.json(); games.push(...(data.games ?? []).filter((game: any) => game.rules === 'chess' && game.pgn).map((game: any) => toGame(account, profileId, game.uuid ?? game.url, game.pgn, game))) }
    } else {
      stage = 'lichess'; const response = await fetchWithRetry(`https://lichess.org/api/games/user/${encodeURIComponent(account.username)}?pgnInJson=true&clocks=false${since ? `&since=${since}` : ''}`, { headers: { Accept: 'application/x-ndjson' } })
      if (!response.ok) throw new Error('lichess unavailable')
      const text = await response.text(); games = text.trim() ? text.trim().split('\n').map(line => JSON.parse(line)).filter(game => game.pgn).map(game => toGame(account, profileId, game.id, game.pgn, game)) : []
    }
    const { count: before } = await admin.from('games').select('id', { count: 'exact', head: true }).eq('account_id', accountId)
    await upsertBatches(admin, games)
    const { count: after } = await admin.from('games').select('id', { count: 'exact', head: true }).eq('account_id', accountId)
    const imported = Math.max(0, (after ?? 0) - (before ?? 0)); const completedAt = new Date().toISOString()
    await admin.from('chess_accounts').update({ last_sync_at: completedAt }).eq('id', accountId)
    await admin.from('sync_runs').update({ status: 'completed', finished_at: completedAt, games_found: games.length, games_imported: imported, games_skipped: games.length - imported }).eq('id', runId)
    return Response.json({ runId, found: games.length, imported, skipped: games.length - imported }, { headers: cors })
  } catch (_error) { const message = messageFor(stage); console.error(`sync-chess-account failed at ${stage}`); if (admin && runId) await admin.from('sync_runs').update({ status: 'failed', finished_at: new Date().toISOString(), error_message: message }).eq('id', runId); return Response.json({ error: message }, { status: 500, headers: cors }) }
})
