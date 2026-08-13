# Base de datos

## Preparación de Fase 3B (sin aplicar)

La migración pendiente `202608120003_games_and_sync_runs.sql` crea `games` y `sync_runs`. Deduplica por `account_id + platform + external_game_id`, conserva el PGN original en `pgn`, habilita RLS de lectura por propietario y concede solamente SELECT a `authenticated` para Data API. `get_profile_basic_stats()` concede solamente EXECUTE a `authenticated`; el frontend no tiene escritura directa en estas tablas.

La migración `202608120001_initial_auth_profiles_accounts.sql` crea `profiles` y `chess_accounts`, sus índices, restricciones, trigger común `set_updated_at` y RLS. `profiles.profile_type` admite `self`, `rival`, `student` y `other`; las cuentas admiten `lichess` y `chesscom`. El índice único funcional impide duplicados sin distinguir mayúsculas/minúsculas.

`profiles` pertenece al usuario autenticado. `chess_accounts` pertenece a un `profile` y hereda su propiedad mediante RLS. Ambas tablas están expuestas en Data API, con acceso de filas determinado exclusivamente por sus policies.

La migración `202608120002_chess_account_verification.sql` añade a `chess_accounts` el estado de verificación, fecha y error sanitizado, junto con ratings públicos opcionales de bullet, blitz, rapid y classical. No altera RLS ni policies existentes.

Las partidas se deduplican por `platform + external_game_id`. `raw_pgn` se mantiene inmutable. Todos los cambios se entregan mediante migraciones de Supabase.
