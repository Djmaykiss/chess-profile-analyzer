# Roadmap

Fase 3C.1 en curso: resumen agregado seguro por perfil y rangos por cantidad o tiempo. Aperturas, repertorio, scouting, comparación y Stockfish permanecen pendientes.

Fase 3C.2 en curso: aperturas reales, respuestas con negras por primera jugada y tendencias con muestra mínima. Repertorio, scouting, comparación avanzada y Stockfish continúan pendientes.

Fase 3C.3 validada: árbol de repertorio real derivado de la línea principal de PGN, con indexación reanudable por backend.

Fase 3C.4 validada: scouting estadístico, preparación sin engine, comparación y head-to-head entre perfiles propios. Stockfish continúa pendiente.

Actualización: Fases 3A y 3B están validadas y congeladas.

1. Base visual y navegación: completada.
2. Supabase Auth, RLS y CRUD persistente de perfiles/cuentas: completada, validada y congelada. Data API está habilitada y el aislamiento RLS pasó 13/13 pruebas.
3. Verificación pública de cuentas Lichess y Chess.com: completada y validada.
4. Importación y normalización de partidas Lichess/Chess.com, sincronización incremental, deduplicación, página de partidas y estadísticas básicas: completada y congelada.
5. Dossier, análisis avanzado, Stockfish y entrenamiento.
Fase 3D.2 completada localmente: cola persistente y segura de análisis, cancelación, estado y contrato para worker futuro. No hay engine, worker ni análisis de partidas todavía; la siguiente fase implementará un worker dedicado y un análisis manual controlado.
