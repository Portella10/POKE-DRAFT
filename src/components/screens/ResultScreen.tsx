import { useGameStore } from '../../store/gameStore';
import { ROUNDS } from '../../data/rounds';
import { ChampionPanel } from '../ChampionPanel';
import { isComplete } from '../../game/sheet';

export function ResultScreen() {
  const champion = useGameStore((s) => s.champion);
  const roundIdx = useGameStore((s) => s.roundIdx);
  const sheet = useGameStore((s) => s.sheet);
  const newGame = useGameStore((s) => s.newGame);

  return (
    <section className={`result ${champion ? 'win' : 'lose'}`}>
      {champion ? (
        <>
          <h1>🏆 CAMPEÃO!</h1>
          <p className="lead">Seu campeão montado venceu a GRANDE FINAL!</p>
        </>
      ) : (
        <>
          <h1>💀 Eliminado</h1>
          <p className="lead">
            Você caiu em <strong>{ROUNDS[roundIdx]?.name}</strong>. Monte uma ficha melhor da próxima
            vez!
          </p>
        </>
      )}

      {isComplete(sheet) && (
        <div className="result-champ">
          <ChampionPanel sheet={sheet} roundIdx={roundIdx} title="Seu Campeão" />
        </div>
      )}

      <button type="button" className="primary big" onClick={() => newGame()}>
        Jogar novamente
      </button>
    </section>
  );
}
