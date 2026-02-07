import type { MapData, TileData } from '@web-tibia/shared';
import { TILE_SIZE } from '@web-tibia/shared';

export class World {
  private mapData: MapData;

  constructor(mapData: MapData) {
    this.mapData = mapData;
  }

  getSpawnPoint(): { x: number; y: number } {
    return {
      x: this.mapData.spawnX * TILE_SIZE,
      y: this.mapData.spawnY * TILE_SIZE,
    };
  }

  getMapData(): MapData {
    return this.mapData;
  }

  getTile(x: number, y: number, layer = 0): TileData | null {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    if (
      tileX < 0 ||
      tileX >= this.mapData.width ||
      tileY < 0 ||
      tileY >= this.mapData.height
    ) {
      return null;
    }

    return this.mapData.tiles[layer]?.[tileY]?.[tileX] ?? null;
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    return tile.walkable;
  }
}
