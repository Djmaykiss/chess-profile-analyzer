-- Reconciles the one historical cursor reconstructed from PGN played_at.
-- Lichess pagination must use its own lastMoveAt cursor. Replaying pages is
-- safe because games remain protected by UNIQUE(account_id, platform, external_game_id).
UPDATE public.chess_accounts
SET lichess_backfill_until = FLOOR(EXTRACT(EPOCH FROM now()) * 1000)::bigint,
    lichess_backfill_complete = false,
    lichess_backfill_updated_at = now()
WHERE id = '92431cbd-067a-4045-a503-bc3a96f5ffe0'::uuid
  AND platform = 'lichess';
