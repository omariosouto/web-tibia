import { create } from 'zustand';
import type { PlayerState, MapData, MonsterState } from '@web-tibia/shared';

interface GameStore {
  // State
  playerId: string | null;
  playerName: string | null;
  players: PlayerState[];
  monsters: MonsterState[];
  mapData: MapData | null;
  isConnected: boolean;
  isInGame: boolean;

  // Actions
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setPlayers: (players: PlayerState[]) => void;
  setMapData: (mapData: MapData) => void;
  setMonsters: (monsters: MonsterState[]) => void;
  addPlayer: (player: PlayerState) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<PlayerState>) => void;
  setConnected: (connected: boolean) => void;
  setInGame: (inGame: boolean) => void;
  reset: () => void;

  // Selectors
  getLocalPlayer: () => PlayerState | undefined;
}

const initialState = {
  playerId: null,
  playerName: null,
  players: [],
  monsters: [],
  mapData: null,
  isConnected: false,
  isInGame: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setPlayerId: (id) => set({ playerId: id }),
  setPlayerName: (name) => set({ playerName: name }),
  setPlayers: (players) => set({ players }),
  setMapData: (mapData) => set({ mapData }),
  setMonsters: (monsters) => set({ monsters }),

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players.filter((p) => p.id !== player.id), player],
    })),

  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    })),

  updatePlayer: (playerId, updates) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, ...updates } : p
      ),
    })),

  setConnected: (connected) => set({ isConnected: connected }),
  setInGame: (inGame) => set({ isInGame: inGame }),

  reset: () => set(initialState),

  getLocalPlayer: () => {
    const { playerId, players } = get();
    return players.find((p) => p.id === playerId);
  },
}));
