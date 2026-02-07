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
}
