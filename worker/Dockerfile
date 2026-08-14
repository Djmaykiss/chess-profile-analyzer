FROM node:24-bookworm AS stockfish-build
ARG STOCKFISH_TAG=sf_17.1
ARG STOCKFISH_COMMIT=03e27488f3d21d8ff4dbf3065603afa21dbd0ef3
RUN apt-get update && apt-get install -y --no-install-recommends git make g++ ca-certificates && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 --branch ${STOCKFISH_TAG} https://github.com/official-stockfish/Stockfish.git /src/stockfish \
 && test "$(git -C /src/stockfish rev-parse HEAD)" = "${STOCKFISH_COMMIT}" \
 && make -C /src/stockfish/src build ARCH=x86-64-avx2

FROM node:24-bookworm-slim
WORKDIR /app
COPY worker/package*.json ./
RUN npm ci
COPY worker/tsconfig.json ./
COPY worker/src ./src
RUN npx tsc -p tsconfig.json && npm prune --omit=dev
COPY --from=stockfish-build /src/stockfish/src/stockfish /usr/local/bin/stockfish
ENV STOCKFISH_PATH=/usr/local/bin/stockfish ANALYSIS_DEPTH=16 WORKER_POLL_INTERVAL_MS=3000 WORKER_RUN_ONCE=true
CMD ["node", "dist/worker.js"]
