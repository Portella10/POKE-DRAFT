import { describe, it, expect } from 'vitest';
import { mulberry32, type Rng } from './rng';

describe('mulberry32', () => {
  it('returns an Rng function', () => {
    const rng: Rng = mulberry32(1);
    expect(typeof rng).toBe('function');
  });

  it('produces values in [0, 1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    expect([a(), a(), a(), a(), a()]).toEqual([b(), b(), b(), b(), b()]);
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  it('advances state on each call', () => {
    const rng = mulberry32(7);
    expect(rng()).not.toBe(rng());
  });
});
