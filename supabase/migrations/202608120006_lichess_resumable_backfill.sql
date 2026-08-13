-- Persist Lichess backfill state so each Edge Function execution imports one
-- bounded page and can continue safely after runtime limits.
ALTER TABLE public.chess_accounts
  ADD COLUMN lichess_backfill_until bigint,
  ADD COLUMN lichess_backfill_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN lichess_backfill_updated_at timestamptz;

ALTER TABLE public.sync_runs
  ADD COLUMN sync_scope text NOT NULL DEFAULT 'incremental'
    CHECK (sync_scope IN ('backfill', 'incremental')),
  ADD COLUMN has_more boolean NOT NULL DEFAULT false,
  ADD COLUMN backfill_complete boolean;

-- Existing completed Lichess imports were complete historical imports.
UPDATE public.chess_accounts
SET lichess_backfill_complete = true,
    lichess_backfill_updated_at = last_sync_at
WHERE platform = 'lichess'
  AND last_sync_at IS NOT NULL;

-- Djmaykiss01 has a persisted partial backfill. Resume strictly before its
-- oldest stored game; existing PGNs and games are preserved.
UPDATE public.chess_accounts AS account
SET lichess_backfill_until = cursor.oldest_ms - 1,
    lichess_backfill_complete = false,
    lichess_backfill_updated_at = now()
FROM (
  SELECT account_id, FLOOR(EXTRACT(EPOCH FROM MIN(played_at)) * 1000)::bigint AS oldest_ms
  FROM public.games
  WHERE account_id = '92431cbd-067a-4045-a503-bc3a96f5ffe0'::uuid
    AND platform = 'lichess'
  GROUP BY account_id
) AS cursor
WHERE account.id = cursor.account_id;

CREATE INDEX games_account_played_at_desc_idx
  ON public.games (account_id, played_at DESC);
