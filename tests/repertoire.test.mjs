import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseMainlineSan } from '../supabase/functions/build-repertoire-index/parser.ts'

assert.deepEqual(parseMainlineSan('[Event "QA"]\n\n1. e4 e5 2. Nf3 Nc6 1-0'), ['e4', 'e5', 'Nf3', 'Nc6'])
assert.deepEqual(parseMainlineSan('1. e4 {comment} e5 (1... c5 2. Nf3) 2. Nf3 $1 Nc6 1/2-1/2'), ['e4', 'e5', 'Nf3', 'Nc6'])
assert.deepEqual(parseMainlineSan('1. O-O O-O-O 2. e8=Q+ Kf7# *'), ['O-O', 'O-O-O', 'e8=Q+', 'Kf7#'])
assert.deepEqual(parseMainlineSan('1. d4 ; ignored\n d5 2. c4 e6'), ['d4', 'd5', 'c4', 'e6'])
const migration = readFileSync(new URL('../supabase/migrations/202608120014_dossier_repertoire_tree.sql', import.meta.url), 'utf8')
for (const required of ['create table public.game_repertoire_moves', 'unique (game_id, ply)', 'player_color text not null', 'uci text', 'fen_after text', 'move_sequence text not null', 'alter table public.game_repertoire_moves enable row level security', 'create table public.repertoire_index_jobs', 'create or replace function public.get_profile_repertoire_tree', 'security invoker', 'p_max_ply > 12', 'p_min_games', 'repertoire_moves_select_own_profiles']) assert.ok(migration.includes(required), `Missing repertoire requirement: ${required}`)
console.log('Repertoire parser and migration tests passed.')
