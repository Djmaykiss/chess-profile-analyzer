# Worker Stockfish (Fase 3D.3)

`worker/` es un proceso backend separado del frontend. Reclama exclusivamente un trabajo mediante `claim_analysis_job()`, procesa una partida por vez y escribe con `SUPABASE_SERVICE_ROLE_KEY` solo en su runtime. El frontend nunca recibe esta clave.

## Motor reproducible

El `Dockerfile` compila Stockfish **17.1** desde el repositorio oficial [`official-stockfish/Stockfish`](https://github.com/official-stockfish/Stockfish/releases/tag/sf_17.1), tag `sf_17.1`, commit `03e27488f3d21d8ff4dbf3065603afa21dbd0ef3`, para Linux `x86-64-avx2`. El build verifica ese commit antes de compilar; no descarga binarios de origen desconocido.

## Variables de runtime

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STOCKFISH_PATH=/usr/local/bin/stockfish
ANALYSIS_DEPTH=16
ANALYSIS_MOVETIME_MS=
WORKER_POLL_INTERVAL_MS=3000
WORKER_ID=stockfish-worker-1
WORKER_RUN_ONCE=true
```

No añadir estas variables a `.env` del frontend ni versionarlas. `WORKER_RUN_ONCE=true` es el valor seguro inicial: procesa como máximo un job. El worker no ejecuta análisis masivos ni concurrencia paralela.

## Política de resultados

- Evaluaciones desde la perspectiva de blancas.
- Mate se guarda como `score_type = mate`; nunca como centipeones ficticios.
- Clasificación: `cpa-classification-v1`.
- Accuracy: **Accuracy estimada por Chess Profile Analyzer**, `cpa-accuracy-v1`, con `100 * exp(-cp_loss / 120)` y límite de pérdida de 1000 cp.
- Progreso y heartbeat son reales y se actualizan cada cinco plies, además del primero y último.
- La cancelación se revisa entre plies; un `cancel_requested` termina como `cancelled` sin dejar un job en `running`.

## Validación local

```bash
cd worker
npm install
npm run build
npm run test
docker build -f Dockerfile -t chess-profile-analyzer-worker:3d3-local ..
```

## Cierre de Fase 3D.3

La prueba controlada de una partida real a profundidad 16 completó 53 plies y persistió 53 evaluaciones, con FEN, PV, profundidad, nodos y milisegundos por ply. Las evaluaciones cp se guardan desde la perspectiva de blancas, mientras `eval_loss` se calcula desde la perspectiva del jugador que movió, incluidas las negras. Los mates se conservan como mates, sin equivalencias artificiales en centipeones.

**Accuracy estimada por Chess Profile Analyzer** es una métrica propia, reproducible y versionada; no equivale ni pretende equivaler a las métricas de Chess.com o Lichess.

Para ejecutar contra Supabase, inyecta las dos variables backend solo en la sesión/contenedor. Nunca pegues la clave de servicio en el chat, repositorio o frontend.
