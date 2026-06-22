import { describe, it, expect } from 'vitest';
import {
  buildChampion,
  calcDamage,
  resolveAttack,
  aiChoose,
  initDuel,
  autoTurn,
  autoFinish,
  type BattleChampion,
} from './battle';
import { sheetFromSpecies } from './draft';
import { mulberry32 } from './rng';
import type { Move } from '../data/moves';

function seq(...vals: number[]): () => number {
  let i = 0;
  return () => vals[Math.min(i++, vals.length - 1)];
}

function champ(over: Partial<BattleChampion> = {}): BattleChampion {
  return {
    name: 'Test',
    id: 1,
    types: ['normal'],
    level: 18,
    stage: 0,
    ability: 'swift', // neutral for damage calc
    maxHp: 300,
    hp: 300,
    atk: 100,
    def: 100,
    speed: 100,
    critChance: 0.06,
    moves: [{ name: 'M', type: 'normal', power: 60, accuracy: 1 }],
    fainted: false,
    ...over,
  };
}

const move = (over: Partial<Move>): Move => ({ name: 'M', type: 'normal', power: 60, accuracy: 1, ...over });

describe('buildChampion', () => {
  it('builds a champion from a sheet at full HP with moves', () => {
    const c = buildChampion(sheetFromSpecies('charmander'), 18, 0);
    expect(c.hp).toBe(c.maxHp);
    expect(c.hp).toBeGreaterThan(0);
    expect(c.moves.length).toBeGreaterThan(0);
    expect(c.name).toBe('Charmander');
  });

  it('represents the evolved sprite/label at a later stage', () => {
    expect(buildChampion(sheetFromSpecies('charmander'), 30, 2).name).toBe('Charizard');
  });
});

describe('calcDamage', () => {
  it('is 0 against an immune defender', () => {
    expect(calcDamage(champ({ types: ['normal'] }), champ({ types: ['ghost'] }), move({}), seq(0)).dmg).toBe(0);
  });
  it('applies STAB ~1.5x', () => {
    const def = champ({ types: ['normal'] });
    const withStab = calcDamage(champ({ types: ['normal'], atk: 160 }), def, move({ power: 120 }), seq(0.99, 0));
    const noStab = calcDamage(champ({ types: ['fire'], atk: 160 }), def, move({ power: 120 }), seq(0.99, 0));
    const ratio = withStab.dmg / noStab.dmg;
    expect(ratio).toBeGreaterThan(1.4);
    expect(ratio).toBeLessThan(1.6);
  });
  it('crits multiply by ~1.6', () => {
    const att = champ({ critChance: 0.5 });
    const crit = calcDamage(att, champ({}), move({}), seq(0, 0));
    const normal = calcDamage(att, champ({}), move({}), seq(0.99, 0));
    expect(crit.dmg / normal.dmg).toBeCloseTo(1.6, 1);
  });
  it('shell ability reduces incoming damage', () => {
    const shelled = calcDamage(champ({}), champ({ ability: 'shell' }), move({}), seq(0.99, 0));
    const plain = calcDamage(champ({}), champ({ ability: 'swift' }), move({}), seq(0.99, 0));
    expect(shelled.dmg).toBeLessThan(plain.dmg);
  });
  it('guts ability boosts attack while below 1/3 HP', () => {
    const low = calcDamage(champ({ ability: 'guts', hp: 50, maxHp: 300 }), champ({}), move({}), seq(0.99, 0));
    const high = calcDamage(champ({ ability: 'guts', hp: 300, maxHp: 300 }), champ({}), move({}), seq(0.99, 0));
    expect(low.dmg).toBeGreaterThan(high.dmg);
  });
  it('is deterministic for the same seed', () => {
    expect(calcDamage(champ({}), champ({}), move({}), mulberry32(5))).toEqual(
      calcDamage(champ({}), champ({}), move({}), mulberry32(5)),
    );
  });
});

describe('resolveAttack', () => {
  it('misses when the accuracy roll fails', () => {
    expect(resolveAttack(champ({}), champ({}), move({ accuracy: 0.5 }), seq(0.99)).hit).toBe(false);
  });
  it('focus ability never misses', () => {
    expect(resolveAttack(champ({ ability: 'focus' }), champ({}), move({ accuracy: 0.5 }), seq(0.99, 0.99, 0)).hit).toBe(
      true,
    );
  });
});

describe('aiChoose', () => {
  const moves: Move[] = [move({ name: 'weak', type: 'normal', power: 40 }), move({ name: 'super', type: 'water', power: 85 })];
  it('picks the strongest move', () => {
    expect(aiChoose(champ({ types: ['water'], moves }), champ({ types: ['fire'] }), seq(0.99))).toBe(1);
  });
  it('occasionally picks the 2nd best', () => {
    expect(aiChoose(champ({ types: ['water'], moves }), champ({ types: ['fire'] }), seq(0.1))).toBe(0);
  });
});

describe('initDuel', () => {
  it('intimidate lowers the opponent ATK at the start', () => {
    const ai = champ({ name: 'Rival', atk: 100 });
    initDuel(champ({ ability: 'intimidate' }), ai);
    expect(ai.atk).toBeCloseTo(90);
  });
});

describe('autoTurn', () => {
  const setup = () =>
    initDuel(buildChampion(sheetFromSpecies('machop'), 24, 1), buildChampion(sheetFromSpecies('geodude'), 24, 1));

  it('returns a new immutable state and advances the turn', () => {
    const s = setup();
    const before = structuredClone(s);
    const next = autoTurn(s, mulberry32(1));
    expect(s).toEqual(before);
    expect(next.turn).toBe(1);
  });

  it('regen ability heals a damaged champion over the turn', () => {
    const player = champ({ name: 'Regenerador', ability: 'regen', hp: 100, maxHp: 300, def: 999, types: ['ghost'] });
    const ai = champ({ name: 'Inofensivo', atk: 1, types: ['normal'], moves: [move({ type: 'normal' })] });
    // ai is normal -> immune-ish damage tiny; regen should net-heal the player
    const next = autoTurn(initDuel(player, ai), mulberry32(2));
    expect(next.log.some((l) => l.includes('regenerou'))).toBe(true);
  });

  it('drain ability heals the attacker when it lands a KO', () => {
    const player = champ({ name: 'Vampiro', ability: 'drain', hp: 80, maxHp: 300, speed: 300, atk: 200 });
    const ai = champ({ name: 'Fraco', hp: 5, maxHp: 300, speed: 1 });
    const next = autoTurn(initDuel(player, ai), mulberry32(3));
    expect(next.over).toBe(true);
    expect(next.winner).toBe('player');
    expect(next.player.hp).toBeGreaterThan(80); // healed via lifesteal
  });

  it('plays a duel to completion with a winner', () => {
    const final = autoFinish(setup(), mulberry32(123));
    expect(final.over).toBe(true);
    expect(final.winner === 'player' || final.winner === 'ai').toBe(true);
    const loser = final.winner === 'player' ? final.ai : final.player;
    expect(loser.fainted).toBe(true);
  });

  it('is deterministic: same seed => identical log', () => {
    const run = () => autoFinish(setup(), mulberry32(77)).log;
    expect(run()).toEqual(run());
  });
});

describe('calibration', () => {
  it('a 1v1 duel lasts a reasonable number of turns', () => {
    let total = 0;
    const N = 60;
    for (let i = 0; i < N; i++) {
      const final = autoFinish(
        initDuel(buildChampion(sheetFromSpecies('charmander'), 24, 1), buildChampion(sheetFromSpecies('squirtle'), 24, 1)),
        mulberry32(500 + i),
      );
      total += final.turn;
    }
    const avg = total / N;
    expect(avg).toBeGreaterThan(3);
    expect(avg).toBeLessThan(30);
  });
});
