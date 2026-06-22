import { describe, it, expect } from 'vitest';
import { rollChoices, sheetFromSpecies, genRivalSheet } from './draft';
import { isComplete } from './sheet';
import { DRAFT_POOL, SPECIES } from '../data/species';
import { ROUNDS, FINAL_ROUND_IDX } from '../data/rounds';
import { mulberry32 } from './rng';

const pool = new Set(DRAFT_POOL);

describe('rollChoices', () => {
  it('returns 3 distinct draftable basic forms by default', () => {
    const opts = rollChoices(mulberry32(1));
    expect(opts).toHaveLength(3);
    expect(new Set(opts).size).toBe(3);
    for (const o of opts) expect(pool.has(o)).toBe(true);
  });

  it('is deterministic for the same seed', () => {
    expect(rollChoices(mulberry32(9))).toEqual(rollChoices(mulberry32(9)));
  });
});

describe('sheetFromSpecies', () => {
  it('builds a complete sheet from one species', () => {
    const s = sheetFromSpecies('charmander');
    expect(isComplete(s)).toBe(true);
    expect(s.atk).toBe(SPECIES.charmander.base.atk);
    expect(s.ability).toBe(SPECIES.charmander.ability);
  });
});

describe('genRivalSheet', () => {
  it('produces a complete rival sheet', () => {
    expect(isComplete(genRivalSheet(0, mulberry32(7)))).toBe(true);
  });

  it('uses the fixed boss line for the grand final', () => {
    const s = genRivalSheet(FINAL_ROUND_IDX, mulberry32(1));
    expect(s.line![0]).toBe(ROUNDS[FINAL_ROUND_IDX].bossSpecies);
  });

  it('is deterministic for the same seed', () => {
    expect(genRivalSheet(2, mulberry32(11)).line).toEqual(genRivalSheet(2, mulberry32(11)).line);
  });
});
