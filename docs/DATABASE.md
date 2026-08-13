# Base de datos

## Fase 3B aplicada y validada

`202608120003_games_and_sync_runs.sql` crea `games` y `sync_runs`. Deduplica por `account_id + platform + external_game_id`, conserva el PGN original en `pgn`, habilita RLS de lectura por propietario y concede solamente SELECT a `authenticated` para Data API. `get_profile_basic_stats()` concede solamente EXECUTE a `authenticated`; el frontend no tiene escritura directa en estas tablas.

La migración `202608120001_initial_auth_profiles_accounts.sql` crea `profiles` y `chess_accounts`, sus índices, restricciones, trigger común `set_updated_at` y RLS. `profiles.profile_type` admite `self`, `rival`, `student` y `other`; las cuentas admiten `lichess` y `chesscom`. El índice único funcional impide duplicados sin distinguir mayúsculas/minúsculas.

`profiles` pertenece al usuario autenticado. `chess_accounts` pertenece a un `profile` y hereda su propiedad mediante RLS. Ambas tablas están expuestas en Data API, con acceso de filas determinado exclusivamente por sus policies.

La migración `202608120002_chess_account_verification.sql` añade a `chess_accounts` el estado de verificación, fecha y error sanitizado, junto con ratings públicos opcionales de bullet, blitz, rapid y classical. No altera RLS ni policies existentes.

Las partidas se deduplican por `account_id + platform + external_game_id`. El PGN se mantiene inmutable. Todos los cambios se entregan mediante migraciones de Supabase.

`202608120004_grant_sync_backend_write.sql` otorga al backend de la Edge Function los permisos mínimos de escritura. `202608120005_fix_chesscom_played_at_seconds.sql` corrige timestamps de Chess.com. `202608120006_lichess_resumable_backfill.sql` añade cursor de backfill, y `007` a `010` son recuperaciones estrictamente acotadas para Djmaykiss01 que nunca eliminan juegos.
