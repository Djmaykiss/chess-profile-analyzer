import { createClient } from 'npm:@supabase/supabase-js@2'
import { parseMainlineSan } from './parser.ts'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const safeError = (stage: string) => stage === 'session' ? 'Sesión inválida.' : stage === 'profile' ? 'Perfil no disponible.' : 'No se pudo preparar el repertorio.'

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  let stage = 'session'
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    const url = Deno.env.get('SUPABASE_URL'); const anon = Deno.env.get('SUPABASE_ANON_KEY'); const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!token || !url || !anon || !service) return Response.json({ error: 'No autorizado' }, { status: 401, headers: cors })
    const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return Response.json({ error: 'No autorizado' }, { status: 401, headers: cors })
    const { profileId, batchSize = 40 } = await request.json()
    const size = Math.max(1, Math.min(Number(batchSize) || 40, 60))
    const admin = createClient(url, service)
    stage = 'profile'
    const { data: profile } = await admin.from('profiles').select('id').eq('id', profileId).eq('user_id', user.id).single()
    if (!profile) return Response.json({ error: 'Perfil no disponible.' }, { status: 403, headers: cors })
    stage = 'index'
    const { data: existing } = await admin.from('repertoire_index_jobs').select('*').eq('profile_id', profileId).maybeSingle()
    if (existing?.status === 'completed') return Response.json({ completed: true, processedGames: existing.processed_games, indexedMoves: existing.indexed_moves }, { headers: cors })
    let query = admin.from('games').select('id, profile_id, account_id, player_color, played_at, pgn').eq('profile_id', profileId).order('id', { ascending: true }).limit(size)
    if (existing?.last_game_id) query = query.gt('id', existing.last_game_id)
    const { data: games, error: gamesError } = await query
    if (gamesError) throw gamesError
    const rows = (games ?? []).flatMap(game => parseMainlineSan(game.pgn).map((san, index, moves) => ({ game_id: game.id, profile_id: game.profile_id, account_id: game.account_id, player_color: game.player_color, ply: index + 1, san, move_sequence: moves.slice(0, index + 1).join(' '), played_at: game.played_at })))
    if (rows.length) { const { error } = await admin.from('game_repertoire_moves').upsert(rows, { onConflict: 'game_id,ply' }); if (error) throw error }
    const lastGameId = games?.at(-1)?.id ?? existing?.last_game_id ?? null
    const completed = !games?.length || games.length < size
    const { data: job, error: jobError } = await admin.from('repertoire_index_jobs').upsert({ profile_id: profileId, status: completed ? 'completed' : 'running', last_game_id: lastGameId, processed_games: (existing?.processed_games ?? 0) + (games?.length ?? 0), indexed_moves: (existing?.indexed_moves ?? 0) + rows.length, updated_at: new Date().toISOString(), completed_at: completed ? new Date().toISOString() : null, error_message: null }, { onConflict: 'profile_id' }).select().single()
    if (jobError) throw jobError
    return Response.json({ completed, processedGames: job.processed_games, indexedMoves: job.indexed_moves, batchGames: games?.length ?? 0 }, { headers: cors })
  } catch (error) {
    const detail = error as { code?: string; message?: string }
    console.error(JSON.stringify({ stage, code: detail.code ?? null, message: detail.message ?? null }))
    return Response.json({ error: safeError(stage) }, { status: 500, headers: cors })
  }
})
