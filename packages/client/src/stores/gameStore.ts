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
  selectedTargetId: string | null;

  // Actions
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setPlayers: (players: PlayerState[]) => void;
  setMapData: (mapData: MapData) => void;
  setMonsters: (monsters: MonsterState[]) => void;
  addPlayer: (player: PlayerState) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<PlayerState>) => void;
  updateMonster: (monsterId: string, updates: Partial<MonsterState>) => void;
  setConnected: (connected: boolean) => void;
  setInGame: (inGame: boolean) => void;
  setSelectedTarget: (targetId: string | null) => void;
  reset: () => void;

  // Selectors
  getLocalPlayer: () => PlayerState | undefined;
  getSelectedMonster: () => MonsterState | undefined;
}

const initialState = {
  playerId: null,
  playerName: null,
  players: [],
  monsters: [],
  mapData: null,
  isConnected: false,
  isInGame: false,
  selectedTargetId: null,
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

  updateMonster: (monsterId, updates) =>
    set((state) => ({
      monsters: state.monsters.map((m) =>
        m.id === monsterId ? { ...m, ...updates } : m
      ),
    })),

  setConnected: (connected) => set({ isConnected: connected }),
  setInGame: (inGame) => set({ isInGame: inGame }),
  setSelectedTarget: (targetId) => set({ selectedTargetId: targetId }),

  reset: () => set(initialState),

  getLocalPlayer: () => {
    const { playerId, players } = get();
    return players.find((p) => p.id === playerId);
  },

  getSelectedMonster: () => {
    const { selectedTargetId, monsters } = get();
    if (!selectedTargetId) return undefined;
    return monsters.find((m) => m.id === selectedTargetId);
  },
}));
