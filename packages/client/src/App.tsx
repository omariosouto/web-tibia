import { useGameStore } from './stores/gameStore';
import { useSocket } from './hooks/useSocket';
import { LoginScreen } from './components/ui/LoginScreen';
import { TibiaLayout } from './components/game/TibiaLayout';

function App() {
  // Initialize socket connection
  useSocket();

  const { isInGame } = useGameStore();

  if (!isInGame) {
    return <LoginScreen />;
  }

  return <TibiaLayout />;
}

export default App;
