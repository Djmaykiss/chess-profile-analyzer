import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dossierRanges, EMPTY_DOSSIER, normalizeDossier, percent, rangeFromValue, resultLabel } from '../src/features/dossier/dossier-formatters.ts'

const migration = readFileSync(new URL('../supabase/migrations/202608120011_dossier_analytics.sql', import.meta.url), 'utf8')
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

console.log('Dossier analytics contract tests passed.')
