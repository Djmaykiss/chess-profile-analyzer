import { requireSupabase } from './supabase'

export const signIn = (email: string, password: string) => requireSupabase().auth.signInWithPassword({ email, password })
export const signUp = (email: string, password: string) => requireSupabase().auth.signUp({ email, password })
export const signOut = () => requireSupabase().auth.signOut()
