import { useGameStore } from '../../store/gameStore';
import { ROUNDS } from '../../data/rounds';
import { stageForRound, championStats } from '../../game/champion';
import { typeAdvantage } from '../../data/types';
import { ChampionPanel, type StatScale } from '../ChampionPanel';

export function ArenaScreen() {
  const sheet = useGameStore((s) => s.sheet);
  const rivalSheet = useGameStore((s) => s.rivalSheet);
  const roundIdx = useGameStore((s) => s.roundIdx);
  const startRound = useGameStore((s) => s.startRound);

  const round = ROUNDS[roundIdx];
  if (!rivalSheet) return null;

  const lvl = round.avgLevel;
  const pStage = stageForRound(sheet.line!, roundIdx);
  const rStage = stageForRound(rivalSheet.line!, roundIdx);
  const ps = championStats(sheet, lvl, pStage);
  const rs = championStats(rivalSheet, lvl + (round.bossLevelBonus ?? 0), rStage);

  // Shared scale so the two stat bars are directly comparable at a glance.
  const scale: StatScale = {
    maxHp: Math.max(ps.maxHp, rs.maxHp),
    atk: Math.max(ps.atk, rs.atk),
    def: Math.max(ps.def, rs.def),
    speed: Math.max(ps.speed, rs.speed),
  };

  const myEdge = typeAdvantage(sheet.type!, rivalSheet.type!);
  const theirEdge = typeAdvantage(rivalSheet.type!, sheet.type!);
  const matchup =
    myEdge >= 2 && myEdge > theirEdge ? (
      <span className="edge good">⚡ Seus golpes são super eficazes contra o rival!</span>
    ) : theirEdge >= 2 && theirEdge > myEdge ? (
      <span className="edge bad">⚠️ Cuidado: o tipo do rival é forte contra você.</span>
    ) : (
      <span className="muted">Confronto de tipos equilibrado — vença na ficha.</span>
    );

  return (
    <section className="arena">
      <h2>{round.name}</h2>
      {round.boss && <p className="muted">⚠️ O Mestre da Liga vem totalmente evoluído e acima do seu nível. Boa sorte!</p>}

      <div className="arena-vs">
        <ChampionPanel sheet={sheet} roundIdx={roundIdx} title="Seu Campeão" variant="you" back scale={scale} />
        <div className="vs" aria-hidden>
          VS
        </div>
        <ChampionPanel
          sheet={rivalSheet}
          roundIdx={roundIdx}
          title="Rival"
          variant="rival"
          scale={scale}
          levelBonus={round.bossLevelBonus ?? 0}
        />
      </div>

      <div className="matchup">{matchup}</div>

      <button type="button" className="primary big" onClick={() => startRound()}>
        Lutar ⚔️
      </button>
    </section>
  );
}
