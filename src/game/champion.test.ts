import { describe, it, expect } from 'vitest';
import {
  START_LV,
  levelFactor,
  stageForRound,
  championSpeciesId,
  championStats,
  championMoves,
} from './champion';
import { takeAttribute, emptySheet, SLOTS, type Sheet } from './sheet';
import { SPECIES } from '../data/species';

function build(overrides: Record<string, string> = {}): Sheet {
  // default donors; override per slot as needed
  const donors: Record<string, string> = {
    hp: 'snorlax',
    atk: 'machop',
    def: 'geodude',
    spd: 'abra',
    type: 'gengar',
    ability: 'gastly', // drain
    line: 'charmander', // 3-stage
    ...overrides,
  };
  let s = emptySheet();
  for (const slot of SLOTS) s = takeAttribute(s, slot, donors[slot]);
  return s;
}

describe('levelFactor', () => {
  it('is 1 at START_LV', () => {
    expect(levelFactor(START_LV)).toBe(1);
  });
});

describe('stageForRound', () => {
  const three = ['charmander', 'charmeleon', 'charizard'];
  const two = ['magikarp', 'gyarados'];
  const one = ['snorlax'];

  it('3-stage: 0 at round 0, 1 at round 1, 2 at round 3', () => {
    expect(stageForRound(three, 0)).toBe(0);
    expect(stageForRound(three, 1)).toBe(1);
    expect(stageForRound(three, 3)).toBe(2);
  });
  it('2-stage: evolves once at round 2', () => {
    expect(stageForRound(two, 1)).toBe(0);
    expect(stageForRound(two, 2)).toBe(1);
  });
  it('1-stage: always 0', () => {
    expect(stageForRound(one, 9)).toBe(0);
  });
});

describe('championSpeciesId', () => {
  it('follows the chosen line through stages', () => {
    const s = build({ line: 'charmander' });
    expect(championSpeciesId(s, 0)).toBe('charmander');
    expect(championSpeciesId(s, 2)).toBe('charizard');
  });
});

describe('championStats', () => {
  it('builds positive stats from the sheet', () => {
    const st = championStats(build(), START_LV, 0);
    expect(st.maxHp).toBeGreaterThan(0);
    expect(st.atk).toBeGreaterThan(0);
  });

  it('grows with evolution stage', () => {
    const s = build();
    expect(championStats(s, START_LV, 2).atk).toBeGreaterThan(championStats(s, START_LV, 0).atk);
  });

  it('applies the swift ability speed bonus', () => {
    const swift = championStats(build({ ability: 'shinx' }), START_LV, 0); // shinx line = swift
    const plain = championStats(build({ ability: 'gastly' }), START_LV, 0); // drain (no speed mult)
    // same spd donor (abra) -> swift one is faster
    expect(swift.speed).toBeGreaterThan(plain.speed);
  });

  it('applies the lucky ability crit chance', () => {
    expect(championStats(build({ ability: 'ralts' }), START_LV, 0).critChance).toBeCloseTo(0.2);
  });
});

describe('championMoves', () => {
  it('uses STAB from the sheet type', () => {
    const s = build({ type: 'gengar' }); // ghost/poison
    const types = new Set(championMoves(s, 0).map((m) => m.type));
    expect(types.has('ghost') || types.has('poison')).toBe(true);
  });

  it('uses strong moves once evolved', () => {
    const s = build({ type: 'charizard' }); // fire/flying
    const fireMove = championMoves(s, 1).find((m) => m.type === 'fire');
    expect(fireMove?.power).toBe(85); // strong tier
  });

  it('keeps the line coverage move', () => {
    const s = build({ type: 'snorlax', line: 'charmander' }); // charizard line -> dragon coverage
    expect(championMoves(s, 2).some((m) => m.type === SPECIES.charizard.coverage)).toBe(true);
  });
});
