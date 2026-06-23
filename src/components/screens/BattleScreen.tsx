import { useEffect, useRef, useState } from 'react';
import { useGameStore, type Speed } from '../../store/gameStore';
import type { BattleChampion } from '../../game/battle';
import { TypeBadge } from '../TypeBadge';
import { AbilityBadge } from '../AbilityBadge';
import { Sprite } from '../Sprite';

const SPEEDS: Speed[] = [1, 2, 4];

interface Popup {
  key: string;
  side: 'player' | 'ai';
  dmg: number;
  crit: boolean;
  eff: number;
}

/** Transient per-turn visual effects, recomputed from HP deltas + the log. */
interface Fx {
  playerHit: boolean;
  aiHit: boolean;
  playerAtk: boolean;
  aiAtk: boolean;
}

const NO_FX: Fx = { playerHit: false, aiHit: false, playerAtk: false, aiAtk: false };

function HpBar({ champ }: { champ: BattleChampion }) {
  const pct = Math.max(0, Math.round((champ.hp / champ.maxHp) * 100));
  const tone = pct > 50 ? 'good' : pct > 20 ? 'warn' : 'bad';
  return (
    <div className="hpbar" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`hpbar-fill ${tone}`} style={{ width: `${pct}%` }} />
      <span className="hpbar-label">
        {champ.hp}/{champ.maxHp}
      </span>
    </div>
  );
}

function Combatant({
  champ,
  back,
  label,
  hit,
  atk,
  popups,
}: {
  champ: BattleChampion;
  back?: boolean;
  label: string;
  hit: boolean;
  atk: boolean;
  popups: Popup[];
}) {
  const side = back ? 'player-side' : 'ai-side';
  const dir = back ? 'atk-up' : 'atk-down';
  return (
    <div className={`combatant ${side}`}>
      <div className="combatant-info">
        <div className="combatant-name">
          {label}: {champ.name} · Nv {champ.level}
        </div>
        <div className="mon-types">
          {champ.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
          <AbilityBadge id={champ.ability} />
        </div>
        <HpBar champ={champ} />
      </div>
      <div className={`sprite-stage ${champ.fainted ? 'fainted' : ''}`}>
        <span className="platform" aria-hidden />
        {popups.map((p) => (
          <span
            key={p.key}
            className={`dmg-pop ${p.crit ? 'crit' : ''} ${p.eff >= 2 ? 'super' : p.eff < 1 ? 'weak' : ''}`}
          >
            -{p.dmg}
            {p.crit && <em> CRÍTICO</em>}
          </span>
        ))}
        <span className={`sprite-wrap ${hit ? 'hit' : ''} ${atk ? dir : ''}`}>
          <Sprite id={champ.id} primaryType={champ.types[0]} alt={champ.name} back={back} size={120} />
        </span>
      </div>
    </div>
  );
}

export function BattleScreen() {
  const duel = useGameStore((s) => s.duel);
  const speed = useGameStore((s) => s.speed);
  const autoPlaying = useGameStore((s) => s.autoPlaying);
  const tick = useGameStore((s) => s.tick);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const toggleAuto = useGameStore((s) => s.toggleAuto);
  const skipBattle = useGameStore((s) => s.skipBattle);
  const resolveBattle = useGameStore((s) => s.resolveBattle);

  const over = duel?.over ?? false;

  const [fx, setFx] = useState<Fx>(NO_FX);
  const [popups, setPopups] = useState<Popup[]>([]);
  const prev = useRef<{ pHp: number; aHp: number; logLen: number; turn: number } | null>(null);

  // Drive animations purely from observed state changes (no engine coupling).
  useEffect(() => {
    if (!duel) {
      prev.current = null;
      return;
    }
    const p = prev.current;
    if (p && duel.turn !== p.turn) {
      const lines = duel.log.slice(p.logLen);
      const crit = lines.some((l) => l.includes('crítico'));
      const eff = lines.some((l) => l.includes('super eficaz'))
        ? 2
        : lines.some((l) => l.includes('não foi muito'))
          ? 0.5
          : 1;
      const pDelta = p.pHp - duel.player.hp;
      const aDelta = p.aHp - duel.ai.hp;
      const fresh: Popup[] = [];
      if (pDelta > 0) fresh.push({ key: `p${duel.turn}`, side: 'player', dmg: pDelta, crit, eff });
      if (aDelta > 0) fresh.push({ key: `a${duel.turn}`, side: 'ai', dmg: aDelta, crit, eff });

      setFx({ playerHit: pDelta > 0, aiHit: aDelta > 0, playerAtk: aDelta > 0, aiAtk: pDelta > 0 });
      if (fresh.length) setPopups((cur) => [...cur, ...fresh]);

      const clearFx = setTimeout(() => setFx(NO_FX), 420);
      const clearPop = setTimeout(
        () => setPopups((cur) => cur.filter((x) => !fresh.some((f) => f.key === x.key))),
        950,
      );
      prev.current = { pHp: duel.player.hp, aHp: duel.ai.hp, logLen: duel.log.length, turn: duel.turn };
      return () => {
        clearTimeout(clearFx);
        clearTimeout(clearPop);
      };
    }
    prev.current = { pHp: duel.player.hp, aHp: duel.ai.hp, logLen: duel.log.length, turn: duel.turn };
  }, [duel]);

  useEffect(() => {
    if (!duel || over || !autoPlaying) return;
    const id = setInterval(() => tick(), 1100 / speed);
    return () => clearInterval(id);
  }, [duel, over, autoPlaying, speed, tick]);

  if (!duel) return null;

  return (
    <section className="battle">
      <div className={`battlefield duel ${over ? 'is-over' : ''}`}>
        <Combatant
          champ={duel.ai}
          label="Rival"
          hit={fx.aiHit}
          atk={fx.aiAtk}
          popups={popups.filter((p) => p.side === 'ai')}
        />
        <div className="duel-divider" aria-hidden>
          <span>VS</span>
        </div>
        <Combatant
          champ={duel.player}
          label="Você"
          back
          hit={fx.playerHit}
          atk={fx.playerAtk}
          popups={popups.filter((p) => p.side === 'player')}
        />
      </div>

      {!over ? (
        <div className="battle-controls">
          <div className="speed-group" role="group" aria-label="Velocidade">
            {SPEEDS.map((sp) => (
              <button
                key={sp}
                type="button"
                className={`mini${speed === sp ? ' on' : ''}`}
                aria-pressed={speed === sp}
                onClick={() => setSpeed(sp)}
              >
                {sp}x
              </button>
            ))}
          </div>
          <button type="button" className="secondary" onClick={() => toggleAuto()}>
            {autoPlaying ? '⏸️ Pausar' : '▶️ Continuar'}
          </button>
          <button type="button" className="secondary" onClick={() => skipBattle()}>
            ⏭️ Pular
          </button>
        </div>
      ) : (
        <div className={`battle-over ${duel.winner === 'player' ? 'win' : 'lose'}`}>
          <strong>{duel.winner === 'player' ? '🎉 Você venceu o duelo!' : '💀 Você perdeu...'}</strong>
          <button type="button" className="primary big" onClick={() => resolveBattle()}>
            Continuar
          </button>
        </div>
      )}

      <div className="battle-log" aria-live="polite">
        {duel.log.slice(-5).map((line, i) => (
          <p key={`${duel.turn}-${i}`}>{line}</p>
        ))}
      </div>
    </section>
  );
}
