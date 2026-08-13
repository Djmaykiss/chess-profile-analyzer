-- Reconcile the last timestamp-boundary gap. Lichess pages can split games
-- with the same lastMoveAt value; the updated function overlaps that boundary
-- and safely skips already stored games through the unique game identity.
UPDATE public.chess_accounts
SET lichess_backfill_until = FLOOR(EXTRACT(EPOCH FROM now()) * 1000)::bigint,
    lichess_backfill_complete = false,
    lichess_backfill_updated_at = now()
WHERE id = '92431cbd-067a-4045-a503-bc3a96f5ffe0'::uuid
  AND platform = 'lichess';
