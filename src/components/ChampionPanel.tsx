import { SPECIES } from '../data/species';
import { ROUNDS } from '../data/rounds';
import { stageForRound, championSpeciesId, championStats } from '../game/champion';
import type { Sheet } from '../game/sheet';
import { Sprite } from './Sprite';
import { TypeBadge } from './TypeBadge';
import { AbilityBadge } from './AbilityBadge';

interface ChampionPanelProps {
  sheet: Sheet;
  roundIdx: number;
  title: string;
  back?: boolean;
}

/** Shows a built champion (sprite at its current stage, stats, type, ability, line). */
export function ChampionPanel({ sheet, roundIdx, title, back }: ChampionPanelProps) {
  const stage = stageForRound(sheet.line!, roundIdx);
  const species = SPECIES[championSpeciesId(sheet, stage)];
  const level = ROUNDS[roundIdx].avgLevel;
  const st = championStats(sheet, level, stage);

  return (
    <div className="champion-panel">
      <h3>{title}</h3>
      <Sprite id={species.id} primaryType={sheet.type![0]} alt={species.label} back={back} size={96} />
      <div className="champ-name">
        {species.label} · Nv {level}
      </div>
      <div className="mon-types">
        {sheet.type!.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>
      <AbilityBadge id={sheet.ability!} />
      <div className="mon-stats">
        <span title="Vida">❤️ {st.maxHp}</span>
        <span title="Ataque">⚔️ {Math.round(st.atk)}</span>
        <span title="Defesa">🛡️ {Math.round(st.def)}</span>
        <span title="Velocidade">💨 {Math.round(st.speed)}</span>
      </div>
      <div className="champ-line">
        🧬 {sheet.line!.map((id) => SPECIES[id].label).join(' → ')}
      </div>
    </div>
  );
}
