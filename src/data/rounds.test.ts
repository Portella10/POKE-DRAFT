import { describe, it, expect } from 'vitest';
import { ROUNDS, FINAL_ROUND_IDX } from './rounds';
import { DRAFT_POOL } from './species';

describe('ROUNDS config', () => {
  it('defines a 5-round elimination ladder', () => {
    expect(ROUNDS).toHaveLength(5);
    ROUNDS.forEach((r, i) => expect(r.idx).toBe(i));
  });

  it('has strictly increasing battle levels', () => {
    for (let i = 1; i < ROUNDS.length; i++) {
      expect(ROUNDS[i].avgLevel).toBeGreaterThan(ROUNDS[i - 1].avgLevel);
    }
  });

  it('the grand final is a boss round built from a valid basic-form line', () => {
    const final = ROUNDS[FINAL_ROUND_IDX];
    expect(FINAL_ROUND_IDX).toBe(ROUNDS.length - 1);
    expect(final.boss).toBe(true);
    expect(DRAFT_POOL).toContain(final.bossSpecies);
  });
});
