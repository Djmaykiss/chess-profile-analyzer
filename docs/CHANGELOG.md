# Changelog

## Próximo — Fase 3D.3 en validación local

- Añadido worker backend separado y Dockerfile reproducible para Stockfish 17.1 desde fuente oficial.
- Añadidas políticas versionadas de perspectiva, mate, clasificación y accuracy estimada.
- Sin análisis masivo ni despliegue permanente de worker.

## 0.9.0 — Fase 3D.2

- Añadida infraestructura segura de cola para futuros análisis Stockfish: jobs, análisis versionados y evaluaciones por ply.
- Añadidos RPCs privados para solicitar, cancelar y consultar análisis sin escritura directa desde el frontend.
- Preparado contrato backend de claim, heartbeat y recuperación de trabajos obsoletos, sin crear worker ni ejecutar engine.
- Añadida migración 018 para restringir `authenticated` a `SELECT` en las tablas de análisis.

## 0.8.0 — Fase 3C.4

- Añadidos RPCs de scouting, comparación privada y enfrentamientos directos resueltos por aliases de cuentas.
- Añadidos paneles de scouting, preparación estadística, comparación y head-to-head al Dossier.
- Validada la seguridad de los RPCs frente a anon y el uso exclusivo de datos reales, aliases de cuenta y muestras con confianza explícita.

## 0.7.0 — Fase 3C.3

- Añadido índice derivado `game_repertoire_moves` y cursor analítico reanudable por perfil.
- Añadida Edge Function `build-repertoire-index` para extraer exclusivamente la línea principal de PGN en lotes idempotentes.
- Añadido árbol de repertorio por color, rango, profundidad y mínimo de partidas.
- Validada la indexación real de Michael Perez: 10.459 partidas y 662.133 movimientos derivados, sin tocar PGN ni partidas fuente.
- Añadida migración 015 para desambiguar el contrato del RPC del árbol, sin cambios de datos ni permisos.

## 0.6.0 — Fase 3C.2

- Añadidas estadísticas de aperturas reales por color, con ECO, nombre, W/D/L y win rate.
- Añadido análisis de respuestas con negras basado en la primera SAN real del PGN.
- Añadidas tendencias de apertura, color y ritmo con muestra mínima de 10 partidas.
- Añadida migración 012 con RPCs de solo lectura `SECURITY INVOKER` y sin cambios en Fase 3B.
- Añadida migración 013 para corregir el retorno del helper de alcance sin cambiar datos ni seguridad.

## 0.5.0 — Fase 3C.1

- Añadido Dossier privado por perfil con agregados PostgreSQL de partidas reales.
- Añadidos rangos excluyentes por cantidad (20, 50, 100) y tiempo (3, 6, 12 meses o todo).
- Añadida migración 011 con índices analíticos y RPC `SECURITY INVOKER`, sin tocar importación, sincronización ni RLS de Fase 3B.

## 0.4.0 — Fase 3B validada

- Añadida Edge Function `sync-chess-account` para importación real de Lichess y Chess.com.
- Añadidas tablas `games` y `sync_runs`, estadísticas básicas, filtros, paginación y detalle PGN.
- Añadido streaming Lichess, cursor persistente reanudable de 500 registros y recuperación de runs antiguos.
- Confirmada deduplicación por identidad única y conversión correcta de timestamps de Chess.com.
- Aplicadas migraciones 003 a 010. Fase 3B congelada.

## 0.3.0 — Fase 3A validada

- Añadida capa centralizada para verificar perfiles públicos de Lichess y Chess.com.
- Añadidos estados de verificación y normalización de ratings públicos.
- Añadida migración versionada para los metadatos de verificación, pendiente de aplicar en remoto.

## 0.2.1

- Validada la Fase 2: Auth, persistencia, Data API y RLS.
- Confirmado aislamiento multiusuario en PostgreSQL/RLS: 13 PASS, 0 FAIL.
- Congelada la base de Auth/RLS; la integración Lichess/Chess.com permanece fuera de alcance.
- Documentado que Confirm email está temporalmente OFF para QA y requiere revisión antes de producción.

## 0.2.0

- Añadidos Supabase Auth, restauración de sesión, logout y protección de rutas.
- Reemplazado el almacenamiento demo por servicios Supabase y hooks TanStack Query.
- Añadida migración versionada para perfiles, cuentas, trigger de fechas e RLS.

## 0.1.0

- Creada la aplicación React/TypeScript/Vite.
- Implementados login y registro demostrativos, dashboard, perfiles y cuentas.
- Añadida documentación de producto y arquitectura.
