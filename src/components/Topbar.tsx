import { useGameStore } from '../store/gameStore';
import { ROUNDS } from '../data/rounds';

export function Topbar() {
  const screen = useGameStore((s) => s.screen);
  const roundIdx = useGameStore((s) => s.roundIdx);
  const newGame = useGameStore((s) => s.newGame);

  const inGame = screen !== 'start';

  return (
    <header className="topbar">
      <div className="brand">
        <span aria-hidden>🏆</span> Poké Draft Cup
      </div>
      {inGame && (
        <div className="topbar-stats">
          <span className="chip" title="Rodada atual">
            {ROUNDS[roundIdx]?.name ?? 'Campeão'}
          </span>
        </div>
      )}
      <div className="topbar-actions">
        <button
          type="button"
          className="ghost"
          onClick={() => {
            if (confirm('Começar um novo jogo? O progresso atual será perdido.')) newGame();
          }}
        >
          Novo jogo
        </button>
      </div>
    </header>
  );
}
