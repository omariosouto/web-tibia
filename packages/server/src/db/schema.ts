import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  uuid,
} from 'drizzle-orm/pg-core';

// Players table
export const players = pgTable('players', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  positionX: integer('position_x').notNull().default(100),
  positionY: integer('position_y').notNull().default(100),
  positionZ: integer('position_z').notNull().default(0),
  spriteId: integer('sprite_id').notNull().default(0),
  direction: text('direction', { enum: ['north', 'south', 'east', 'west'] })
    .notNull()
    .default('south'),
  health: integer('health').notNull().default(100),
  maxHealth: integer('max_health').notNull().default(100),
  isOnline: boolean('is_online').notNull().default(false),
  lastSeen: timestamp('last_seen').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Maps table
export const maps = pgTable('maps', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  layers: integer('layers').notNull().default(1),
  data: jsonb('data').notNull(),
  spawnX: integer('spawn_x').notNull().default(50),
  spawnY: integer('spawn_y').notNull().default(50),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Monster types table
export const monsterTypes = pgTable('monster_types', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  health: integer('health').notNull(),
  damage: integer('damage').notNull(),
  spriteId: integer('sprite_id').notNull(),
  respawnTime: integer('respawn_time').notNull().default(30),
});

// Monster spawns table
export const monsterSpawns = pgTable('monster_spawns', {
  id: uuid('id').defaultRandom().primaryKey(),
  mapId: uuid('map_id')
    .references(() => maps.id)
    .notNull(),
  monsterTypeId: integer('monster_type_id')
    .references(() => monsterTypes.id)
    .notNull(),
  spawnX: integer('spawn_x').notNull(),
  spawnY: integer('spawn_y').notNull(),
  radius: integer('radius').notNull().default(3),
});

// Type exports
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Map = typeof maps.$inferSelect;
export type NewMap = typeof maps.$inferInsert;
export type MonsterType = typeof monsterTypes.$inferSelect;
export type MonsterSpawn = typeof monsterSpawns.$inferSelect;
