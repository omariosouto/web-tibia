import type { Direction, PlayerState } from '@web-tibia/shared';

export interface PlayerConfig {
  id: string;
  socketId: string;
  name: string;
  x: number;
  y: number;
  direction?: Direction;
  spriteId?: number;
  health?: number;
  maxHealth?: number;
}

export class Player {
  readonly id: string;
  readonly socketId: string;
  readonly name: string;
  x: number;
  y: number;
  direction: Direction;
  spriteId: number;
  health: number;
  maxHealth: number;

  constructor(config: PlayerConfig) {
    this.id = config.id;
    this.socketId = config.socketId;
    this.name = config.name;
    this.x = config.x;
    this.y = config.y;
    this.direction = config.direction ?? 'south';
    this.spriteId = config.spriteId ?? 0;
    this.health = config.health ?? 100;
    this.maxHealth = config.maxHealth ?? 100;
  }

  toState(): PlayerState {
    return {
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      direction: this.direction,
      spriteId: this.spriteId,
      health: this.health,
      maxHealth: this.maxHealth,
    };
  }
}
