# Database Schema (Drizzle ORM)

## Schema Principal

```typescript
// packages/server/src/db/schema.ts
import { pgTable, text, integer, timestamp, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';

// Tabela de jogadores (persistência)
export const players = pgTable('players', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Identificação (MVP: apenas nome, sem auth)
  name: text('name').notNull().unique(),

  // Posição no mundo
  positionX: integer('position_x').notNull().default(100),
  positionY: integer('position_y').notNull().default(100),
  positionZ: integer('position_z').notNull().default(0), // Layer/floor

  // Aparência (sprite index)
  spriteId: integer('sprite_id').notNull().default(0),
  direction: text('direction', { enum: ['north', 'south', 'east', 'west'] })
    .notNull()
    .default('south'),

  // Estatísticas básicas (preparando para futuro)
  health: integer('health').notNull().default(100),
  maxHealth: integer('max_health').notNull().default(100),

  // Metadata
  isOnline: boolean('is_online').notNull().default(false),
  lastSeen: timestamp('last_seen').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabela de mapas (definição)
export const maps = pgTable('maps', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  layers: integer('layers').notNull().default(1),

  // Dados do mapa em JSON (tiles)
  data: jsonb('data').notNull(), // MapData type

  // Spawn points
  spawnX: integer('spawn_x').notNull().default(50),
  spawnY: integer('spawn_y').notNull().default(50),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabela de sessões ativas (opcional para MVP, útil para debug)
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  playerId: uuid('player_id').references(() => players.id).notNull(),
  socketId: text('socket_id').notNull(),
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
  disconnectedAt: timestamp('disconnected_at'),
});

// Types inferidos do Drizzle
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Map = typeof maps.$inferSelect;
export type NewMap = typeof maps.$inferInsert;
```

## Estrutura do JSON de Mapa

```typescript
// packages/shared/src/types/map.ts
export interface TileData {
  spriteId: number;      // Index na spritesheet
  walkable: boolean;     // Jogador pode andar
  transparent: boolean;  // Para cálculo de visão
}

export interface MapData {
  version: string;
  tiles: TileData[][][];  // [layer][y][x]
  objects: MapObject[];   // Objetos dinâmicos
}

export interface MapObject {
  id: string;
  spriteId: number;
  x: number;
  y: number;
  layer: number;
  properties: Record<string, unknown>;
}
```

## Exemplo de Mapa JSON

```json
{
  "version": "1.0.0",
  "tiles": [
    [
      [{"spriteId": 0, "walkable": true, "transparent": true}, {"spriteId": 0, "walkable": true, "transparent": true}],
      [{"spriteId": 1, "walkable": false, "transparent": false}, {"spriteId": 0, "walkable": true, "transparent": true}]
    ]
  ],
  "objects": [
    {
      "id": "tree-1",
      "spriteId": 16,
      "x": 5,
      "y": 5,
      "layer": 1,
      "properties": {}
    }
  ]
}
```

## Migrations

O Drizzle gera migrations automaticamente:

```bash
# Gerar migration
npx drizzle-kit generate

# Aplicar migrations
npx drizzle-kit migrate

# Visualizar schema
npx drizzle-kit studio
```

## Índices para Performance

Para o MVP não são necessários, mas no futuro:

```typescript
// Índice para busca por posição (útil para queries de área)
export const positionIndex = index('position_idx')
  .on(players.positionX, players.positionY);

// Índice para jogadores online
export const onlineIndex = index('online_idx')
  .on(players.isOnline);
```
