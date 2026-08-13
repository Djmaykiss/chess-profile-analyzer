-- Reopens only Djmaykiss01 after the previously deployed function treated a
-- 500-record raw page with variants as a partial page. Existing games stay
-- intact and are idempotently skipped by the unique game identity constraint.
UPDATE public.chess_accounts
SET lichess_backfill_until = FLOOR(EXTRACT(EPOCH FROM now()) * 1000)::bigint,
    lichess_backfill_complete = false,
    lichess_backfill_updated_at = now()
WHERE id = '92431cbd-067a-4045-a503-bc3a96f5ffe0'::uuid
  AND platform = 'lichess';
