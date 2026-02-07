import { TILE_SIZE } from '@web-tibia/shared';

export class Camera {
  x = 0;
  y = 0;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  follow(targetX: number, targetY: number): void {
    // Center on target with smooth lerp
    const lerpFactor = 0.15;
    const targetCamX = targetX - this.width / 2 + TILE_SIZE / 2;
    const targetCamY = targetY - this.height / 2 + TILE_SIZE / 2;

    this.x += (targetCamX - this.x) * lerpFactor;
    this.y += (targetCamY - this.y) * lerpFactor;
  }

  setPosition(x: number, y: number): void {
    this.x = x - this.width / 2 + TILE_SIZE / 2;
    this.y = y - this.height / 2 + TILE_SIZE / 2;
  }

  getVisibleTiles(tileSize: number) {
    return {
      startX: Math.floor(this.x / tileSize) - 1,
      startY: Math.floor(this.y / tileSize) - 1,
      endX: Math.ceil((this.x + this.width) / tileSize) + 1,
      endY: Math.ceil((this.y + this.height) / tileSize) + 1,
    };
  }

  worldToScreen(worldX: number, worldY: number) {
    return {
      x: Math.round(worldX - this.x),
      y: Math.round(worldY - this.y),
    };
  }
}
