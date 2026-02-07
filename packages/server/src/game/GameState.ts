import { randomUUID } from 'crypto';
import type { Direction, MapData, PlayerState, MonsterState, DamageEvent } from '@web-tibia/shared';
import { TILE_SIZE } from '@web-tibia/shared';
import { Player } from './Player';
import { World } from './World';
import { Monster } from './Monster';
import { CombatSystem } from './CombatSystem';

interface MoveResult {
  success: boolean;
  player?: Player;
}

interface AttackResult {
  success: boolean;
  damageEvent?: DamageEvent;
  monsterDied?: boolean;
  error?: string;
}

// Monster spawn configuration
const MONSTER_SPAWNS = [
  { typeId: 'rat', x: 5, y: 5 },
  { typeId: 'rat', x: 8, y: 3 },
  { typeId: 'snake', x: 12, y: 8 },
  { typeId: 'snake', x: 3, y: 10 },
  { typeId: 'spider', x: 15, y: 12 },
];

export class GameState {
  private players: Map<string, Player> = new Map(); // socketId -> Player
  private monsters: Map<string, Monster> = new Map(); // monsterId -> Monster
  private world: World;
  private combatSystem: CombatSystem;
  private onMonsterRespawn?: (monster: MonsterState) => void;

  constructor(mapData: MapData) {
    this.world = new World(mapData);
    this.combatSystem = new CombatSystem();
    this.spawnMonsters();
  }

  private spawnMonsters(): void {
    for (const spawn of MONSTER_SPAWNS) {
      const monster = new Monster({
        typeId: spawn.typeId,
        x: spawn.x * TILE_SIZE,
        y: spawn.y * TILE_SIZE,
      });
      this.monsters.set(monster.id, monster);
    }
  }

  setOnMonsterRespawn(callback: (monster: MonsterState) => void): void {
    this.onMonsterRespawn = callback;
  }

  addPlayer(socketId: string, name: string): Player {
    const spawn = this.world.getSpawnPoint();
    const player = new Player({
      id: randomUUID(),
      socketId,
      name,
      x: spawn.x,
      y: spawn.y,
      direction: 'south',
    });
    this.players.set(socketId, player);
    return player;
  }

  getPlayerBySocketId(socketId: string): Player | undefined {
    return this.players.get(socketId);
  }

  getPlayerById(playerId: string): Player | undefined {
    for (const player of this.players.values()) {
      if (player.id === playerId) {
        return player;
      }
    }
    return undefined;
  }

  movePlayer(socketId: string, direction: Direction): MoveResult {
    const player = this.players.get(socketId);
    if (!player) return { success: false };

    const newPos = this.calculateNewPosition(player, direction);

    // Update direction regardless of movement success
    player.direction = direction;

    // Check collision
    if (!this.world.isWalkable(newPos.x, newPos.y)) {
      return { success: false };
    }

    player.x = newPos.x;
    player.y = newPos.y;

    return { success: true, player };
  }

  private calculateNewPosition(
    player: Player,
    direction: Direction
  ): { x: number; y: number } {
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

  getPlayerCount(): number {
    return this.players.size;
  }

  getAllMonsters(): MonsterState[] {
    return Array.from(this.monsters.values()).map((m) => m.toState());
  }

  getMonsterById(monsterId: string): Monster | undefined {
    return this.monsters.get(monsterId);
  }

  attackMonster(socketId: string, targetId: string): AttackResult {
    const player = this.players.get(socketId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    const monster = this.monsters.get(targetId);
    if (!monster) {
      return { success: false, error: 'Monster not found' };
    }

    const result = this.combatSystem.attack(player, monster);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const damageEvent: DamageEvent = {
      attackerId: player.id,
      targetId: monster.id,
      damage: result.damage,
      targetHealth: monster.health,
      targetMaxHealth: monster.maxHealth,
    };

    if (result.targetDied) {
      monster.scheduleRespawn(() => {
        if (this.onMonsterRespawn) {
          this.onMonsterRespawn(monster.toState());
        }
      });
    }

    return {
      success: true,
      damageEvent,
      monsterDied: result.targetDied,
    };
  }
}
