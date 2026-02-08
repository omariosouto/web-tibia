import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@web-tibia/shared';
import { PlayerJoinSchema, PlayerMoveSchema, AttackSchema } from '@web-tibia/shared';
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

    // Combat attack
    socket.on('combat:attack', (data) => {
      const validated = AttackSchema.safeParse(data);
      if (!validated.success) {
        socket.emit('error', 'Invalid attack data');
        return;
      }

      const result = gameState.attackMonster(socket.id, validated.data.targetId);

      // If player moved to chase target, broadcast the movement
      if (result.outOfRange && result.playerMoved) {
        io.emit('player:moved', {
          id: result.playerMoved.id,
          x: result.playerMoved.x,
          y: result.playerMoved.y,
          direction: result.playerMoved.direction,
        });
      }

      if (result.success && result.damageEvent) {
        // Broadcast damage to all players
        io.emit('combat:damage', result.damageEvent);

        // If monster died, broadcast that too
        if (result.monsterDied) {
          io.emit('monster:died', { monsterId: validated.data.targetId });
        }
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

  // Set up monster respawn callback
  gameState.setOnMonsterRespawn((monster) => {
    io.emit('monster:respawn', monster);
  });

  // Game tick - broadcast state periodically (for sync)
  setInterval(() => {
    io.emit('game:state', {
      players: gameState.getAllPlayers(),
      monsters: gameState.getAllMonsters(),
      timestamp: Date.now(),
    });
  }, 100); // 10 updates per second

  // Monster AI tick - monsters attack nearby players
  setInterval(() => {
    const attacks = gameState.tickMonsterAI();
    for (const attack of attacks) {
      // Broadcast monster attacks to all players
      io.emit('combat:damage', {
        attackerId: attack.attackerId,
        targetId: attack.targetId,
        damage: attack.damage,
        targetHealth: attack.targetHealth,
        targetMaxHealth: attack.targetMaxHealth,
      });
    }
  }, 500); // Monster AI runs every 500ms
}
