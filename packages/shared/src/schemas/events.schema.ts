import { z } from 'zod';
import { DirectionSchema, PlayerStateSchema } from './player.schema';

export const PlayerJoinSchema = z.object({
  name: z.string().min(3).max(20),
});

export const WorldStateSchema = z.object({
  players: z.array(PlayerStateSchema),
  timestamp: z.number(),
});

export const PlayerMovedSchema = z.object({
  id: z.string().uuid(),
  x: z.number(),
  y: z.number(),
  direction: DirectionSchema,
});

export type PlayerJoinType = z.infer<typeof PlayerJoinSchema>;
export type WorldStateType = z.infer<typeof WorldStateSchema>;
export type PlayerMovedType = z.infer<typeof PlayerMovedSchema>;
