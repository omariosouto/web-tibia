import { useGameStore } from './stores/gameStore';
import { useSocket } from './hooks/useSocket';
import { LoginScreen } from './components/ui/LoginScreen';
import { GameCanvas } from './components/game/GameCanvas';
import { GameHUD } from './components/game/GameHUD';

function App() {
  // Initialize socket connection
  useSocket();

  const { isInGame } = useGameStore();

  if (!isInGame) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="relative">
        <GameCanvas />
        <GameHUD />
      </div>
    </div>
  );
}

export default App;
