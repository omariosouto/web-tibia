# Web Tibia - AI Agent Guide

## Project Overview

Tibia-inspired MMORPG built with Node.js, React, and Socket.io.

## Quick Start

```bash
npm install
npm run dev  # Starts Docker, migrations, server, and client
```

- Server: http://localhost:3001
- Client: http://localhost:5173

## Architecture

```
web-tibia/
├── packages/
│   ├── client/     # React + Canvas game engine
│   ├── server/     # Express + Socket.io + Drizzle ORM
│   └── shared/     # Types, Zod schemas, constants
├── docker/         # PostgreSQL
└── docs/plan/      # Design documentation
```

## Documentation References

- [Architecture](docs/plan/01-architecture.md) - Folder structure, dependencies
- [Database Schema](docs/plan/02-database-schema.md) - Drizzle ORM tables
- [Sprites & Rendering](docs/plan/03-sprites-rendering.md) - Canvas engine details
- [Multiplayer](docs/plan/04-multiplayer.md) - Socket.io events
- [Issues Roadmap](docs/plan/05-issues-roadmap.md) - All planned issues
- [Testing](docs/plan/06-testing.md) - Vitest, Playwright
- [Docker Setup](docs/plan/07-docker-setup.md) - Docker config
- [Monsters & Combat](docs/plan/08-monsters-combat.md) - Combat system

## Key Technologies

- **Frontend**: React, Vite, Canvas API, Zustand, shadcn/ui
- **Backend**: Express, Socket.io, Drizzle ORM, PostgreSQL
- **Validation**: Zod (end-to-end type safety)
- **Testing**: Vitest (unit), Playwright (E2E)
- **Monorepo**: Turborepo with npm workspaces

## Game Systems Implemented

### Movement
- Arrow keys / WASD for movement
- Server-side collision detection
- Position broadcast to all players

### Combat
- Click on monster or battle list to target
- Auto-attack while target selected (Tibia-style)
- Chase behavior when target out of range
- Monster AI (aggro range, attack, chase)
- Damage dealt to both monsters and players

### Sprites
- Tibia 7.0 sprites (Sprites-0 to Sprites-22)
- Global sprite ID = sheetNumber * 144 + row * 12 + col
- Each sheet is 12x12 grid of 32x32 sprites

## Code Conventions

- Use Zod for all socket event validation
- Shared types between client/server in packages/shared
- Game state managed by GameState class (server)
- Client state managed by Zustand store
- Singleton socket pattern for connection management

## Running Tests

```bash
npm run test        # Unit tests
npm run test:e2e    # Playwright E2E tests
```
