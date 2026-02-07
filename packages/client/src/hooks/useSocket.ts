import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  Direction,
} from '@web-tibia/shared';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<GameSocket | null>(null);
  const {
    setPlayers,
    setPlayerId,
    setMapData,
    setMonsters,
    addPlayer,
    removePlayer,
    updatePlayer,
    setConnected,
    setInGame,
  } = useGameStore();

  useEffect(() => {
    const socket: GameSocket = io(SOCKET_URL);
    socketRef.current = socket;

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

    socket.on('error', (message) => {
      console.error('Socket error:', message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinGame = useCallback((name: string) => {
    socketRef.current?.emit('player:join', { name });
  }, []);

  const move = useCallback((direction: Direction) => {
    socketRef.current?.emit('player:move', {
      direction,
      timestamp: Date.now(),
    });
  }, []);

  return { joinGame, move, socket: socketRef.current };
}
