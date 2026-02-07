# Sistema Multiplayer com Socket.io

## Visão Geral

O servidor é a fonte da verdade (authoritative server). Clientes enviam intenções, servidor valida e broadcast.

```
Client A                    Server                    Client B
   │                          │                          │
   │──player:move(east)──────►│                          │
   │                          │ (valida, atualiza)       │
   │◄──player:moved(A,x,y)────│──player:moved(A,x,y)────►│
   │                          │                          │
```

## Eventos Socket.io (Contrato)

### Schemas Zod (packages/shared/src/schemas)

```typescript
// packages/shared/src/schemas/events.schema.ts
import { z } from 'zod';

// === CLIENT -> SERVER ===

export const PlayerJoinSchema = z.object({
  name: z.string().min(3).max(20),
});

export const PlayerMoveSchema = z.object({
  direction: z.enum(['north', 'south', 'east', 'west']),
  timestamp: z.number(),
});

// === SERVER -> CLIENT ===

export const PlayerStateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  direction: z.enum(['north', 'south', 'east', 'west']),
  spriteId: z.number(),
});

export const WorldStateSchema = z.object({
  players: z.array(PlayerStateSchema),
  timestamp: z.number(),
});

export const GameInitSchema = z.object({
  playerId: z.string().uuid(),
  mapData: z.any(), // MapData type
  players: z.array(PlayerStateSchema),
});
```

### Types de Eventos

```typescript
// packages/shared/src/types/events.ts
import type { z } from 'zod';
import type {
  PlayerJoinSchema,
  PlayerMoveSchema,
  PlayerStateSchema,
  WorldStateSchema,
  GameInitSchema,
} from '../schemas/events.schema';

export interface ClientToServerEvents {
  'player:join': (data: z.infer<typeof PlayerJoinSchema>) => void;
  'player:move': (data: z.infer<typeof PlayerMoveSchema>) => void;
  'player:stop': () => void;
}

export interface ServerToClientEvents {
  'game:init': (data: z.infer<typeof GameInitSchema>) => void;
  'game:state': (data: z.infer<typeof WorldStateSchema>) => void;
  'player:joined': (player: z.infer<typeof PlayerStateSchema>) => void;
  'player:left': (playerId: string) => void;
  'player:moved': (data: { id: string; x: number; y: number; direction: string }) => void;
  'error': (message: string) => void;
}
```

## Servidor Socket.io

### Setup

```typescript
// packages/server/src/config/socket.ts
import { Server } from 'socket.io';
import { createServer } from 'http';
import type { ClientToServerEvents, ServerToClientEvents } from '@web-tibia/shared';

export function createSocketServer(httpServer: ReturnType<typeof createServer>) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  return io;
}
```

### Event Handlers

```typescript
// packages/server/src/events/index.ts
import { Server, Socket } from 'socket.io';
import { GameState } from '../game/GameState';
import { PlayerJoinSchema, PlayerMoveSchema } from '@web-tibia/shared';

export function setupSocketEvents(io: Server, gameState: GameState) {
  io.on('connection', (socket: Socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Player join
    socket.on('player:join', async (data) => {
      const validated = PlayerJoinSchema.safeParse(data);
      if (!validated.success) {
        socket.emit('error', 'Invalid join data');
        return;
      }

      try {
        const player = await gameState.addPlayer(socket.id, validated.data.name);

        // Enviar estado inicial para o novo jogador
        socket.emit('game:init', {
          playerId: player.id,
          mapData: gameState.getMapData(),
          players: gameState.getAllPlayers(),
        });

        // Notificar outros jogadores
        socket.broadcast.emit('player:joined', player.toState());
      } catch (error) {
        socket.emit('error', 'Failed to join game');
      }
    });

    // Player movement
    socket.on('player:move', (data) => {
      const validated = PlayerMoveSchema.safeParse(data);
      if (!validated.success) return;

      const result = gameState.movePlayer(socket.id, validated.data.direction);
      if (result.success && result.player) {
        // Broadcast para todos (incluindo o próprio para reconciliação)
        io.emit('player:moved', {
          id: result.player.id,
          x: result.player.x,
          y: result.player.y,
          direction: validated.data.direction,
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      const player = gameState.removePlayer(socket.id);
      if (player) {
        io.emit('player:left', player.id);
      }
    });
  });

  // Game tick - broadcast estado periodicamente (para sync)
  setInterval(() => {
    const state = {
      players: gameState.getAllPlayers(),
      timestamp: Date.now(),
    };
    io.emit('game:state', state);
  }, 100); // 10 updates por segundo
}
```

## GameState (Server-side)

```typescript
// packages/server/src/game/GameState.ts
import { Player } from './Player';
import { World } from './World';
import type { MapData, Direction, PlayerState } from '@web-tibia/shared';

interface MoveResult {
  success: boolean;
  player?: Player;
}

export class GameState {
  private players: Map<string, Player> = new Map(); // socketId -> Player
  private world: World;

  constructor(mapData: MapData) {
    this.world = new World(mapData);
  }

  addPlayer(socketId: string, name: string): Player {
    const spawn = this.world.getSpawnPoint();
    const player = new Player({
      id: crypto.randomUUID(),
      socketId,
      name,
      x: spawn.x,
      y: spawn.y,
      direction: 'south',
      spriteId: 0,
    });
    this.players.set(socketId, player);
    return player;
  }

  movePlayer(socketId: string, direction: Direction): MoveResult {
    const player = this.players.get(socketId);
    if (!player) return { success: false };

    const newPos = this.calculateNewPosition(player, direction);

    // Collision detection
    if (!this.world.isWalkable(newPos.x, newPos.y)) {
      // Atualiza direção mesmo se bloqueado
      player.direction = direction;
      return { success: false };
    }

    player.x = newPos.x;
    player.y = newPos.y;
    player.direction = direction;

    return { success: true, player };
  }

  private calculateNewPosition(player: Player, direction: Direction) {
    const TILE_SIZE = 32;
    const movements: Record<Direction, { x: number; y: number }> = {
      north: { x: 0, y: -TILE_SIZE },
      south: { x: 0, y: TILE_SIZE },
      east: { x: TILE_SIZE, y: 0 },
      west: { x: -TILE_SIZE, y: 0 },
    };
    const delta = movements[direction];
    return { x: player.x + delta.x, y: player.y + delta.y };
  }

  getAllPlayers(): PlayerState[] {
    return Array.from(this.players.values()).map((p) => p.toState());
  }

  getMapData(): MapData {
    return this.world.getMapData();
  }

  removePlayer(socketId: string): Player | undefined {
    const player = this.players.get(socketId);
    this.players.delete(socketId);
    return player;
  }
}
```

## Cliente Socket Hook

```typescript
// packages/client/src/hooks/useSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';
import type { ClientToServerEvents, ServerToClientEvents, Direction } from '@web-tibia/shared';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const socketRef = useRef<GameSocket | null>(null);
  const {
    setPlayers,
    setPlayerId,
    setMapData,
    addPlayer,
    removePlayer,
    updatePlayer,
  } = useGameStore();

  useEffect(() => {
    const socket: GameSocket = io(
      import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
    );
    socketRef.current = socket;

    socket.on('game:init', (data) => {
      setPlayerId(data.playerId);
      setMapData(data.mapData);
      setPlayers(data.players);
    });

    socket.on('player:joined', (player) => {
      addPlayer(player);
    });

    socket.on('player:left', (playerId) => {
      removePlayer(playerId);
    });

    socket.on('player:moved', (data) => {
      updatePlayer(data.id, {
        x: data.x,
        y: data.y,
        direction: data.direction as Direction,
      });
    });

    socket.on('game:state', (state) => {
      // Reconciliação periódica
      setPlayers(state.players);
    });

    socket.on('error', (message) => {
      console.error('Socket error:', message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinGame = useCallback((name: string) => {
    socketRef.current?.emit('player:join', { name });
  }, []);

  const move = useCallback((direction: Direction) => {
    socketRef.current?.emit('player:move', {
      direction,
      timestamp: Date.now(),
    });
  }, []);

  return { joinGame, move };
}
```

## Game Store (Zustand)

```typescript
// packages/client/src/stores/gameStore.ts
import { create } from 'zustand';
import type { PlayerState, MapData, Direction } from '@web-tibia/shared';

interface GameState {
  playerId: string | null;
  players: PlayerState[];
  mapData: MapData | null;

  // Actions
  setPlayerId: (id: string) => void;
  setPlayers: (players: PlayerState[]) => void;
  setMapData: (mapData: MapData) => void;
  addPlayer: (player: PlayerState) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<PlayerState>) => void;

  // Selectors
  getLocalPlayer: () => PlayerState | undefined;
}

export const useGameStore = create<GameState>((set, get) => ({
  playerId: null,
  players: [],
  mapData: null,

  setPlayerId: (id) => set({ playerId: id }),
  setPlayers: (players) => set({ players }),
  setMapData: (mapData) => set({ mapData }),

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players, player],
    })),

  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    })),

  updatePlayer: (playerId, updates) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, ...updates } : p
      ),
    })),

  getLocalPlayer: () => {
    const { playerId, players } = get();
    return players.find((p) => p.id === playerId);
  },
}));
```
