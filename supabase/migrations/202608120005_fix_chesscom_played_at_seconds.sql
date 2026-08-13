-- Chess.com returns end_time as Unix seconds. The original importer treated
-- that value as milliseconds, storing dates in 1970. Reconstruct the original
-- Unix-second value from the malformed timestamp and convert it correctly.
UPDATE public.games
SET played_at = to_timestamp(EXTRACT(EPOCH FROM played_at) * 1000)
WHERE platform = 'chesscom'
  AND account_id = 'f5bbc1eb-2bf7-4f2d-b3ab-ff95eca56353'::uuid
  AND played_at < '2000-01-01'::timestamptz;
