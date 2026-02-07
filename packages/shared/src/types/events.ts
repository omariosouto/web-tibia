import type { PlayerState, Direction } from './player';
import type { MapData } from './map';
import type { MonsterState } from './monster';

// Client -> Server Events
export interface ClientToServerEvents {
  'player:join': (data: { name: string }) => void;
  'player:move': (data: { direction: Direction; timestamp: number }) => void;
  'player:stop': () => void;
  'combat:attack': (data: { targetId: string }) => void;
}

// Server -> Client Events
export interface ServerToClientEvents {
  'game:init': (data: GameInitData) => void;
  'game:state': (data: WorldState) => void;
  'player:joined': (player: PlayerState) => void;
  'player:left': (playerId: string) => void;
  'player:moved': (data: PlayerMovedData) => void;
  'combat:damage': (data: DamageEvent) => void;
  'monster:died': (data: { monsterId: string }) => void;
  'monster:respawn': (monster: MonsterState) => void;
  'monsters:state': (monsters: MonsterState[]) => void;
  error: (message: string) => void;
}

export interface GameInitData {
  playerId: string;
  mapData: MapData;
  players: PlayerState[];
  monsters: MonsterState[];
}

export interface WorldState {
  players: PlayerState[];
  monsters: MonsterState[];
  timestamp: number;
}

export interface PlayerMovedData {
  id: string;
  x: number;
  y: number;
  direction: Direction;
}

export interface DamageEvent {
  attackerId: string;
  targetId: string;
  damage: number;
  targetHealth: number;
  targetMaxHealth: number;
}
