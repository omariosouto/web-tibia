export interface SpriteSheet {
  image: HTMLImageElement;
  tileWidth: number;
  tileHeight: number;
  columns: number;
  rows: number;
}

// Tibia sprite sheets are 12x12 grids of 32x32 sprites
const SPRITES_PER_SHEET = 144; // 12 * 12

// Sprite ID mappings for common tiles
export const SPRITE_IDS = {
  // Ground tiles (from Sprites-0)
  GRASS: 102,
  GRASS_EDGE_N: 103,
  GRASS_EDGE_S: 115,
  GRASS_EDGE_W: 114,
  GRASS_EDGE_E: 116,
  DIRT: 106,
  STONE: 134,
  WATER: 128,

  // Creatures (from Sprites-5/6/7)
  RAT: 720 + 72, // Sprites-5, row 6
  WOLF: 720 + 108, // Sprites-5, row 9
  ORC: 720 + 48, // Sprites-5, row 4
};

export class SpriteManager {
  private spriteSheets: Map<string, SpriteSheet> = new Map();
  private loadPromises: Map<string, Promise<SpriteSheet>> = new Map();
  private allLoaded = false;

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
      image.onerror = () => reject(new Error(`Failed to load sprite: ${src}`));
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
    ctx.drawImage(sheet.image, sx, sy, sw, sh, x, y, width ?? sw, height ?? sh);
  }

  isLoaded(name: string): boolean {
    return this.spriteSheets.has(name);
  }

  async loadAllTibiaSprites(): Promise<void> {
    if (this.allLoaded) return;

    const sheetCount = 23; // Sprites-0 to Sprites-22
    const promises: Promise<SpriteSheet>[] = [];

    for (let i = 0; i < sheetCount; i++) {
      promises.push(
        this.loadSpriteSheet(`sprites-${i}`, `/sprites/Sprites-${i}.png`, 32, 32)
      );
    }

    await Promise.all(promises);
    this.allLoaded = true;
  }

  isAllLoaded(): boolean {
    return this.allLoaded;
  }

  // Draw sprite by global ID (spans across multiple sheets)
  drawSpriteById(
    ctx: CanvasRenderingContext2D,
    globalSpriteId: number,
    x: number,
    y: number,
    width?: number,
    height?: number
  ): void {
    const sheetIndex = Math.floor(globalSpriteId / SPRITES_PER_SHEET);
    const localSpriteId = globalSpriteId % SPRITES_PER_SHEET;
    const sheetName = `sprites-${sheetIndex}`;

    if (!this.spriteSheets.has(sheetName)) return;

    this.drawSprite(ctx, sheetName, localSpriteId, x, y, width, height);
  }
}
