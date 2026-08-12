import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProfile, deleteProfile, listProfiles, ProfileInput, updateProfile } from '../services/profiles.service'
import { isSupabaseConfigured } from '../services/supabase'

const key = ['profiles']
export const useProfiles = () => useQuery({ queryKey: key, queryFn: listProfiles, enabled: isSupabaseConfigured })
export const useCreateProfile = () => { const client = useQueryClient(); return useMutation({ mutationFn: (input: ProfileInput) => createProfile(input), onSuccess: () => client.invalidateQueries({ queryKey: key }) }) }
export const useUpdateProfile = () => { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<ProfileInput> }) => updateProfile(id, input), onSuccess: () => client.invalidateQueries({ queryKey: key }) }) }
export const useDeleteProfile = () => { const client = useQueryClient(); return useMutation({ mutationFn: deleteProfile, onSuccess: () => client.invalidateQueries({ queryKey: key }) }) }
