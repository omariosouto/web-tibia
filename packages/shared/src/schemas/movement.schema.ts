import { z } from 'zod';
import { DirectionSchema } from './player.schema';

export const PlayerMoveSchema = z.object({
  direction: DirectionSchema,
  timestamp: z.number(),
});

export type PlayerMoveType = z.infer<typeof PlayerMoveSchema>;
