import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@web-tibia/shared';
import { PlayerJoinSchema, PlayerMoveSchema } from '@web-tibia/shared';
import { GameState } from '../game/GameState';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function setupSocketEvents(io: GameServer, gameState: GameState) {
  io.on('connection', (socket: GameSocket) => {
    console.log(`Player connected: ${socket.id}`);

    // Player join
    socket.on('player:join', (data) => {
      const validated = PlayerJoinSchema.safeParse(data);
      if (!validated.success) {
        socket.emit('error', 'Invalid join data');
        return;
      }

      const player = gameState.addPlayer(socket.id, validated.data.name);
      console.log(`Player joined: ${player.name} (${player.id})`);

      // Send initial state to the new player
      socket.emit('game:init', {
        playerId: player.id,
        mapData: gameState.getMapData(),
        players: gameState.getAllPlayers(),
        monsters: gameState.getAllMonsters(),
      });

      // Notify other players
      socket.broadcast.emit('player:joined', player.toState());
    });

    // Player movement
    socket.on('player:move', (data) => {
      const validated = PlayerMoveSchema.safeParse(data);
      if (!validated.success) return;

      const result = gameState.movePlayer(socket.id, validated.data.direction);
      if (result.success && result.player) {
        // Broadcast to all (including sender for reconciliation)
        io.emit('player:moved', {
          id: result.player.id,
          x: result.player.x,
          y: result.player.y,
          direction: validated.data.direction,
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      const player = gameState.removePlayer(socket.id);
      if (player) {
        io.emit('player:left', player.id);
      }
    });
  });

  // Game tick - broadcast state periodically (for sync)
  setInterval(() => {
    io.emit('game:state', {
      players: gameState.getAllPlayers(),
      monsters: gameState.getAllMonsters(),
      timestamp: Date.now(),
    });
  }, 100); // 10 updates per second
}
