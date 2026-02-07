# Arquitetura do Projeto

## Estrutura de Pastas (Monorepo)

```
web-tibia/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions para testes
├── packages/
│   ├── client/                       # React App (Vite)
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   │   └── sprites/          # Spritesheets PNG
│   │   │   │       ├── characters/   # Sprites de personagens
│   │   │   │       ├── tiles/        # Sprites de tiles (grass, stone, etc)
│   │   │   │       └── objects/      # Sprites de objetos decorativos
│   │   │   ├── components/
│   │   │   │   ├── ui/               # shadcn/ui components
│   │   │   │   ├── game/
│   │   │   │   │   ├── GameCanvas.tsx
│   │   │   │   │   ├── PlayerSprite.tsx
│   │   │   │   │   └── TileRenderer.tsx
│   │   │   │   └── hud/
│   │   │   │       └── PlayerList.tsx
│   │   │   ├── engine/               # Game engine logic
│   │   │   │   ├── renderer/
│   │   │   │   │   ├── CanvasRenderer.ts
│   │   │   │   │   ├── SpriteManager.ts
│   │   │   │   │   └── Camera.ts
│   │   │   │   ├── input/
│   │   │   │   │   └── KeyboardHandler.ts
│   │   │   │   └── GameLoop.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useSocket.ts
│   │   │   │   ├── useGameLoop.ts
│   │   │   │   └── useKeyboard.ts
│   │   │   ├── lib/
│   │   │   │   ├── socket.ts         # Socket.io client setup
│   │   │   │   └── api.ts            # React Query setup
│   │   │   ├── schemas/              # Zod schemas (shared types)
│   │   │   ├── stores/               # Zustand
│   │   │   │   └── gameStore.ts
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── __tests__/                # Testes do client
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── vitest.config.ts
│   │
│   ├── server/                       # Node.js Server
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── database.ts
│   │   │   │   └── socket.ts
│   │   │   ├── db/
│   │   │   │   ├── schema.ts         # Drizzle schemas
│   │   │   │   ├── migrations/
│   │   │   │   └── index.ts
│   │   │   ├── game/
│   │   │   │   ├── GameState.ts      # Estado centralizado do jogo
│   │   │   │   ├── World.ts          # Gerencia o mundo/mapa
│   │   │   │   ├── Player.ts         # Classe Player
│   │   │   │   └── physics/
│   │   │   │       └── collision.ts
│   │   │   ├── events/               # Socket.io event handlers
│   │   │   │   ├── connection.ts
│   │   │   │   ├── movement.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   └── playerService.ts
│   │   │   ├── maps/                 # Map definitions (JSON)
│   │   │   │   └── starter-town.json
│   │   │   └── index.ts              # Entry point
│   │   ├── __tests__/                # Testes do server
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                       # Tipos e utils compartilhados
│       ├── src/
│       │   ├── types/
│       │   │   ├── player.ts
│       │   │   ├── map.ts
│       │   │   ├── events.ts         # Socket events types
│       │   │   └── index.ts
│       │   ├── schemas/              # Zod schemas compartilhados
│       │   │   ├── player.schema.ts
│       │   │   ├── movement.schema.ts
│       │   │   └── index.ts
│       │   ├── constants/
│       │   │   ├── game.ts           # TILE_SIZE, MAP_WIDTH, etc
│       │   │   └── events.ts         # Event names
│       │   └── utils/
│       │       └── position.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docker/
│   └── docker-compose.yml
├── scripts/
│   └── dev.sh                        # Script para npm run dev
├── docs/
│   └── plan/                         # Este diretório
├── package.json                      # Root package.json (workspaces)
├── turbo.json                        # Turborepo config
├── tsconfig.base.json
└── README.md
```

## Decisões de Arquitetura

### Monorepo com Turborepo

**Por quê?**
- Compartilhamento de tipos entre client/server sem publicar packages
- Build e testes paralelos
- Cache inteligente de builds
- Um único `npm install`

### Separação Client/Server/Shared

**Packages:**
- `client`: React app com Vite - roda no browser
- `server`: Express + Socket.io - roda em Node.js
- `shared`: Tipos, schemas Zod, constantes - importado pelos dois

### Game Engine Architecture

```
┌─────────────────────────────────────────────────┐
│                   GameLoop                       │
│  (requestAnimationFrame, fixed timestep 60fps)  │
└────────────────────┬────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
   ┌──────────┐ ┌─────────┐ ┌──────────┐
   │  Input   │ │  State  │ │ Renderer │
   │ Handler  │ │  Store  │ │  Canvas  │
   └────┬─────┘ └────┬────┘ └────┬─────┘
        │            │           │
        ▼            ▼           ▼
   ┌──────────┐ ┌─────────┐ ┌──────────┐
   │ Keyboard │ │ Zustand │ │  Sprite  │
   │  Events  │ │  Store  │ │ Manager  │
   └──────────┘ └─────────┘ └──────────┘
```

### Fluxo de Dados Multiplayer

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│ Client  │◄───────►│ Server  │◄───────►│ Client  │
│    A    │         │ Game    │         │    B    │
└────┬────┘         │ State   │         └────┬────┘
     │              └────┬────┘              │
     │                   │                   │
     ▼                   ▼                   ▼
┌─────────┐         ┌─────────┐         ┌─────────┐
│ Local   │         │ Source  │         │ Local   │
│ State   │         │ of Truth│         │ State   │
└─────────┘         └─────────┘         └─────────┘

Eventos Socket.io:
- player:join → Servidor valida e adiciona jogador
- player:move → Servidor valida, atualiza e broadcast
- game:state  → Servidor envia estado para todos (10/s)
```
