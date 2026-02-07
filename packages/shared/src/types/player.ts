export type Direction = 'north' | 'south' | 'east' | 'west';

export interface PlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: Direction;
  spriteId: number;
  health: number;
  maxHealth: number;
}

export interface PlayerPosition {
  x: number;
  y: number;
  direction: Direction;
}
