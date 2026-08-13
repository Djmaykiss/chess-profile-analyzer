# Integraciones

## Preparación de Fase 3B (sin desplegar)

La Edge Function `sync-chess-account` valida JWT, comprueba que perfil y cuenta pertenecen al usuario, y solo sincroniza cuentas verificadas y activas. Requiere `SUPABASE_SERVICE_ROLE_KEY` exclusivamente como secreto backend de la Edge Function; nunca se expone, registra, ni lleva prefijo `VITE_`.

Lichess y Chess.com se consultan solo mediante datos públicos. La verificación de Fase 3A usa `GET https://lichess.org/api/user/{username}` y los endpoints publicados de Chess.com `GET /pub/player/{username}` y `GET /pub/player/{username}/stats`.

Ambas APIs permiten CORS para las consultas públicas actuales, por lo que la capa centralizada `src/services/chess-platforms/` consulta desde el navegador sin secretos ni backend. La persistencia se hace después mediante Supabase y sigue sometida a RLS. Los estados son `pending`, `verified`, `not_found` y `error`; los errores se sanitizan. La importación de partidas queda explícitamente fuera de esta fase.
