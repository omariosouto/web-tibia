#!/bin/bash

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
npm run db:push --workspace=@web-tibia/server

# 5. Seed database (only if needed)
echo -e "${YELLOW}[4/5] Seeding database...${NC}"
npm run db:seed --workspace=@web-tibia/server 2>/dev/null || echo "Seed completed or skipped"

# 6. Start applications
echo -e "${YELLOW}[5/5] Starting applications...${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Server: http://localhost:3001       ${NC}"
echo -e "${GREEN}   Client: http://localhost:5173       ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

npx concurrently \
  --names "SERVER,CLIENT" \
  --prefix-colors "blue.bold,magenta.bold" \
  --prefix "[{name}]" \
  --kill-others \
  "npm run dev --workspace=@web-tibia/server" \
  "npm run dev --workspace=@web-tibia/client"
