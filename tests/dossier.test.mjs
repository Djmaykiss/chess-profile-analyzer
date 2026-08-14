import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { classifyFirstMove, dossierRanges, EMPTY_DOSSIER, normalizeDossier, normalizeTrends, percent, rangeFromValue, resultLabel, trendLabel } from '../src/features/dossier/dossier-formatters.ts'

const migration = readFileSync(new URL('../supabase/migrations/202608120011_dossier_analytics.sql', import.meta.url), 'utf8')
const openingsMigration = readFileSync(new URL('../supabase/migrations/202608120012_dossier_openings_trends.sql', import.meta.url), 'utf8')
const scopeFixMigration = readFileSync(new URL('../supabase/migrations/202608120013_fix_dossier_scope_return.sql', import.meta.url), 'utf8')
const scoutingMigration = readFileSync(new URL('../supabase/migrations/202608120016_dossier_scouting_comparison.sql', import.meta.url), 'utf8')
const securityRequirements = ['security invoker', 'auth.uid()', 'Profile is not accessible to the current user', 'revoke all on function public.get_profile_dossier_summary(uuid, integer, timestamptz) from public, anon', 'grant execute on function public.get_profile_dossier_summary(uuid, integer, timestamptz) to authenticated']
for (const requirement of securityRequirements) assert.ok(migration.includes(requirement), `Missing dossier security requirement: ${requirement}`)
assert.ok(migration.includes('p_recent_limit is not null and p_date_from is not null'), 'Recent and date ranges must be mutually exclusive.')
assert.ok(migration.includes('p_recent_limit not in (20, 50, 100)'), 'Only supported recent limits are accepted.')
assert.ok(migration.includes("row_number() over (order by g.played_at desc, g.id desc)"), 'Recent ranges must use game count, not date_from.')

assert.deepEqual(dossierRanges.filter(item => item.range.kind === 'recent').map(item => item.range.recentLimit), [20, 50, 100])
assert.equal(dossierRanges.filter(item => item.range.kind === 'time').length, 3)
assert.deepEqual(rangeFromValue('recent-50'), { kind: 'recent', recentLimit: 50 })
assert.equal(rangeFromValue('all').kind, 'all')
assert.equal(rangeFromValue('unknown').kind, 'all')

const summary = normalizeDossier({ total_games: '10', wins: '5', draws: '2', losses: '3', win_rate: '50', white: { total_games: '4', wins: '3', draws: '1', losses: '0' }, black: { total_games: '6', wins: '2', draws: '1', losses: '3' }, platforms: [{ platform: 'lichess', total_games: '7', wins: '4', draws: '1', losses: '2' }], speeds: [{ speed: 'blitz', total_games: '8', wins: '4', draws: '2', losses: '2' }] })
assert.deepEqual({ total: summary.total_games, w: summary.wins, d: summary.draws, l: summary.losses }, { total: 10, w: 5, d: 2, l: 3 })
assert.equal(summary.white.total_games + summary.black.total_games, 10)
assert.equal(summary.platforms[0].platform, 'lichess')
assert.equal(summary.speeds[0].speed, 'blitz')
assert.equal(percent({ total_games: 0, wins: 0, draws: 0, losses: 0 }), 0, 'Win rate must not divide by zero.')
assert.equal(percent({ total_games: 3, wins: 1, draws: 1, losses: 1 }), 33.3)
assert.equal(resultLabel(summary), '5 V · 2 T · 3 D')
assert.deepEqual(normalizeDossier(null), EMPTY_DOSSIER, 'Profiles without games return an empty dossier safely.')

for (const required of ['p_color not in (\'white\', \'black\')', 'p_limit < 1 or p_limit > 20', "p_sort not in ('frequency', 'best', 'worst')", 'regexp_replace(g.pgn', "when 'e4' then '1.e4'", "when 'd4' then '1.d4'", "when 'c4' then '1.c4'", "when 'Nf3' then '1.Nf3'", 'having count(*) >= 10', 'security invoker']) assert.ok(openingsMigration.includes(required), `Missing openings/trends requirement: ${required}`)
assert.ok(scopeFixMigration.includes('with ranked_game_ids as') && scopeFixMigration.includes('join ranked_game_ids ranked on ranked.id = g.id'), 'The scope helper must return only public.games columns.')
assert.equal(classifyFirstMove('e4'), '1.e4')
assert.equal(classifyFirstMove('d4+'), '1.d4')
assert.equal(classifyFirstMove('c4?!'), '1.c4')
assert.equal(classifyFirstMove('Nf3#'), '1.Nf3')
assert.equal(classifyFirstMove('g3'), 'Otros')
assert.equal(classifyFirstMove(null), 'Otros')
const trends = normalizeTrends({ sample_threshold: '10', best_opening: { eco: 'C20', opening: 'King Pawn Game', games: '12', wins: '8', draws: '2', losses: '2', win_rate: '66.7' }, range_vs_history: { range_games: '20', range_win_rate: '55', all_games: '100', all_win_rate: '50', win_rate_delta: '5' } })
assert.equal(trends.sample_threshold, 10)
assert.equal(trends.best_opening?.games, 12)
assert.equal(trendLabel(trends.best_opening), 'C20 · King Pawn Game')
assert.equal(trendLabel(null), 'Muestra insuficiente')
assert.equal(trends.range_vs_history.win_rate_delta, 5)
for (const required of ['get_profile_scouting', 'compare_profile_dossiers', 'security invoker', 'auth.uid()', 'from_5_to_9', 'evidencia fuerte', 'left_profile_id = right_profile_id', 'left_aliases', 'right_aliases', 'revoke all on function public.get_profile_scouting', 'grant execute on function public.compare_profile_dossiers']) assert.ok(scoutingMigration.includes(required), `Missing scouting/comparison requirement: ${required}`)

console.log('Dossier analytics contract tests passed.')
