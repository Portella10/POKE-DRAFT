import { useGameStore } from '../../store/gameStore';
import { ROUNDS } from '../../data/rounds';
import { ChampionPanel } from '../ChampionPanel';
import { isComplete } from '../../game/sheet';

const CONFETTI_COLORS = ['#ffcb05', '#4d7cff', '#b06bff', '#46d17a', '#ff5470'];

function Confetti() {
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 60 }).map((_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 1.7) % 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDuration: `${2.4 + ((i * 7) % 20) / 10}s`,
            animationDelay: `${((i * 13) % 20) / 10}s`,
          }}
        />
      ))}
    </div>
  );
}

export function ResultScreen() {
  const champion = useGameStore((s) => s.champion);
  const roundIdx = useGameStore((s) => s.roundIdx);
  const sheet = useGameStore((s) => s.sheet);
  const newGame = useGameStore((s) => s.newGame);

  return (
    <section className={`result ${champion ? 'win' : 'lose'}`}>
      {champion && <Confetti />}
      {champion ? (
        <>
          <h1>🏆 CAMPEÃO!</h1>
          <p className="lead">Seu campeão Frankenstein venceu a GRANDE FINAL contra o Mestre da Liga!</p>
        </>
      ) : (
        <>
          <h1>💀 Eliminado</h1>
          <p className="lead">
            Você caiu em <strong>{ROUNDS[roundIdx]?.name}</strong>. Monte uma ficha melhor da próxima
            vez — talvez gastar os PD de outro jeito?
          </p>
        </>
      )}

      {isComplete(sheet) && (
        <div className="result-champ">
          <ChampionPanel sheet={sheet} roundIdx={roundIdx} title="Seu Campeão" variant="you" />
        </div>
      )}

      <button type="button" className="primary big" onClick={() => newGame()}>
        Jogar novamente
      </button>
    </section>
  );
}
