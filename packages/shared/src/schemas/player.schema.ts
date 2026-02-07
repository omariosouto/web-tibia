import { z } from 'zod';

export const DirectionSchema = z.enum(['north', 'south', 'east', 'west']);

export const PlayerStateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(20),
  x: z.number(),
  y: z.number(),
  direction: DirectionSchema,
  spriteId: z.number().int().min(0),
  health: z.number().int().min(0),
  maxHealth: z.number().int().min(1),
});

export type PlayerStateType = z.infer<typeof PlayerStateSchema>;
