import { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../stores/gameStore';

export function LoginScreen() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { joinGame } = useSocket();
  const { isConnected, setPlayerName } = useGameStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (name.length < 3) {
      setError('Name must be at least 3 characters');
      return;
    }

    if (name.length > 20) {
      setError('Name must be at most 20 characters');
      return;
    }

    setPlayerName(name);
    joinGame(name);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-96">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Web Tibia
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Enter your name to join the game
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="playerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your character name"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              autoComplete="off"
            />
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={!isConnected}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
          >
            {isConnected ? 'Enter Game' : 'Connecting...'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <span
            className={`inline-block w-2 h-2 rounded-full mr-2 ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-gray-400 text-sm">
            {isConnected ? 'Connected to server' : 'Connecting...'}
          </span>
        </div>

        <div className="mt-6 text-gray-500 text-sm text-center">
          <p>Use arrow keys or WASD to move</p>
        </div>
      </div>
    </div>
  );
}
