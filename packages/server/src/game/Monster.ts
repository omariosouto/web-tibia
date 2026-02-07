import { randomUUID } from 'crypto';
import type { MonsterState, Direction, MonsterType } from '@web-tibia/shared';

export const MONSTER_TYPES: Record<string, MonsterType> = {
  rat: {
    id: 1,
    name: 'Rat',
    health: 20,
    damage: 5,
    spriteId: 100, // Placeholder
    respawnTime: 10000, // 10 seconds
  },
  snake: {
    id: 2,
    name: 'Snake',
    health: 35,
    damage: 8,
    spriteId: 101,
    respawnTime: 15000,
  },
  spider: {
    id: 3,
    name: 'Spider',
    health: 50,
    damage: 12,
    spriteId: 102,
    respawnTime: 20000,
  },
};

interface MonsterConfig {
  typeId: string;
  x: number;
  y: number;
}

export class Monster {
  readonly id: string;
  readonly typeId: number;
  readonly name: string;
  readonly maxHealth: number;
  readonly damage: number;
  readonly spriteId: number;
  readonly respawnTime: number;
  readonly spawnX: number;
  readonly spawnY: number;

  x: number;
  y: number;
  health: number;
  direction: Direction;
  isAlive: boolean;

  private respawnTimer: NodeJS.Timeout | null = null;

  constructor(config: MonsterConfig) {
    const monsterType = MONSTER_TYPES[config.typeId];
    if (!monsterType) {
      throw new Error(`Unknown monster type: ${config.typeId}`);
    }

    this.id = randomUUID();
    this.typeId = monsterType.id;
    this.name = monsterType.name;
    this.maxHealth = monsterType.health;
    this.health = monsterType.health;
    this.damage = monsterType.damage;
    this.spriteId = monsterType.spriteId;
    this.respawnTime = monsterType.respawnTime;
    this.spawnX = config.x;
    this.spawnY = config.y;
    this.x = config.x;
    this.y = config.y;
    this.direction = 'south';
    this.isAlive = true;
  }

  takeDamage(amount: number): { died: boolean; damage: number } {
    if (!this.isAlive) {
      return { died: false, damage: 0 };
    }

    const actualDamage = Math.min(amount, this.health);
    this.health -= actualDamage;

    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
      return { died: true, damage: actualDamage };
    }

    return { died: false, damage: actualDamage };
  }

  scheduleRespawn(onRespawn: () => void): void {
    if (this.respawnTimer) {
      clearTimeout(this.respawnTimer);
    }

    this.respawnTimer = setTimeout(() => {
      this.respawn();
      onRespawn();
    }, this.respawnTime);
  }

  private respawn(): void {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.health = this.maxHealth;
    this.isAlive = true;
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

  cleanup(): void {
    if (this.respawnTimer) {
      clearTimeout(this.respawnTimer);
      this.respawnTimer = null;
    }
  }
}
