import { TILE_SIZE } from '@web-tibia/shared';
import type { MapData, PlayerState, MonsterState } from '@web-tibia/shared';
import { SpriteManager } from './SpriteManager';
import { Camera } from './Camera';

// Map our tile IDs to Tibia sprite IDs (global IDs across all sheets)
// Each sheet has 144 sprites (12x12), so sheet N starts at N*144
const TILE_SPRITE_MAP: Record<number, number> = {
  0: 102, // Grass (Sprites-0, row 8, col 6)
  1: 8 * 144 + 0 * 12 + 0, // Tree (Sprites-8, row 0, col 0)
  2: 106, // Dirt (Sprites-0)
  3: 134, // Stone wall (Sprites-0)
  4: 128, // Water (Sprites-0)
  5: 106, // Sand/dirt variant
};

// Monster sprite IDs - using actual creature sprites from Tibia
// Each sheet = 144 sprites (12x12), position = sheet*144 + row*12 + col
const MONSTER_SPRITE_MAP: Record<number, number> = {
  1: 6 * 144 + 0 * 12 + 0, // Rat - Sprites-6, row 0, col 0 (gray rat)
  2: 5 * 144 + 0 * 12 + 0, // Snake - Sprites-5, row 0, col 0 (green snake)
  3: 14 * 144 + 1 * 12 + 4, // Spider - Sprites-14, row 1, col 4 (brown tarantula)
};

// Player sprite IDs based on direction
// Using ghost/mage characters from Sprites-16, row 3 (magical blue ghosts)
const PLAYER_SPRITE_MAP: Record<string, number> = {
  south: 16 * 144 + 3 * 12 + 0, // Facing south
  north: 16 * 144 + 3 * 12 + 6, // Facing north
  east: 16 * 144 + 3 * 12 + 9, // Facing east
  west: 16 * 144 + 3 * 12 + 3, // Facing west
};

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spriteManager: SpriteManager;
  private camera: Camera;

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

  private useSprites(): boolean {
    return this.spriteManager.isAllLoaded();
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

        if (this.useSprites()) {
          // Use Tibia sprites
          const spriteId = TILE_SPRITE_MAP[tile.spriteId] ?? TILE_SPRITE_MAP[0];
          this.spriteManager.drawSpriteById(
            this.ctx,
            spriteId,
            screenPos.x,
            screenPos.y
          );
        } else {
          // Fallback to colored rectangles while loading
          const colors: Record<number, string> = {
            0: '#4a7c4e', 1: '#2d5a2d', 2: '#8b7355',
            3: '#6b6b6b', 4: '#4a90d9', 5: '#c2b280',
          };
          this.ctx.fillStyle = colors[tile.spriteId] ?? '#333';
          this.ctx.fillRect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);
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

    if (this.useSprites()) {
      // Draw player sprite based on direction
      const spriteId = PLAYER_SPRITE_MAP[player.direction] ?? PLAYER_SPRITE_MAP.south;
      this.spriteManager.drawSpriteById(this.ctx, spriteId, screenPos.x, screenPos.y);

      // Draw selection outline for local player
      if (isLocal) {
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);
      }
    } else {
      // Fallback to colored circle while loading
      const directionColors: Record<string, string> = {
        north: '#ff6b6b', south: '#4ecdc4', east: '#ffe66d', west: '#95e1d3',
      };
      const color = isLocal ? '#ffffff' : directionColors[player.direction];
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

      if (isLocal) {
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    }

    // Draw player name
    this.ctx.fillStyle = isLocal ? '#ffff00' : '#ffffff';
    this.ctx.font = '11px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(player.name, screenPos.x + TILE_SIZE / 2, screenPos.y - 4);
  }

  private renderMonster(monster: MonsterState, selectedTargetId: string | null): void {
    const screenPos = this.camera.worldToScreen(monster.x, monster.y);
    const isSelected = monster.id === selectedTargetId;

    if (this.useSprites()) {
      // Draw monster sprite
      const spriteId = MONSTER_SPRITE_MAP[monster.typeId] ?? MONSTER_SPRITE_MAP[1];
      this.spriteManager.drawSpriteById(this.ctx, spriteId, screenPos.x, screenPos.y);
    } else {
      // Fallback to colored square while loading
      const monsterColors: Record<number, string> = {
        1: '#d32f2f', 2: '#388e3c', 3: '#7b1fa2',
      };
      this.ctx.fillStyle = monsterColors[monster.typeId] ?? '#888888';
      this.ctx.fillRect(screenPos.x + 4, screenPos.y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    }

    // Draw selection indicator (red border like Tibia)
    if (isSelected) {
      this.ctx.strokeStyle = '#ff0000';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);
    }

    // Draw health bar
    const healthBarWidth = TILE_SIZE - 4;
    const healthBarHeight = 3;
    const healthPercent = monster.health / monster.maxHealth;

    // Health bar background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(screenPos.x + 2, screenPos.y - 6, healthBarWidth, healthBarHeight);

    // Health bar fill (green -> yellow -> red based on health)
    const healthColor = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    this.ctx.fillStyle = healthColor;
    this.ctx.fillRect(screenPos.x + 2, screenPos.y - 6, healthBarWidth * healthPercent, healthBarHeight);

    // Draw monster name
    this.ctx.fillStyle = isSelected ? '#ff0000' : '#ffffff';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(monster.name, screenPos.x + TILE_SIZE / 2, screenPos.y - 10);
  }

  getCamera(): Camera {
    return this.camera;
  }

  getSpriteManager(): SpriteManager {
    return this.spriteManager;
  }
}
