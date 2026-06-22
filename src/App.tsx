import { useGameStore } from './store/gameStore';
import { Topbar } from './components/Topbar';
import { StartScreen } from './components/screens/StartScreen';
import { DraftScreen } from './components/screens/DraftScreen';
import { ArenaScreen } from './components/screens/ArenaScreen';
import { BattleScreen } from './components/screens/BattleScreen';
import { ResultScreen } from './components/screens/ResultScreen';

export default function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className="app">
      <Topbar />
      <main className="screen">
        {screen === 'start' && <StartScreen />}
        {screen === 'draft' && <DraftScreen />}
        {screen === 'arena' && <ArenaScreen />}
        {screen === 'battle' && <BattleScreen />}
        {screen === 'result' && <ResultScreen />}
      </main>
    </div>
  );
}
