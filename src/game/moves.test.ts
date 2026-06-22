import { describe, it, expect } from 'vitest';
import { buildMoves, MAX_MOVES } from './moves';
import { WEAK_POWER, STRONG_POWER } from '../data/moves';
import { SPECIES } from '../data/species';

describe('buildMoves', () => {
  it('uses weak STAB when not strong (base form)', () => {
    const moves = buildMoves(SPECIES.charmander, false);
    expect(moves.find((m) => m.type === 'fire')?.power).toBe(WEAK_POWER);
  });

  it('uses strong STAB when strong (evolved)', () => {
    const moves = buildMoves(SPECIES.charmander, true);
    expect(moves.find((m) => m.type === 'fire')?.power).toBe(STRONG_POWER);
  });

  it('includes a move for each STAB type of a dual-type mon', () => {
    const types = new Set(buildMoves(SPECIES.charizard, true).map((m) => m.type));
    expect(types.has('fire')).toBe(true);
    expect(types.has('flying')).toBe(true);
  });

  it('includes the coverage move when present', () => {
    expect(buildMoves(SPECIES.charizard, true).some((m) => m.type === 'dragon')).toBe(true);
  });

  it('always includes the two reliable normal moves for a single-type mon', () => {
    const moves = buildMoves(SPECIES.snorlax, true);
    expect(moves.some((m) => m.name === 'Investida')).toBe(true);
    expect(moves.some((m) => m.name === 'Golpe Focado')).toBe(true);
  });

  it('never exceeds MAX_MOVES and has no duplicate names', () => {
    for (const s of Object.values(SPECIES)) {
      const moves = buildMoves(s, true);
      expect(moves.length).toBeLessThanOrEqual(MAX_MOVES);
      expect(new Set(moves.map((m) => m.name)).size).toBe(moves.length);
    }
  });
});
