# Base de datos

## Fase 3C.1: dossier analítico

`202608120011_dossier_analytics.sql` añade únicamente dos índices de lectura sobre `games` y el RPC `get_profile_dossier_summary(target_profile_id, p_recent_limit, p_date_from)`. No modifica filas de partidas, `sync_runs`, RLS, grants existentes ni la Edge Function.

El RPC es `SECURITY INVOKER`, exige `auth.uid()` y comprueba que el perfil solicitado pertenezca al usuario actual. Solo `authenticated` recibe `EXECUTE`; `anon` no recibe acceso. Los parámetros de rango son excluyentes: `p_recent_limit` admite solamente 20, 50 o 100 y usa orden estable de partidas; `p_date_from` cubre rangos temporales. Devuelve agregados de W/D/L, color, plataforma y ritmo como JSONB, sin entregar PGN al navegador.

## Fase 3C.2: aperturas y tendencias

`202608120012_dossier_openings_trends.sql` añade índices de lectura y cuatro RPCs `SECURITY INVOKER`: el alcance privado reutilizable del dossier, estadísticas de aperturas por color, respuestas negras ante la primera SAN rival y tendencias. Cada función exige `auth.uid()`, valida el perfil propio y revoca `EXECUTE` de `PUBLIC` y `anon`; únicamente `authenticated` puede ejecutarlas.

La primera jugada rival se extrae de los PGN en PostgreSQL de forma acotada, sin modificar el PGN ni `games`. Las tendencias de apertura exigen un mínimo de 10 partidas. La migración no altera importación, sincronización, RLS existente, grants existentes, `sync_runs` ni datos.

## Fase 3B aplicada y validada

`202608120003_games_and_sync_runs.sql` crea `games` y `sync_runs`. Deduplica por `account_id + platform + external_game_id`, conserva el PGN original en `pgn`, habilita RLS de lectura por propietario y concede solamente SELECT a `authenticated` para Data API. `get_profile_basic_stats()` concede solamente EXECUTE a `authenticated`; el frontend no tiene escritura directa en estas tablas.

La migración `202608120001_initial_auth_profiles_accounts.sql` crea `profiles` y `chess_accounts`, sus índices, restricciones, trigger común `set_updated_at` y RLS. `profiles.profile_type` admite `self`, `rival`, `student` y `other`; las cuentas admiten `lichess` y `chesscom`. El índice único funcional impide duplicados sin distinguir mayúsculas/minúsculas.

`profiles` pertenece al usuario autenticado. `chess_accounts` pertenece a un `profile` y hereda su propiedad mediante RLS. Ambas tablas están expuestas en Data API, con acceso de filas determinado exclusivamente por sus policies.

La migración `202608120002_chess_account_verification.sql` añade a `chess_accounts` el estado de verificación, fecha y error sanitizado, junto con ratings públicos opcionales de bullet, blitz, rapid y classical. No altera RLS ni policies existentes.

Las partidas se deduplican por `account_id + platform + external_game_id`. El PGN se mantiene inmutable. Todos los cambios se entregan mediante migraciones de Supabase.

`202608120004_grant_sync_backend_write.sql` otorga al backend de la Edge Function los permisos mínimos de escritura. `202608120005_fix_chesscom_played_at_seconds.sql` corrige timestamps de Chess.com. `202608120006_lichess_resumable_backfill.sql` añade cursor de backfill, y `007` a `010` son recuperaciones estrictamente acotadas para Djmaykiss01 que nunca eliminan juegos.
