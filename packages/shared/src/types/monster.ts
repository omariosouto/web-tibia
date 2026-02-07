import type { Direction } from './player';

export interface MonsterState {
  id: string;
  typeId: number;
  name: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  spriteId: number;
  direction: Direction;
  isAlive: boolean;
}

export interface MonsterType {
  id: number;
  name: string;
  health: number;
  damage: number;
  spriteId: number;
  respawnTime: number;
}
