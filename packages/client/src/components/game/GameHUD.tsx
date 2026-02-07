import { useGameStore } from '../../stores/gameStore';

export function GameHUD() {
  const { players, playerId, playerName, getSelectedMonster } = useGameStore();
  const localPlayer = players.find((p) => p.id === playerId);
  const selectedMonster = getSelectedMonster();

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

      {/* Selected Target */}
      {selectedMonster && (
        <div className="bg-gray-800/90 rounded-lg p-3 text-white">
          <h4 className="font-bold text-sm text-yellow-400 mb-2">Target</h4>
          <p className="text-sm">{selectedMonster.name}</p>
          <div className="mt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">HP:</span>
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${(selectedMonster.health / selectedMonster.maxHealth) * 100}%`,
                    backgroundColor:
                      selectedMonster.health / selectedMonster.maxHealth > 0.5
                        ? '#4caf50'
                        : selectedMonster.health / selectedMonster.maxHealth > 0.25
                          ? '#ff9800'
                          : '#f44336',
                  }}
                />
              </div>
              <span className="text-xs">
                {selectedMonster.health}/{selectedMonster.maxHealth}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Press SPACE to attack</p>
        </div>
      )}

      {/* Controls Help */}
      <div className="bg-gray-800/90 rounded-lg p-3 text-gray-400 text-xs">
        <p>Arrow keys / WASD to move</p>
        <p>Click monster to select</p>
        <p>SPACE or double-click to attack</p>
      </div>
    </div>
  );
}
