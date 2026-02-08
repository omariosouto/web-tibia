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
  outOfRange?: boolean;
  playerMoved?: Player;
}

interface MonsterAttackResult {
  attackerId: string;
  targetId: string;
  damage: number;
  targetHealth: number;
  targetMaxHealth: number;
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

    // If out of range, move player toward monster
    if (!result.success && result.error === 'Target out of range') {
      const moved = this.movePlayerToward(player, monster.x, monster.y);
      return {
        success: false,
        error: result.error,
        outOfRange: true,
        playerMoved: moved ? player : undefined,
      };
    }

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

  // Move player one tile toward target position
  private movePlayerToward(player: Player, targetX: number, targetY: number): boolean {
    const dx = targetX - player.x;
    const dy = targetY - player.y;

    // Determine primary direction to move
    let direction: Direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'east' : 'west';
    } else {
      direction = dy > 0 ? 'south' : 'north';
    }

    const newPos = this.calculateNewPosition(player, direction);
    player.direction = direction;

    if (this.world.isWalkable(newPos.x, newPos.y)) {
      player.x = newPos.x;
      player.y = newPos.y;
      return true;
    }

    // Try alternate direction if primary is blocked
    const altDirection: Direction = Math.abs(dx) > Math.abs(dy)
      ? (dy > 0 ? 'south' : 'north')
      : (dx > 0 ? 'east' : 'west');

    const altPos = this.calculateNewPosition(player, altDirection);
    if (this.world.isWalkable(altPos.x, altPos.y)) {
      player.direction = altDirection;
      player.x = altPos.x;
      player.y = altPos.y;
      return true;
    }

    return false;
  }

  // Monster AI tick - monsters attack nearby players
  tickMonsterAI(): MonsterAttackResult[] {
    const results: MonsterAttackResult[] = [];
    const players = Array.from(this.players.values());

    for (const monster of this.monsters.values()) {
      if (!monster.isAlive) continue;

      // Find closest player within aggro range (3 tiles)
      const aggroRange = TILE_SIZE * 3;
      let closestPlayer: Player | null = null;
      let closestDistance = Infinity;

      for (const player of players) {
        const dist = Math.sqrt(
          Math.pow(player.x - monster.x, 2) + Math.pow(player.y - monster.y, 2)
        );
        if (dist < aggroRange && dist < closestDistance) {
          closestDistance = dist;
          closestPlayer = player;
        }
      }

      if (!closestPlayer) continue;

      // Try to attack if in range
      const attackRange = TILE_SIZE * 1.5;
      if (closestDistance <= attackRange) {
        // Attack the player
        if (this.combatSystem.canAttack(monster.id)) {
          const damage = Math.floor(monster.damage * (0.8 + Math.random() * 0.4));
          // Apply damage to player
          closestPlayer.health = Math.max(0, closestPlayer.health - damage);
          results.push({
            attackerId: monster.id,
            targetId: closestPlayer.id,
            damage,
            targetHealth: closestPlayer.health,
            targetMaxHealth: closestPlayer.maxHealth,
          });
          this.combatSystem.setCooldown(monster.id);
        }
      } else {
        // Move toward player
        this.moveMonsterToward(monster, closestPlayer.x, closestPlayer.y);
      }
    }

    return results;
  }

  private moveMonsterToward(monster: Monster, targetX: number, targetY: number): void {
    const dx = targetX - monster.x;
    const dy = targetY - monster.y;

    // Determine direction to move
    let newX = monster.x;
    let newY = monster.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      newX += dx > 0 ? TILE_SIZE : -TILE_SIZE;
      monster.direction = dx > 0 ? 'east' : 'west';
    } else if (dy !== 0) {
      newY += dy > 0 ? TILE_SIZE : -TILE_SIZE;
      monster.direction = dy > 0 ? 'south' : 'north';
    }

    // Check if new position is walkable
    if (this.world.isWalkable(newX, newY)) {
      monster.x = newX;
      monster.y = newY;
    }
  }
}
