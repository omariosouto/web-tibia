import { useGameStore } from '../../stores/gameStore';

export function GameHUD() {
  const { players, playerId, playerName } = useGameStore();
  const localPlayer = players.find((p) => p.id === playerId);

  return (
    <div className="absolute top-4 left-4 space-y-2">
      {/* Player Info */}
      <div className="bg-gray-800/90 rounded-lg p-3 text-white">
        <h3 className="font-bold text-yellow-400">{playerName}</h3>
        {localPlayer && (
          <p className="text-sm text-gray-400">
            Position: ({Math.floor(localPlayer.x / 32)}, {Math.floor(localPlayer.y / 32)})
          </p>
        )}
      </div>

      {/* Players Online */}
      <div className="bg-gray-800/90 rounded-lg p-3 text-white">
        <h4 className="font-bold text-sm mb-2">Players Online ({players.length})</h4>
        <ul className="space-y-1">
          {players.map((player) => (
            <li
              key={player.id}
              className={`text-sm ${
                player.id === playerId ? 'text-yellow-400' : 'text-gray-300'
              }`}
            >
              {player.name}
              {player.id === playerId && ' (you)'}
            </li>
          ))}
        </ul>
      </div>

      {/* Controls Help */}
      <div className="bg-gray-800/90 rounded-lg p-3 text-gray-400 text-xs">
        <p>Arrow keys / WASD to move</p>
      </div>
    </div>
  );
}
