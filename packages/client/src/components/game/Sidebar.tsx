import { useGameStore } from '../../stores/gameStore';

export function Sidebar() {
  const { players, monsters, playerId, playerName, selectedTargetId, setSelectedTarget, getSelectedMonster } =
    useGameStore();
  const localPlayer = players.find((p) => p.id === playerId);
  const selectedMonster = getSelectedMonster();

  return (
    <div className="w-[200px] bg-[#2d2d44] border-l border-[#3d3d5c] flex flex-col text-white text-xs">
      {/* Minimap placeholder */}
      <div className="h-[150px] bg-[#1a1a2e] border-b border-[#3d3d5c] p-1">
        <div className="w-full h-full bg-[#0d0d1a] rounded flex items-center justify-center text-[#555]">
          Minimap
        </div>
      </div>

      {/* Player Stats */}
      <div className="border-b border-[#3d3d5c] p-2">
        <div className="text-[#4ecdc4] font-bold mb-1">{playerName}</div>
        {localPlayer && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[#888]">Position:</span>
              <span>
                {Math.floor(localPlayer.x / 32)}, {Math.floor(localPlayer.y / 32)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">HP:</span>
              <span className={localPlayer.health > 50 ? 'text-[#4caf50]' : localPlayer.health > 25 ? 'text-[#ff9800]' : 'text-[#f44336]'}>
                {localPlayer.health}/{localPlayer.maxHealth}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">MP:</span>
              <span className="text-[#4a90d9]">50/50</span>
            </div>
          </div>
        )}
      </div>

      {/* Battle List */}
      <div className="flex-1 border-b border-[#3d3d5c] p-2 overflow-auto">
        <div className="text-[#ff6b6b] font-bold mb-1 flex items-center gap-1">
          <span className="w-2 h-2 bg-red-500 rounded-full" />
          Battle
        </div>
        <div className="space-y-1">
          {monsters
            .filter((m) => m.isAlive)
            .map((monster) => (
              <div
                key={monster.id}
                onClick={() => {
                  // Toggle selection - clicking same target deselects (stops attacking)
                  if (selectedTargetId === monster.id) {
                    setSelectedTarget(null);
                  } else {
                    setSelectedTarget(monster.id);
                  }
                }}
                className={`flex items-center gap-1 p-1 rounded cursor-pointer hover:bg-[#3d3d5c] ${
                  monster.id === selectedTargetId ? 'bg-[#4a3030] border border-red-500' : ''
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    monster.health / monster.maxHealth > 0.5
                      ? 'bg-green-500'
                      : monster.health / monster.maxHealth > 0.25
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                />
                <span className="flex-1 truncate">{monster.name}</span>
                <span className="text-[#888]">
                  {monster.health}/{monster.maxHealth}
                </span>
              </div>
            ))}
        </div>

        {/* Selected target info */}
        {selectedMonster && (
          <div className="mt-2 p-2 bg-[#3d3030] border border-red-500/50 rounded">
            <div className="text-red-400 font-bold">{selectedMonster.name}</div>
            <div className="mt-1">
              <div className="h-2 bg-[#1a1a1a] rounded overflow-hidden">
                <div
                  className="h-full transition-all duration-200"
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
              <div className="text-center text-[10px] text-[#888] mt-0.5">
                {selectedMonster.health} / {selectedMonster.maxHealth}
              </div>
            </div>
            <div className="text-[10px] text-green-400 mt-1">Auto-attacking...</div>
          </div>
        )}
      </div>

      {/* Players Online */}
      <div className="p-2">
        <div className="text-[#4ecdc4] font-bold mb-1">
          Players ({players.length})
        </div>
        <div className="space-y-0.5 max-h-20 overflow-auto">
          {players.map((player) => (
            <div
              key={player.id}
              className={`truncate ${player.id === playerId ? 'text-[#4ecdc4]' : 'text-[#888]'}`}
            >
              {player.name}
              {player.id === playerId && ' (you)'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
