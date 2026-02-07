# Docker Setup

## docker-compose.yml

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: web-tibia-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-tibia}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-tibia123}
      POSTGRES_DB: ${POSTGRES_DB:-webtibia}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tibia -d webtibia"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Opcional: Adminer para debug do banco
  adminer:
    image: adminer:latest
    container_name: web-tibia-adminer
    restart: unless-stopped
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    profiles:
      - debug

volumes:
  postgres_data:
```

## Environment Variables

```bash
# .env.example

# Database
POSTGRES_USER=tibia
POSTGRES_PASSWORD=tibia123
POSTGRES_DB=webtibia
POSTGRES_PORT=5432
DATABASE_URL=postgresql://tibia:tibia123@localhost:5432/webtibia

# Server
PORT=3001
NODE_ENV=development

# Client
VITE_SERVER_URL=http://localhost:3001
```

## Script de Desenvolvimento

```bash
#!/bin/bash
# scripts/dev.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Starting Web-Tibia Dev Environment  ${NC}"
echo -e "${GREEN}========================================${NC}"

# 1. Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not running${NC}"
  exit 1
fi

# 2. Start Docker containers
echo -e "${YELLOW}[1/5] Starting PostgreSQL...${NC}"
docker-compose -f docker/docker-compose.yml up -d postgres

# 3. Wait for database
echo -e "${YELLOW}[2/5] Waiting for database to be ready...${NC}"
until docker exec web-tibia-db pg_isready -U tibia -d webtibia > /dev/null 2>&1; do
  echo -n "."
  sleep 1
done
echo ""
echo -e "${GREEN}Database is ready!${NC}"

# 4. Run migrations
echo -e "${YELLOW}[3/5] Running database migrations...${NC}"
npm run db:migrate --workspace=packages/server

# 5. Seed database (only if empty)
echo -e "${YELLOW}[4/5] Seeding database...${NC}"
npm run db:seed --workspace=packages/server 2>/dev/null || echo "Seed already exists or skipped"

# 6. Start applications
echo -e "${YELLOW}[5/5] Starting applications...${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Server: http://localhost:3001       ${NC}"
echo -e "${GREEN}   Client: http://localhost:5173       ${NC}"
echo -e "${GREEN}   Adminer: http://localhost:8080      ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

npx concurrently \
  --names "SERVER,CLIENT" \
  --prefix-colors "blue.bold,magenta.bold" \
  --prefix "[{name}]" \
  --kill-others \
  "npm run dev --workspace=packages/server" \
  "npm run dev --workspace=packages/client"
```

## Package.json Root

```json
{
  "name": "web-tibia",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "bash scripts/dev.sh",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "test:coverage": "turbo run test:coverage",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "db:up": "docker-compose -f docker/docker-compose.yml up -d",
    "db:down": "docker-compose -f docker/docker-compose.yml down",
    "db:logs": "docker-compose -f docker/docker-compose.yml logs -f postgres",
    "db:migrate": "npm run db:migrate --workspace=packages/server",
    "db:seed": "npm run db:seed --workspace=packages/server",
    "db:studio": "npm run db:studio --workspace=packages/server",
    "clean": "turbo run clean && rm -rf node_modules",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "concurrently": "^8.2.0",
    "husky": "^9.0.0",
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "packageManager": "npm@10.0.0"
}
```

## Turborepo Config

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

## Drizzle Config

```typescript
// packages/server/drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

## Scripts do Server Package

```json
{
  "name": "@web-tibia/server",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/db/seed.ts"
  }
}
```

## Comandos Úteis

```bash
# Iniciar ambiente completo
npm run dev

# Apenas subir o banco
npm run db:up

# Ver logs do banco
npm run db:logs

# Abrir Drizzle Studio (visualizar dados)
npm run db:studio

# Rodar apenas os testes
npm test

# Parar containers
npm run db:down

# Limpar tudo e reinstalar
npm run clean && npm install
```
