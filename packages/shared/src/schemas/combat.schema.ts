import { z } from 'zod';
import { DirectionSchema } from './player.schema';

export const AttackSchema = z.object({
  targetId: z.string(),
});

export const DamageEventSchema = z.object({
  attackerId: z.string(),
  targetId: z.string(),
  damage: z.number().int().min(0),
  targetHealth: z.number().int().min(0),
  targetMaxHealth: z.number().int().min(1),
});

export const MonsterStateSchema = z.object({
  id: z.string(),
  typeId: z.number().int().min(0),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  health: z.number().int().min(0),
  maxHealth: z.number().int().min(1),
  spriteId: z.number().int().min(0),
  direction: DirectionSchema,
  isAlive: z.boolean(),
});

export type AttackType = z.infer<typeof AttackSchema>;
export type DamageEventType = z.infer<typeof DamageEventSchema>;
export type MonsterStateType = z.infer<typeof MonsterStateSchema>;
