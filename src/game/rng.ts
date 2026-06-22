// Deterministic PRNG so every rule that needs randomness can be seeded in tests.
// No rule may call Math.random() directly — they accept `rng: Rng = Math.random`.

export type Rng = () => number; // yields a float in [0, 1)

/**
 * mulberry32 — a tiny, fast, well-distributed 32-bit PRNG.
 * Same seed => same sequence, which is what makes the battle engine testable.
 */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
