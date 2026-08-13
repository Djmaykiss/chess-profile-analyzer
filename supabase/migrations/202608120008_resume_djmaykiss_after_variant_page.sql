-- The first reconciliation page contained 500 raw Lichess records but only
-- 498 standard PGNs. Resume from the complete raw history; existing games are
-- safely skipped by the unique account/platform/external-game-id constraint.
UPDATE public.chess_accounts
SET lichess_backfill_until = FLOOR(EXTRACT(EPOCH FROM now()) * 1000)::bigint,
    lichess_backfill_complete = false,
    lichess_backfill_updated_at = now()
WHERE id = '92431cbd-067a-4045-a503-bc3a96f5ffe0'::uuid
  AND platform = 'lichess';
