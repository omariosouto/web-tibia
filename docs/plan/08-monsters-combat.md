# Sistema de Monstros e Combate

## Visão Geral

O MVP inclui:
- Monstros spawnados no mapa
- Clique para selecionar/atacar monstro
- Sistema de dano básico
- Monstros morrem e respawnam

## Tipos de Monstros (MVP)

| ID | Nome | HP | Dano | Sprite |
|----|------|-----|------|--------|
| 0 | Rat | 20 | 2 | monsters-0 |
| 1 | Snake | 35 | 5 | monsters-1 |
| 2 | Spider | 50 | 8 | monsters-2 |

## Sprites de Monstros

### monsters.png (256x256)

Layout: 4 colunas (direções) x N linhas (tipos de monstros)

```
         South  West   East   North
Rat:      [0]    [1]    [2]    [3]
Snake:    [4]    [5]    [6]    [7]
Spider:   [8]    [9]    [10]   [11]
```

## Schema do Banco

```typescript
// Adicionar ao packages/server/src/db/schema.ts

export const monsterTypes = pgTable('monster_types', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  health: integer('health').notNull(),
  damage: integer('damage').notNull(),
  spriteId: integer('sprite_id').notNull(),
  respawnTime: integer('respawn_time').notNull().default(30), // segundos
});

export const monsterSpawns = pgTable('monster_spawns', {
  id: uuid('id').defaultRandom().primaryKey(),
  mapId: uuid('map_id').references(() => maps.id).notNull(),
  monsterTypeId: integer('monster_type_id').references(() => monsterTypes.id).notNull(),
  spawnX: integer('spawn_x').notNull(),
  spawnY: integer('spawn_y').notNull(),
  radius: integer('radius').notNull().default(3), // tiles de movimento
});
```

## Classe Monster (Server)

```typescript
// packages/server/src/game/Monster.ts
import type { Direction } from '@web-tibia/shared';

export interface MonsterConfig {
  id: string;
  typeId: number;
  name: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  spriteId: number;
  spawnX: number;
  spawnY: number;
  respawnTime: number;
}

export class Monster {
  readonly id: string;
  readonly typeId: number;
  readonly name: string;
  x: number;
  y: number;
  health: number;
  readonly maxHealth: number;
  readonly damage: number;
  readonly spriteId: number;
  direction: Direction = 'south';

  // Spawn info
  readonly spawnX: number;
  readonly spawnY: number;
  readonly respawnTime: number;

  // State
  isAlive: boolean = true;
  targetPlayerId: string | null = null;
  lastMoveTime: number = 0;

  constructor(config: MonsterConfig) {
    this.id = config.id;
    this.typeId = config.typeId;
    this.name = config.name;
    this.x = config.x;
    this.y = config.y;
    this.health = config.health;
    this.maxHealth = config.maxHealth;
    this.damage = config.damage;
    this.spriteId = config.spriteId;
    this.spawnX = config.spawnX;
    this.spawnY = config.spawnY;
    this.respawnTime = config.respawnTime;
  }

  takeDamage(amount: number): boolean {
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.isAlive = false;
      return true; // killed
    }
    return false;
  }

  respawn(): void {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.health = this.maxHealth;
    this.isAlive = true;
    this.targetPlayerId = null;
    this.direction = 'south';
  }

  toState(): MonsterState {
    return {
      id: this.id,
      typeId: this.typeId,
      name: this.name,
      x: this.x,
      y: this.y,
      health: this.health,
      maxHealth: this.maxHealth,
      spriteId: this.spriteId,
      direction: this.direction,
      isAlive: this.isAlive,
    };
  }
}
```

## Combat System (Server)

```typescript
// packages/server/src/game/CombatSystem.ts
import { GameState } from './GameState';
import { Player } from './Player';
import { Monster } from './Monster';

export interface AttackResult {
  success: boolean;
  damage?: number;
  killed?: boolean;
  error?: string;
}

export class CombatSystem {
  private gameState: GameState;
  private readonly ATTACK_RANGE = 32; // 1 tile
  private readonly ATTACK_COOLDOWN = 1000; // 1 segundo
  private lastAttackTime: Map<string, number> = new Map();

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  attackMonster(playerId: string, monsterId: string): AttackResult {
    const player = this.gameState.getPlayerById(playerId);
    const monster = this.gameState.getMonsterById(monsterId);

    if (!player || !monster) {
      return { success: false, error: 'Invalid target' };
    }

    if (!monster.isAlive) {
      return { success: false, error: 'Monster is dead' };
    }

    // Check range
    const distance = this.calculateDistance(player, monster);
    if (distance > this.ATTACK_RANGE) {
      return { success: false, error: 'Too far' };
    }

    // Check cooldown
    const lastAttack = this.lastAttackTime.get(playerId) || 0;
    if (Date.now() - lastAttack < this.ATTACK_COOLDOWN) {
      return { success: false, error: 'Cooldown' };
    }

    // Calculate damage (simple formula)
    const baseDamage = 10;
    const variance = Math.floor(Math.random() * 5) - 2; // -2 to +2
    const damage = Math.max(1, baseDamage + variance);

    // Apply damage
    const killed = monster.takeDamage(damage);
    this.lastAttackTime.set(playerId, Date.now());

    // Schedule respawn if killed
    if (killed) {
      setTimeout(() => {
        monster.respawn();
        this.gameState.broadcastMonsterRespawn(monster);
      }, monster.respawnTime * 1000);
    }

    return {
      success: true,
      damage,
      killed,
    };
  }

  private calculateDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}
```

## Socket Events para Combate

```typescript
// packages/shared/src/schemas/combat.schema.ts
import { z } from 'zod';

export const AttackSchema = z.object({
  targetId: z.string(),
});

export const DamageEventSchema = z.object({
  attackerId: z.string(),
  targetId: z.string(),
  damage: z.number(),
  targetHealth: z.number(),
  targetMaxHealth: z.number(),
});

export const MonsterStateSchema = z.object({
  id: z.string(),
  typeId: z.number(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  health: z.number(),
  maxHealth: z.number(),
  spriteId: z.number(),
  direction: z.enum(['north', 'south', 'east', 'west']),
  isAlive: z.boolean(),
});
```

```typescript
// Adicionar aos tipos de eventos
export interface ClientToServerEvents {
  // ... eventos existentes
  'combat:attack': (data: { targetId: string }) => void;
}

export interface ServerToClientEvents {
  // ... eventos existentes
  'combat:damage': (data: DamageEvent) => void;
  'monster:died': (data: { monsterId: string }) => void;
  'monster:respawn': (data: MonsterState) => void;
  'monsters:state': (monsters: MonsterState[]) => void;
}
```

## Event Handler de Combate

```typescript
// packages/server/src/events/combat.ts
import { Socket } from 'socket.io';
import { GameState } from '../game/GameState';
import { CombatSystem } from '../game/CombatSystem';
import { AttackSchema } from '@web-tibia/shared';

export function setupCombatEvents(
  socket: Socket,
  io: Server,
  gameState: GameState,
  combatSystem: CombatSystem
) {
  socket.on('combat:attack', (data) => {
    const validated = AttackSchema.safeParse(data);
    if (!validated.success) return;

    const player = gameState.getPlayerBySocketId(socket.id);
    if (!player) return;

    const result = combatSystem.attackMonster(player.id, validated.data.targetId);

    if (result.success) {
      const monster = gameState.getMonsterById(validated.data.targetId);
      if (!monster) return;

      // Broadcast damage event
      io.emit('combat:damage', {
        attackerId: player.id,
        targetId: monster.id,
        damage: result.damage!,
        targetHealth: monster.health,
        targetMaxHealth: monster.maxHealth,
      });

      // If killed, broadcast death
      if (result.killed) {
        io.emit('monster:died', { monsterId: monster.id });
      }
    }
  });
}
```

## Cliente - Click Handler

```typescript
// packages/client/src/engine/input/ClickHandler.ts
import { Camera } from '../renderer/Camera';
import { TILE_SIZE } from '@web-tibia/shared';

export class ClickHandler {
  private camera: Camera;
  private canvas: HTMLCanvasElement;
  private onMonsterClick: (monsterId: string) => void;
  private getMonsters: () => MonsterState[];

  constructor(
    canvas: HTMLCanvasElement,
    camera: Camera,
    getMonsters: () => MonsterState[],
    onMonsterClick: (monsterId: string) => void
  ) {
    this.canvas = canvas;
    this.camera = camera;
    this.getMonsters = getMonsters;
    this.onMonsterClick = onMonsterClick;

    this.canvas.addEventListener('click', this.handleClick.bind(this));
  }

  private handleClick(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // Convert screen to world coordinates
    const worldX = screenX + this.camera.x;
    const worldY = screenY + this.camera.y;

    // Check if clicked on a monster
    const monsters = this.getMonsters();
    for (const monster of monsters) {
      if (!monster.isAlive) continue;

      // Check if click is within monster bounds
      if (
        worldX >= monster.x &&
        worldX <= monster.x + TILE_SIZE &&
        worldY >= monster.y &&
        worldY <= monster.y + TILE_SIZE
      ) {
        this.onMonsterClick(monster.id);
        return;
      }
    }
  }

  destroy(): void {
    this.canvas.removeEventListener('click', this.handleClick.bind(this));
  }
}
```

## Renderização de Monstros

```typescript
// Adicionar ao CanvasRenderer.ts

private renderMonsters(monsters: MonsterState[]): void {
  // Ordenar por Y para profundidade (junto com players)
  const sorted = [...monsters].filter(m => m.isAlive).sort((a, b) => a.y - b.y);

  for (const monster of sorted) {
    const screenPos = this.camera.worldToScreen(monster.x, monster.y);

    // Sprite do monstro
    const spriteId = monster.spriteId + this.getDirectionOffset(monster.direction);
    this.spriteManager.drawSprite(
      this.ctx,
      'monsters',
      spriteId,
      screenPos.x,
      screenPos.y
    );

    // Barra de vida
    this.renderHealthBar(
      screenPos.x,
      screenPos.y - 8,
      TILE_SIZE,
      4,
      monster.health,
      monster.maxHealth
    );

    // Nome do monstro
    this.ctx.fillStyle = '#ff6666';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      monster.name,
      screenPos.x + TILE_SIZE / 2,
      screenPos.y - 12
    );
  }
}

private renderHealthBar(
  x: number,
  y: number,
  width: number,
  height: number,
  current: number,
  max: number
): void {
  const percentage = current / max;

  // Background (vermelho)
  this.ctx.fillStyle = '#660000';
  this.ctx.fillRect(x, y, width, height);

  // Foreground (verde)
  this.ctx.fillStyle = percentage > 0.3 ? '#00ff00' : '#ff0000';
  this.ctx.fillRect(x, y, width * percentage, height);

  // Border
  this.ctx.strokeStyle = '#000000';
  this.ctx.lineWidth = 1;
  this.ctx.strokeRect(x, y, width, height);
}
```

## Game Store - Monstros

```typescript
// Adicionar ao gameStore.ts

interface GameState {
  // ... existing
  monsters: MonsterState[];
  selectedMonsterId: string | null;

  // Actions
  setMonsters: (monsters: MonsterState[]) => void;
  updateMonster: (monsterId: string, updates: Partial<MonsterState>) => void;
  selectMonster: (monsterId: string | null) => void;
}

// Implementação
setMonsters: (monsters) => set({ monsters }),

updateMonster: (monsterId, updates) =>
  set((state) => ({
    monsters: state.monsters.map((m) =>
      m.id === monsterId ? { ...m, ...updates } : m
    ),
  })),

selectMonster: (monsterId) => set({ selectedMonsterId: monsterId }),
```

## Hook de Combate

```typescript
// packages/client/src/hooks/useCombat.ts
import { useCallback } from 'react';
import { useSocket } from './useSocket';
import { useGameStore } from '../stores/gameStore';

export function useCombat() {
  const { socket } = useSocket();
  const { selectMonster, selectedMonsterId } = useGameStore();

  const attack = useCallback(() => {
    if (!selectedMonsterId) return;
    socket?.emit('combat:attack', { targetId: selectedMonsterId });
  }, [socket, selectedMonsterId]);

  const selectTarget = useCallback((monsterId: string | null) => {
    selectMonster(monsterId);
  }, [selectMonster]);

  return { attack, selectTarget, selectedMonsterId };
}
```

## Feedback Visual de Seleção

```typescript
// Adicionar ao CanvasRenderer - highlight do monstro selecionado

private renderMonsterSelection(monsterId: string | null): void {
  if (!monsterId) return;

  const monster = this.monsters.find(m => m.id === monsterId);
  if (!monster || !monster.isAlive) return;

  const screenPos = this.camera.worldToScreen(monster.x, monster.y);

  // Desenhar borda de seleção
  this.ctx.strokeStyle = '#ffff00';
  this.ctx.lineWidth = 2;
  this.ctx.strokeRect(
    screenPos.x - 2,
    screenPos.y - 2,
    TILE_SIZE + 4,
    TILE_SIZE + 4
  );
}
```
