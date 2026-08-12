import { requireSupabase } from './supabase'

export type ProfileType = 'self' | 'rival' | 'student' | 'other'
export type Profile = { id: string; user_id: string; display_name: string; avatar_url: string | null; country: string | null; notes: string | null; profile_type: ProfileType; created_at: string; updated_at: string }
export type ProfileInput = Pick<Profile, 'display_name' | 'profile_type'> & Partial<Pick<Profile, 'avatar_url' | 'country' | 'notes'>>

export async function listProfiles() { const { data, error } = await requireSupabase().from('profiles').select('*').order('created_at'); if (error) throw error; return data as Profile[] }
export async function createProfile(input: ProfileInput) { const client = requireSupabase(); const { data: { user } } = await client.auth.getUser(); if (!user) throw new Error('Sesión no válida.'); const { data, error } = await client.from('profiles').insert({ ...input, user_id: user.id }).select().single(); if (error) throw error; return data as Profile }
export async function updateProfile(id: string, input: Partial<ProfileInput>) { const { data, error } = await requireSupabase().from('profiles').update(input).eq('id', id).select().single(); if (error) throw error; return data as Profile }
export async function deleteProfile(id: string) { const { error } = await requireSupabase().from('profiles').delete().eq('id', id); if (error) throw error }
