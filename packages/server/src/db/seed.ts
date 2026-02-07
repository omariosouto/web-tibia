import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root
config({ path: resolve(__dirname, '../../../../.env') });
import postgres from 'postgres';
import { maps, monsterTypes, monsterSpawns } from './schema';
import type { MapData } from '@web-tibia/shared';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  console.log('Seeding database...');

  // Create monster types
  const monsters = [
    { id: 0, name: 'Rat', health: 20, damage: 2, spriteId: 0, respawnTime: 30 },
    { id: 1, name: 'Snake', health: 35, damage: 5, spriteId: 4, respawnTime: 45 },
    { id: 2, name: 'Spider', health: 50, damage: 8, spriteId: 8, respawnTime: 60 },
  ];

  for (const monster of monsters) {
    await db
      .insert(monsterTypes)
      .values(monster)
      .onConflictDoNothing({ target: monsterTypes.id });
  }
  console.log('Monster types created');

  // Create starter map (20x20 tiles)
  const mapData: MapData = {
    version: '1.0.0',
    name: 'Starter Town',
    width: 20,
    height: 20,
    spawnX: 10,
    spawnY: 10,
    tiles: generateStarterMap(20, 20),
    objects: [],
  };

  const [map] = await db
    .insert(maps)
    .values({
      name: 'starter-town',
      width: 20,
      height: 20,
      layers: 1,
      data: mapData,
      spawnX: 10,
      spawnY: 10,
    })
    .onConflictDoNothing({ target: maps.name })
    .returning();

  if (map) {
    console.log('Starter map created');

    // Add monster spawns
    const spawns = [
      { mapId: map.id, monsterTypeId: 0, spawnX: 3, spawnY: 3, radius: 2 },
      { mapId: map.id, monsterTypeId: 0, spawnX: 16, spawnY: 3, radius: 2 },
      { mapId: map.id, monsterTypeId: 1, spawnX: 3, spawnY: 16, radius: 2 },
      { mapId: map.id, monsterTypeId: 2, spawnX: 16, spawnY: 16, radius: 2 },
    ];

    for (const spawn of spawns) {
      await db.insert(monsterSpawns).values(spawn).onConflictDoNothing();
    }
    console.log('Monster spawns created');
  }

  console.log('Seed completed!');
  process.exit(0);
}

function generateStarterMap(width: number, height: number) {
  const layer: { spriteId: number; walkable: boolean; transparent: boolean }[][] = [];

  for (let y = 0; y < height; y++) {
    const row: { spriteId: number; walkable: boolean; transparent: boolean }[] = [];
    for (let x = 0; x < width; x++) {
      // Border walls
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        row.push({ spriteId: 3, walkable: false, transparent: false }); // Stone wall
      }
      // Some random trees/obstacles
      else if (
        (x === 5 && y === 5) ||
        (x === 14 && y === 5) ||
        (x === 5 && y === 14) ||
        (x === 14 && y === 14)
      ) {
        row.push({ spriteId: 1, walkable: false, transparent: false }); // Tree
      }
      // Grass everywhere else
      else {
        row.push({ spriteId: 0, walkable: true, transparent: true }); // Grass
      }
    }
    layer.push(row);
  }

  return [layer]; // Single layer for now
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
