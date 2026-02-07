# Sistema de Sprites e Renderização

## Conceitos Básicos

- **Tile Size**: 32x32 pixels (padrão Tibia)
- **Spritesheet**: Imagem PNG com múltiplos tiles organizados em grid
- **Sprite ID**: Índice calculado como `row * COLUMNS + column`

## Spritesheets a Criar

Criar sprites simples (podem ser placeholder coloridos inicialmente):

### 1. tiles-terrain.png (512x512 = 16x16 tiles)

| ID | Tile | Cor/Descrição |
|----|------|---------------|
| 0 | Grama | Verde claro |
| 1 | Grama variação | Verde escuro |
| 2 | Terra | Marrom |
| 3 | Pedra | Cinza |
| 4 | Água | Azul (não walkable) |
| 5 | Areia | Bege |
| 6-15 | Reservado | Variações |

### 2. tiles-decoration.png (512x512)

| ID | Objeto | Descrição |
|----|--------|-----------|
| 0 | Árvore | Verde/marrom |
| 1 | Pedra grande | Cinza (não walkable) |
| 2 | Arbusto | Verde pequeno |
| 3 | Flores | Colorido |
| 4-15 | Reservado | Mais objetos |

### 3. character-base.png (128x128)

Layout: 4 colunas (direções) x 3 linhas (frames animação)

```
         South  West   East   North
Frame 0:  [0]    [1]    [2]    [3]
Frame 1:  [4]    [5]    [6]    [7]
Frame 2:  [8]    [9]    [10]   [11]
```

## SpriteManager

```typescript
// packages/client/src/engine/renderer/SpriteManager.ts
export interface SpriteSheet {
  image: HTMLImageElement;
  tileWidth: number;
  tileHeight: number;
  columns: number;
  rows: number;
}

export class SpriteManager {
  private spriteSheets: Map<string, SpriteSheet> = new Map();
  private loadPromises: Map<string, Promise<SpriteSheet>> = new Map();

  async loadSpriteSheet(
    name: string,
    src: string,
    tileWidth = 32,
    tileHeight = 32
  ): Promise<SpriteSheet> {
    if (this.loadPromises.has(name)) {
      return this.loadPromises.get(name)!;
    }

    const promise = new Promise<SpriteSheet>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const sheet: SpriteSheet = {
          image,
          tileWidth,
          tileHeight,
          columns: Math.floor(image.width / tileWidth),
          rows: Math.floor(image.height / tileHeight),
        };
        this.spriteSheets.set(name, sheet);
        resolve(sheet);
      };
      image.onerror = reject;
      image.src = src;
    });

    this.loadPromises.set(name, promise);
    return promise;
  }

  getSpriteRect(sheetName: string, spriteId: number) {
    const sheet = this.spriteSheets.get(sheetName);
    if (!sheet) throw new Error(`Spritesheet ${sheetName} not loaded`);

    const col = spriteId % sheet.columns;
    const row = Math.floor(spriteId / sheet.columns);

    return {
      sx: col * sheet.tileWidth,
      sy: row * sheet.tileHeight,
      sw: sheet.tileWidth,
      sh: sheet.tileHeight,
    };
  }

  drawSprite(
    ctx: CanvasRenderingContext2D,
    sheetName: string,
    spriteId: number,
    x: number,
    y: number,
    width?: number,
    height?: number
  ): void {
    const sheet = this.spriteSheets.get(sheetName);
    if (!sheet) return;

    const { sx, sy, sw, sh } = this.getSpriteRect(sheetName, spriteId);
    ctx.drawImage(
      sheet.image,
      sx, sy, sw, sh,
      x, y, width ?? sw, height ?? sh
    );
  }
}
```

## CanvasRenderer

```typescript
// packages/client/src/engine/renderer/CanvasRenderer.ts
import { SpriteManager } from './SpriteManager';
import { Camera } from './Camera';
import { TILE_SIZE } from '@web-tibia/shared';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spriteManager: SpriteManager;
  private camera: Camera;

  constructor(canvas: HTMLCanvasElement, spriteManager: SpriteManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.spriteManager = spriteManager;
    this.camera = new Camera(canvas.width, canvas.height);

    // Desabilitar antialiasing para pixel art
    this.ctx.imageSmoothingEnabled = false;
  }

  render(gameState: GameState): void {
    // 1. Limpar canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Atualizar câmera para seguir jogador local
    const localPlayer = gameState.getLocalPlayer();
    if (localPlayer) {
      this.camera.follow(localPlayer.x, localPlayer.y);
    }

    // 3. Renderizar camadas
    this.renderGround(gameState.mapData);
    this.renderDecorations(gameState.mapData);
    this.renderPlayers(gameState.players);
  }

  private renderGround(mapData: MapData): void {
    const visible = this.camera.getVisibleTiles(TILE_SIZE);

    for (let y = visible.startY; y <= visible.endY; y++) {
      for (let x = visible.startX; x <= visible.endX; x++) {
        const tile = mapData.tiles[0]?.[y]?.[x];
        if (!tile) continue;

        const screenPos = this.camera.worldToScreen(
          x * TILE_SIZE,
          y * TILE_SIZE
        );

        this.spriteManager.drawSprite(
          this.ctx,
          'tiles-terrain',
          tile.spriteId,
          screenPos.x,
          screenPos.y
        );
      }
    }
  }

  private renderPlayers(players: PlayerState[]): void {
    // Ordenar por Y para efeito de profundidade
    const sorted = [...players].sort((a, b) => a.y - b.y);

    for (const player of sorted) {
      const screenPos = this.camera.worldToScreen(player.x, player.y);

      // Calcular sprite baseado na direção
      const directionOffset = {
        south: 0,
        west: 1,
        east: 2,
        north: 3,
      };
      const spriteId = directionOffset[player.direction];

      this.spriteManager.drawSprite(
        this.ctx,
        'character-base',
        spriteId,
        screenPos.x,
        screenPos.y
      );

      // Renderizar nome do jogador
      this.ctx.fillStyle = 'white';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        player.name,
        screenPos.x + TILE_SIZE / 2,
        screenPos.y - 5
      );
    }
  }
}
```

## Camera System

```typescript
// packages/client/src/engine/renderer/Camera.ts
import { TILE_SIZE } from '@web-tibia/shared';

export class Camera {
  x: number = 0;
  y: number = 0;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  follow(targetX: number, targetY: number): void {
    // Centralizar no alvo com lerp suave
    const lerpFactor = 0.1;
    const targetCamX = targetX - this.width / 2 + TILE_SIZE / 2;
    const targetCamY = targetY - this.height / 2 + TILE_SIZE / 2;

    this.x += (targetCamX - this.x) * lerpFactor;
    this.y += (targetCamY - this.y) * lerpFactor;
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
```

## Game Loop

```typescript
// packages/client/src/engine/GameLoop.ts
export class GameLoop {
  private lastTime: number = 0;
  private running: boolean = false;
  private renderer: CanvasRenderer;
  private getGameState: () => GameState;

  constructor(renderer: CanvasRenderer, getGameState: () => GameState) {
    this.renderer = renderer;
    this.getGameState = getGameState;
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  stop(): void {
    this.running = false;
  }

  private loop(currentTime: number): void {
    if (!this.running) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Atualizar e renderizar
    const gameState = this.getGameState();
    this.renderer.render(gameState);

    requestAnimationFrame(this.loop.bind(this));
  }
}
```

## Integração com React

```tsx
// packages/client/src/components/game/GameCanvas.tsx
import { useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { CanvasRenderer } from '../../engine/renderer/CanvasRenderer';
import { SpriteManager } from '../../engine/renderer/SpriteManager';
import { GameLoop } from '../../engine/GameLoop';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameState = useGameStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const spriteManager = new SpriteManager();
    const renderer = new CanvasRenderer(canvas, spriteManager);
    const gameLoop = new GameLoop(renderer, () => gameState);

    // Carregar sprites
    Promise.all([
      spriteManager.loadSpriteSheet('tiles-terrain', '/sprites/tiles-terrain.png'),
      spriteManager.loadSpriteSheet('character-base', '/sprites/character-base.png'),
    ]).then(() => {
      gameLoop.start();
    });

    return () => {
      gameLoop.stop();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="border border-gray-700"
    />
  );
}
```
