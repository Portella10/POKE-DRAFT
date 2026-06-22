import { useGameStore } from '../../store/gameStore';
import { ROUNDS } from '../../data/rounds';
import { ChampionPanel } from '../ChampionPanel';

export function ArenaScreen() {
  const sheet = useGameStore((s) => s.sheet);
  const rivalSheet = useGameStore((s) => s.rivalSheet);
  const roundIdx = useGameStore((s) => s.roundIdx);
  const startRound = useGameStore((s) => s.startRound);

  const round = ROUNDS[roundIdx];
  if (!rivalSheet) return null;

  return (
    <section className="arena">
      <h2>{round.name}</h2>
      {round.boss && (
        <p className="muted">⚠️ O Mestre da Liga vem totalmente evoluído. Boa sorte!</p>
      )}

      <div className="arena-vs">
        <ChampionPanel sheet={sheet} roundIdx={roundIdx} title="Seu Campeão" back />
        <div className="vs" aria-hidden>
          VS
        </div>
        <ChampionPanel sheet={rivalSheet} roundIdx={roundIdx} title="Rival" />
      </div>

      <button type="button" className="primary big" onClick={() => startRound()}>
        Lutar ⚔️
      </button>
    </section>
  );
}
