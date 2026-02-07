import { TILE_SIZE } from '@web-tibia/shared';
import type { MapData, PlayerState, MonsterState } from '@web-tibia/shared';
import { SpriteManager } from './SpriteManager';
import { Camera } from './Camera';

// Colors for placeholder tiles
const TILE_COLORS: Record<number, string> = {
  0: '#4a7c4e', // Grass
  1: '#2d5a2d', // Dark grass / tree
  2: '#8b7355', // Dirt
  3: '#6b6b6b', // Stone wall
  4: '#4a90d9', // Water
  5: '#c2b280', // Sand
};

const DIRECTION_COLORS: Record<string, string> = {
  north: '#ff6b6b',
  south: '#4ecdc4',
  east: '#ffe66d',
  west: '#95e1d3',
};

// Monster type colors (by typeId)
const MONSTER_COLORS: Record<number, string> = {
  1: '#d32f2f', // Rat - red
  2: '#388e3c', // Snake - green
  3: '#7b1fa2', // Spider - purple
};

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spriteManager: SpriteManager;
  private camera: Camera;
  private usePlaceholders = true; // Use colored rectangles instead of sprites

  constructor(canvas: HTMLCanvasElement, spriteManager: SpriteManager) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2d context');
    this.ctx = ctx;
    this.spriteManager = spriteManager;
    this.camera = new Camera(canvas.width, canvas.height);

    // Disable antialiasing for pixel art
    this.ctx.imageSmoothingEnabled = false;
  }

  render(
    mapData: MapData | null,
    players: PlayerState[],
    monsters: MonsterState[],
    localPlayerId: string | null,
    selectedTargetId: string | null
  ): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!mapData) return;

    // Update camera to follow local player
    const localPlayer = players.find((p) => p.id === localPlayerId);
    if (localPlayer) {
      this.camera.follow(localPlayer.x, localPlayer.y);
    }

    // Render layers
    this.renderGround(mapData);
    this.renderEntities(players, monsters, localPlayerId, selectedTargetId);
  }

  private renderGround(mapData: MapData): void {
    const visible = this.camera.getVisibleTiles(TILE_SIZE);

    for (let y = visible.startY; y <= visible.endY; y++) {
      for (let x = visible.startX; x <= visible.endX; x++) {
        const tile = mapData.tiles[0]?.[y]?.[x];
        if (!tile) continue;

        const screenPos = this.camera.worldToScreen(x * TILE_SIZE, y * TILE_SIZE);

        if (this.usePlaceholders) {
          // Draw colored rectangle
          this.ctx.fillStyle = TILE_COLORS[tile.spriteId] ?? '#333';
          this.ctx.fillRect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);

          // Draw grid lines
          this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          this.ctx.strokeRect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);
        } else {
          this.spriteManager.drawSprite(
            this.ctx,
            'tiles',
            tile.spriteId,
            screenPos.x,
            screenPos.y
          );
        }
      }
    }
  }

  private renderEntities(
    players: PlayerState[],
    monsters: MonsterState[],
    localPlayerId: string | null,
    selectedTargetId: string | null
  ): void {
    // Combine players and monsters for depth sorting
    type Entity =
      | { type: 'player'; data: PlayerState }
      | { type: 'monster'; data: MonsterState };

    const entities: Entity[] = [
      ...players.map((p) => ({ type: 'player' as const, data: p })),
      ...monsters.filter((m) => m.isAlive).map((m) => ({ type: 'monster' as const, data: m })),
    ];

    // Sort by Y for depth effect
    entities.sort((a, b) => a.data.y - b.data.y);

    for (const entity of entities) {
      if (entity.type === 'player') {
        this.renderPlayer(entity.data, localPlayerId);
      } else {
        this.renderMonster(entity.data, selectedTargetId);
      }
    }
  }

  private renderPlayer(player: PlayerState, localPlayerId: string | null): void {
    const screenPos = this.camera.worldToScreen(player.x, player.y);
    const isLocal = player.id === localPlayerId;

    if (this.usePlaceholders) {
      // Draw player as colored circle
      const color = isLocal ? '#ffffff' : DIRECTION_COLORS[player.direction];
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(
        screenPos.x + TILE_SIZE / 2,
        screenPos.y + TILE_SIZE / 2,
        TILE_SIZE / 2 - 4,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      // Draw direction indicator
      this.ctx.fillStyle = '#333';
      const dirOffset = this.getDirectionOffset(player.direction);
      this.ctx.beginPath();
      this.ctx.arc(
        screenPos.x + TILE_SIZE / 2 + dirOffset.x * 8,
        screenPos.y + TILE_SIZE / 2 + dirOffset.y * 8,
        4,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      // Outline for local player
      if (isLocal) {
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(
          screenPos.x + TILE_SIZE / 2,
          screenPos.y + TILE_SIZE / 2,
          TILE_SIZE / 2 - 2,
          0,
          Math.PI * 2
        );
        this.ctx.stroke();
      }
    } else {
      // Draw sprite (when available)
      const spriteId = player.spriteId;
      this.spriteManager.drawSprite(
        this.ctx,
        'characters',
        spriteId,
        screenPos.x,
        screenPos.y
      );
    }

    // Draw player name
    this.ctx.fillStyle = isLocal ? '#ffff00' : '#ffffff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(player.name, screenPos.x + TILE_SIZE / 2, screenPos.y - 5);
  }

  private renderMonster(monster: MonsterState, selectedTargetId: string | null): void {
    const screenPos = this.camera.worldToScreen(monster.x, monster.y);
    const isSelected = monster.id === selectedTargetId;

    // Draw monster as colored square
    const color = MONSTER_COLORS[monster.typeId] ?? '#888888';
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      screenPos.x + 4,
      screenPos.y + 4,
      TILE_SIZE - 8,
      TILE_SIZE - 8
    );

    // Draw selection indicator
    if (isSelected) {
      this.ctx.strokeStyle = '#ffff00';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(
        screenPos.x + 2,
        screenPos.y + 2,
        TILE_SIZE - 4,
        TILE_SIZE - 4
      );
    }

    // Draw health bar
    const healthBarWidth = TILE_SIZE - 8;
    const healthBarHeight = 4;
    const healthPercent = monster.health / monster.maxHealth;

    // Health bar background
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(
      screenPos.x + 4,
      screenPos.y - 8,
      healthBarWidth,
      healthBarHeight
    );

    // Health bar fill
    const healthColor = healthPercent > 0.5 ? '#4caf50' : healthPercent > 0.25 ? '#ff9800' : '#f44336';
    this.ctx.fillStyle = healthColor;
    this.ctx.fillRect(
      screenPos.x + 4,
      screenPos.y - 8,
      healthBarWidth * healthPercent,
      healthBarHeight
    );

    // Draw monster name
    this.ctx.fillStyle = isSelected ? '#ffff00' : '#ffffff';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(monster.name, screenPos.x + TILE_SIZE / 2, screenPos.y - 12);
  }

  private getDirectionOffset(direction: string): { x: number; y: number } {
    switch (direction) {
      case 'north':
        return { x: 0, y: -1 };
      case 'south':
        return { x: 0, y: 1 };
      case 'east':
        return { x: 1, y: 0 };
      case 'west':
        return { x: -1, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  }

  getCamera(): Camera {
    return this.camera;
  }
}
