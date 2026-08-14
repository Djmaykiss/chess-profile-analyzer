# Chess Profile Analyzer

Plataforma multiusuario para centralizar cuentas públicas de Lichess y Chess.com y producir análisis trazables.

## Ejecutar

```bash
npm install
npm run dev
```

## Configuración

1. Copia `.env.example` como `.env` e introduce `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
2. Aplica las migraciones versionadas de `supabase/migrations/` mediante Supabase CLI.

`.env` está ignorado por Git. Nunca uses `service_role` en el frontend.

## Estado de Fase 2

Supabase Auth, sesión persistente, rutas privadas y persistencia de perfiles/cuentas están implementados. El modo demo/local fue eliminado. Data API está habilitada para `profiles` y `chess_accounts`; RLS fue validada con 13 pruebas cruzadas entre usuarios y 0 fallos.

Confirm email está temporalmente desactivado para QA. Debe reactivarse antes de producción o sustituirse por SMTP configurado.

## Verificación de cuentas (Fase 3A)

La aplicación verifica usernames exclusivamente con las APIs públicas de Lichess y Chess.com. No solicita contraseñas ni marca una cuenta como verificada sin una respuesta válida de la plataforma. La importación masiva de partidas sigue fuera de alcance.

## Importación de partidas (Fase 3B)

Fase 3B está validada: `sync-chess-account` importa PGN reales de Lichess y Chess.com, normaliza partidas y deduplica por `account_id + platform + external_game_id`.

Los historiales grandes de Lichess se procesan por páginas de 500 registros con cursor persistente `until`, solapando el timestamp de borde para no perder partidas que comparten `lastMoveAt`. Cada página termina como `completed`; los runs antiguos en `running` se recuperan de forma segura. Tras el backfill, las sincronizaciones son incrementales desde `last_sync_at`.

La auditoría de Djmaykiss01 verificó 4.422 entradas estándar con PGN en la exportación oficial, de las cuales 4.413 son IDs de partida únicos (nueve entradas repetidas por la API). Persisten 4.413 partidas con PGN y cero duplicados.

## Dossier (Fase 3C.1)

La ruta privada `/dossier` presenta un resumen por perfil calculado por PostgreSQL sobre partidas reales: total, victorias, tablas, derrotas, porcentaje de victoria, color, plataforma y ritmo. Soporta rangos por cantidad (últimas 20, 50 o 100) o por tiempo (3 meses, 6 meses, 1 año o todo), sin cargar PGN ni miles de partidas en el navegador.

La base de importación, sincronización, cursores, deduplicación y RLS de Fase 3B permanece congelada. Aperturas, repertorio, scouting, comparación y Stockfish quedan fuera de 3C.1.

## Aperturas y tendencias (Fase 3C.2)

El Dossier incorpora aperturas reales con blancas y negras, respuestas con negras clasificadas desde la primera SAN real del PGN (`1.e4`, `1.d4`, `1.c4`, `1.Nf3` u otros) y tendencias basadas en una muestra mínima de 10 partidas. Las agregaciones se ejecutan en PostgreSQL; el navegador no descarga PGN masivos.

## Repertorio real (Fase 3C.3)

El repertorio se deriva de la línea principal de los PGN mediante lotes reanudables del backend. `game_repertoire_moves` conserva SAN, secuencia y contexto mínimo por ply sin alterar los PGN originales. El navegador recibe solo nodos agregados por rama y puede limitar color, profundidad (hasta 12 ply), muestra mínima y rango.

Fase 3C.3 validada: el indice de Michael Perez contiene 10.459 partidas reales y 662.133 movimientos derivados. El proceso conserva su cursor y usa `UNIQUE(game_id, ply)` para permanecer idempotente sin alterar PGN ni partidas fuente.

## Calidad

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
