import { loadConfig } from './config.js'
import { Stockfish } from './stockfish.js'
import { analysePgn, pgnHash } from './analysis.js'
import { createAdmin, ClaimedJob, StoredGame } from './supabase.js'
import { ACCURACY_FORMULA_VERSION, CP_LOSS_CAP } from './accuracy.js'
import { CLASSIFICATION_VERSION } from './classifications.js'

const safeMessage = (error: unknown) => error instanceof Error && /pgn|chess|stockfish/i.test(error.message) ? 'No se pudo analizar el PGN de la partida.' : 'El análisis no pudo completarse.'
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
async function runOne() {
  const config = loadConfig(); const admin = createAdmin(config); const { data: claimed, error: claimError } = await admin.rpc('claim_analysis_job', { p_worker_id: config.workerId }); if (claimError) throw claimError
  const job = (claimed?.[0] ?? null) as ClaimedJob | null; if (!job) return false
  const fail = async (error: unknown) => admin.from('game_analysis_jobs').update({ status: 'failed', finished_at: new Date().toISOString(), heartbeat_at: new Date().toISOString(), error_message: safeMessage(error) }).eq('id', job.id)
  let engine: Stockfish | null = null
  try {
    if (job.engine !== 'stockfish' || job.requested_depth !== config.depth) throw new Error('Unsupported analysis configuration')
    const { data: game, error: gameError } = await admin.from('games').select('id,profile_id,pgn').eq('id', job.game_id).single(); if (gameError || !game) throw gameError ?? new Error('Game missing')
    const stored = game as StoredGame; const sourceHash = pgnHash(stored.pgn)
    const { data: duplicate } = await admin.from('game_analysis').select('id').eq('game_id', job.game_id).eq('engine', 'stockfish').eq('engine_version', '17.1').eq('depth', job.requested_depth).eq('analysis_config_hash', job.analysis_config_hash).eq('source_pgn_hash', sourceHash).maybeSingle()
    if (duplicate) { await admin.from('game_analysis_jobs').update({ status: 'completed', progress: 100, finished_at: new Date().toISOString(), heartbeat_at: new Date().toISOString() }).eq('id', job.id); return true }
    engine = new Stockfish(config.stockfishPath); await engine.start()
    const isCancelled = async () => { const { data } = await admin.from('game_analysis_jobs').select('status').eq('id', job.id).single(); return data?.status === 'cancel_requested' }
    const result = await analysePgn(stored.pgn, engine, job.requested_depth, config.movetimeMs, isCancelled, async (done, total) => { if (done === 1 || done === total || done % 5 === 0) await admin.from('game_analysis_jobs').update({ positions_total: total, positions_done: done, progress: Math.floor(done * 100 / total), heartbeat_at: new Date().toISOString() }).eq('id', job.id) })
    if (!result) { await admin.from('game_analysis_jobs').update({ status: 'cancelled', finished_at: new Date().toISOString(), heartbeat_at: new Date().toISOString() }).eq('id', job.id); return true }
    const { data: analysis, error: analysisError } = await admin.from('game_analysis').insert({ game_id: job.game_id, profile_id: job.profile_id, engine: 'stockfish', engine_version: '17.1', depth: job.requested_depth, analysis_config: { cp_loss_cap: CP_LOSS_CAP, depth: job.requested_depth }, analysis_config_hash: job.analysis_config_hash, source_pgn_hash: sourceHash, accuracy_white: result.accuracyWhite, accuracy_black: result.accuracyBlack, accuracy_formula_version: ACCURACY_FORMULA_VERSION, classification_version: CLASSIFICATION_VERSION, summary: result.summary }).select('id').single(); if (analysisError || !analysis) throw analysisError ?? new Error('Analysis insert failed')
    const rows = result.evaluations.map(item => ({ ...item, analysis_id: analysis.id })); for (let offset = 0; offset < rows.length; offset += 100) { const { error } = await admin.from('game_evaluations').insert(rows.slice(offset, offset + 100)); if (error) throw error }
    const { error: completeError } = await admin.from('game_analysis_jobs').update({ status: 'completed', positions_total: result.positionsTotal, positions_done: result.positionsTotal, progress: 100, finished_at: new Date().toISOString(), heartbeat_at: new Date().toISOString(), engine_version: '17.1' }).eq('id', job.id); if (completeError) throw completeError
    return true
  } catch (error) { await fail(error); return true } finally { await engine?.stop() }
}
async function main() { const config = loadConfig(); do { const didRun = await runOne(); if (config.runOnce || !didRun) { if (config.runOnce) break; await pause(config.pollIntervalMs) } } while (true) }
main().catch(error => { console.error(JSON.stringify({ message: safeMessage(error) })); process.exitCode = 1 })
