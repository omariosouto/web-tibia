import { randomUUID } from 'crypto';
import type { Direction, MapData, PlayerState, MonsterState } from '@web-tibia/shared';
import { TILE_SIZE } from '@web-tibia/shared';
import { Player } from './Player';
import { World } from './World';

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

  // Placeholder for monsters - will be implemented later
  getAllMonsters(): MonsterState[] {
    return [];
  }
}
