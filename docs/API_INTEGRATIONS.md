# Integraciones

## Fase 3B: importación aplicada

La Edge Function `sync-chess-account` valida JWT, comprueba que perfil y cuenta pertenecen al usuario, y solo sincroniza cuentas verificadas y activas. Requiere `SUPABASE_SERVICE_ROLE_KEY` exclusivamente como secreto backend de la Edge Function; nunca se expone, registra, ni lleva prefijo `VITE_`.

Lichess y Chess.com se consultan solo mediante datos públicos. La verificación de Fase 3A usa `GET https://lichess.org/api/user/{username}` y los endpoints publicados de Chess.com `GET /pub/player/{username}` y `GET /pub/player/{username}/stats`.

Lichess se procesa como NDJSON en streaming, con páginas de 500 y cursor `until` persistente. El cursor solapa el timestamp de borde para no saltar partidas con el mismo `lastMoveAt`; los repetidos se absorben por el índice único. Chess.com recorre sus archives públicos y convierte `end_time` de segundos Unix a milliseconds antes de persistir `played_at`.

Las sincronizaciones incrementales usan `last_sync_at`; los runs antiguos en `running` se cierran con un error sanitizado. Los estados de verificación son `pending`, `verified`, `not_found` y `error`.
