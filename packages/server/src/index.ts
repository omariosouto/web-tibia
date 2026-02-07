import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { createSocketServer } from './config/socket';
import { setupSocketEvents } from './events';
import { GameState } from './game/GameState';
import { db, maps } from './db';
import { eq } from 'drizzle-orm';
import type { MapData } from '@web-tibia/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root
config({ path: resolve(__dirname, '../../../.env') });

const PORT = process.env.PORT || 3001;

async function main() {
  // Create Express app
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Create Socket.io server
  const io = createSocketServer(httpServer);

  // Load map from database
  const [mapRow] = await db.select().from(maps).where(eq(maps.name, 'starter-town'));

  if (!mapRow) {
    console.error('No map found! Run db:seed first.');
    process.exit(1);
  }

  const mapData = mapRow.data as MapData;
  console.log(`Loaded map: ${mapData.name} (${mapData.width}x${mapData.height})`);

  // Create game state
  const gameState = new GameState(mapData);

  // Setup socket events
  setupSocketEvents(io, gameState);

  // Start server
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket ready for connections`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
