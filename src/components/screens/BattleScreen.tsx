import { useEffect } from 'react';
import { useGameStore, type Speed } from '../../store/gameStore';
import type { BattleChampion } from '../../game/battle';
import { TypeBadge } from '../TypeBadge';
import { AbilityBadge } from '../AbilityBadge';
import { Sprite } from '../Sprite';

const SPEEDS: Speed[] = [1, 2, 4];

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

function Combatant({ champ, back, label }: { champ: BattleChampion; back?: boolean; label: string }) {
  return (
    <div className={`combatant ${back ? 'player-side' : 'ai-side'}`}>
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
      <Sprite id={champ.id} primaryType={champ.types[0]} alt={champ.name} back={back} size={112} />
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

  useEffect(() => {
    if (!duel || over || !autoPlaying) return;
    const id = setInterval(() => tick(), 1100 / speed);
    return () => clearInterval(id);
  }, [duel, over, autoPlaying, speed, tick]);

  if (!duel) return null;

  return (
    <section className="battle">
      <div className="battlefield duel">
        <Combatant champ={duel.ai} label="Rival" />
        <Combatant champ={duel.player} label="Você" back />
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
          <strong>{duel.winner === 'player' ? 'Você venceu o duelo!' : 'Você perdeu...'}</strong>
          <button type="button" className="primary big" onClick={() => resolveBattle()}>
            Continuar
          </button>
        </div>
      )}

      <div className="battle-log" aria-live="polite">
        {duel.log.slice(-6).map((line, i) => (
          <p key={`${duel.turn}-${i}`}>{line}</p>
        ))}
      </div>
    </section>
  );
}
