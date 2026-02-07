#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

compose() {
  docker compose -f docker/docker-compose.yml --env-file .env --profile full "$@"
}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Web-Tibia Docker Dev Environment    ${NC}"
echo -e "${GREEN}========================================${NC}"

if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not running${NC}"
  exit 1
fi

case "${1:-up}" in
  up)
    echo -e "${YELLOW}Starting all services...${NC}"
    echo ""
    echo -e "${GREEN}   Server: http://localhost:3001       ${NC}"
    echo -e "${GREEN}   Client: http://localhost:5173       ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    compose up --build
    ;;
  up:d)
    echo -e "${YELLOW}Starting all services (detached)...${NC}"
    compose up --build -d
    echo -e "${GREEN}Services running in background${NC}"
    echo -e "  Server: http://localhost:3001"
    echo -e "  Client: http://localhost:5173"
    echo -e "  Logs:   bash scripts/docker-dev.sh logs"
    ;;
  down)
    echo -e "${YELLOW}Stopping all services...${NC}"
    compose down
    ;;
  clean)
    echo -e "${YELLOW}Stopping all services and removing volumes...${NC}"
    compose down -v
    ;;
  logs)
    compose logs -f
    ;;
  *)
    echo "Usage: bash scripts/docker-dev.sh [up|up:d|down|clean|logs]"
    exit 1
    ;;
esac
