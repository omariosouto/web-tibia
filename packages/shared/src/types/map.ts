export interface TileData {
  spriteId: number;
  walkable: boolean;
  transparent: boolean;
}

export interface MapObject {
  id: string;
  spriteId: number;
  x: number;
  y: number;
  layer: number;
  properties: Record<string, unknown>;
}

export interface MapData {
  version: string;
  name: string;
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  tiles: TileData[][][]; // [layer][y][x]
  objects: MapObject[];
}
