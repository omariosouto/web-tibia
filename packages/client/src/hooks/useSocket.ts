import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  Direction,
} from '@web-tibia/shared';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// Singleton socket instance
let socket: GameSocket | null = null;
let isInitialized = false;

function getSocket(): GameSocket {
  if (!socket) {
    socket = io(SOCKET_URL);
  }
  return socket;
}

export function useSocket() {
  const {
    setPlayers,
    setPlayerId,
    setMapData,
    setMonsters,
    addPlayer,
    removePlayer,
    updatePlayer,
    updateMonster,
    setConnected,
    setInGame,
    setSelectedTarget,
  } = useGameStore();

  useEffect(() => {
    // Only initialize event listeners once
    if (isInitialized) return;
    isInitialized = true;

    const socket = getSocket();

    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
      setInGame(false);
    });

    socket.on('game:init', (data) => {
      console.log('Game initialized', data);
      setPlayerId(data.playerId);
      setMapData(data.mapData);
      setPlayers(data.players);
      setMonsters(data.monsters);
      setInGame(true);
    });

    socket.on('player:joined', (player) => {
      console.log('Player joined:', player.name);
      addPlayer(player);
    });

    socket.on('player:left', (playerId) => {
      console.log('Player left:', playerId);
      removePlayer(playerId);
    });

    socket.on('player:moved', (data) => {
      updatePlayer(data.id, {
        x: data.x,
        y: data.y,
        direction: data.direction as Direction,
      });
    });

    socket.on('game:state', (state) => {
      setPlayers(state.players);
      setMonsters(state.monsters);
    });

    socket.on('combat:damage', (event) => {
      console.log('Damage dealt:', event);
      // Check if target is a monster or player
      const currentMonsters = useGameStore.getState().monsters;
      const isMonster = currentMonsters.some((m) => m.id === event.targetId);

      if (isMonster) {
        updateMonster(event.targetId, {
          health: event.targetHealth,
        });
      } else {
        // Target is a player
        updatePlayer(event.targetId, {
          health: event.targetHealth,
        });
      }
    });

    socket.on('monster:died', ({ monsterId }) => {
      console.log('Monster died:', monsterId);
      updateMonster(monsterId, { isAlive: false, health: 0 });
      // Deselect if this was our target
      if (useGameStore.getState().selectedTargetId === monsterId) {
        setSelectedTarget(null);
      }
    });

    socket.on('monster:respawn', (monster) => {
      console.log('Monster respawned:', monster.name);
      // Replace the monster in the list with fresh state
      const currentMonsters = useGameStore.getState().monsters;
      setMonsters(
        currentMonsters.map((m) => (m.id === monster.id ? monster : m))
      );
    });

    socket.on('error', (message) => {
      console.error('Socket error:', message);
    });

    // Don't disconnect on cleanup - keep connection alive
  }, [
    setPlayers,
    setPlayerId,
    setMapData,
    setMonsters,
    addPlayer,
    removePlayer,
    updatePlayer,
    updateMonster,
    setConnected,
    setInGame,
    setSelectedTarget,
  ]);

  const joinGame = useCallback((name: string) => {
    getSocket().emit('player:join', { name });
  }, []);

  const move = useCallback((direction: Direction) => {
    getSocket().emit('player:move', {
      direction,
      timestamp: Date.now(),
    });
  }, []);

  const attack = useCallback((targetId: string) => {
    getSocket().emit('combat:attack', { targetId });
  }, []);

  return { joinGame, move, attack, socket: getSocket() };
}
