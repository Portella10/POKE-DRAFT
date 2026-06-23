import { SPECIES } from '../data/species';
import { ROUNDS } from '../data/rounds';
import { stageForRound, championSpeciesId, championStats } from '../game/champion';
import type { Sheet } from '../game/sheet';
import { Sprite } from './Sprite';
import { TypeBadge } from './TypeBadge';
import { AbilityBadge } from './AbilityBadge';

export interface StatScale {
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
}

interface ChampionPanelProps {
  sheet: Sheet;
  roundIdx: number;
  title: string;
  back?: boolean;
  variant?: 'you' | 'rival';
  scale?: StatScale;
  /** extra effective levels (used to show a boss rival at its true strength) */
  levelBonus?: number;
}

const DEFAULT_SCALE: StatScale = { maxHp: 650, atk: 260, def: 260, speed: 260 };

function StatBar({ kind, label, value, max }: { kind: string; label: string; value: number; max: number }) {
  const pct = Math.max(4, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className="statbar">
      <span aria-hidden>{label}</span>
      <span className="track">
        <span className={`fill ${kind}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="val">{Math.round(value)}</span>
    </div>
  );
}

/** Shows a built champion (sprite at its current stage, stats, type, ability, line). */
export function ChampionPanel({ sheet, roundIdx, title, back, variant, scale, levelBonus = 0 }: ChampionPanelProps) {
  const stage = stageForRound(sheet.line!, roundIdx);
  const species = SPECIES[championSpeciesId(sheet, stage)];
  const level = ROUNDS[roundIdx].avgLevel + levelBonus;
  const st = championStats(sheet, level, stage);
  const sc = scale ?? DEFAULT_SCALE;

  return (
    <div className={`champion-panel ${variant ?? ''}`}>
      <h3>{title}</h3>
      <Sprite id={species.id} primaryType={sheet.type![0]} alt={species.label} back={back} size={104} />
      <div className="champ-name">
        {species.label} · Nv {level}
      </div>
      <div className="mon-types">
        {sheet.type!.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
        <AbilityBadge id={sheet.ability!} />
      </div>
      <div className="statbars">
        <StatBar kind="hp" label="❤️" value={st.maxHp} max={sc.maxHp} />
        <StatBar kind="atk" label="⚔️" value={st.atk} max={sc.atk} />
        <StatBar kind="def" label="🛡️" value={st.def} max={sc.def} />
        <StatBar kind="spd" label="💨" value={st.speed} max={sc.speed} />
      </div>
      <div className="champ-line">🧬 {sheet.line!.map((id) => SPECIES[id].label).join(' → ')}</div>
    </div>
  );
}
