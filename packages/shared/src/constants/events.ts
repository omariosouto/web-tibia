// Socket.io event names
export const SOCKET_EVENTS = {
  // Client -> Server
  PLAYER_JOIN: 'player:join',
  PLAYER_MOVE: 'player:move',
  PLAYER_STOP: 'player:stop',
  COMBAT_ATTACK: 'combat:attack',

  // Server -> Client
  GAME_INIT: 'game:init',
  GAME_STATE: 'game:state',
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  PLAYER_MOVED: 'player:moved',
  COMBAT_DAMAGE: 'combat:damage',
  MONSTER_DIED: 'monster:died',
  MONSTER_RESPAWN: 'monster:respawn',
  MONSTERS_STATE: 'monsters:state',
  ERROR: 'error',
} as const;
