FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

RUN npm ci

COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/

RUN npm run build --workspace=@web-tibia/shared

# --- Dev: mirrors scripts/dev.sh (steps 3-6) ---
FROM base AS dev

COPY packages/server/ packages/server/
COPY packages/client/ packages/client/

EXPOSE 3001 5173

CMD ["sh", "-c", "\
  echo '[SETUP] Running migrations...' && \
  npm run db:push --workspace=@web-tibia/server -- --force && \
  echo '[SETUP] Running seed...' && \
  (npm run db:seed --workspace=@web-tibia/server 2>/dev/null || echo '[SETUP] Seed skipped') && \
  echo '[SETUP] Starting apps...' && \
  npx concurrently \
    --names SERVER,CLIENT \
    --prefix-colors blue.bold,magenta.bold \
    --prefix '[{name}]' \
    --kill-others \
    'npm run dev --workspace=@web-tibia/server' \
    'npm run dev --workspace=@web-tibia/client -- --host'"]
