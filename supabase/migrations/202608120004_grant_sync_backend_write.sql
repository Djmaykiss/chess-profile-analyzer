-- Permit the server-side sync Edge Function to persist sync metadata and games.
-- This role is used only by the Edge Function runtime; browser clients remain
-- governed by the existing authenticated grants and RLS policies.
GRANT SELECT, INSERT, UPDATE
ON TABLE public.sync_runs
TO service_role;

GRANT SELECT, INSERT
ON TABLE public.games
TO service_role;
