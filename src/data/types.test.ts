import { describe, it, expect } from 'vitest';
import {
  TYPES,
  TYPE_LABELS_PT,
  TYPE_COLORS,
  TYPE_EMOJIS,
  effectiveness,
  typeAdvantage,
  type TypeName,
} from './types';

describe('type metadata', () => {
  it('declares all 18 canonical types', () => {
    expect(TYPES).toHaveLength(18);
    expect(new Set(TYPES).size).toBe(18);
  });

  it('has a PT label, color and emoji for every type', () => {
    for (const t of TYPES) {
      expect(TYPE_LABELS_PT[t]).toBeTruthy();
      expect(TYPE_COLORS[t]).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(TYPE_EMOJIS[t]).toBeTruthy();
    }
  });
});

describe('effectiveness', () => {
  it('returns 2x for a super effective hit', () => {
    expect(effectiveness('fire', ['grass'])).toBe(2);
  });

  it('returns 4x against a doubly weak dual type', () => {
    expect(effectiveness('fire', ['grass', 'steel'])).toBe(4);
  });

  it('returns 0.5x for a resisted hit', () => {
    expect(effectiveness('fire', ['water'])).toBe(0.5);
  });

  it('returns 0.25x against a doubly resistant dual type', () => {
    expect(effectiveness('fire', ['water', 'rock'])).toBe(0.25);
  });

  it('returns 0x for an immunity (electric vs ground)', () => {
    expect(effectiveness('electric', ['ground'])).toBe(0);
  });

  it('returns 0x for normal vs ghost', () => {
    expect(effectiveness('normal', ['ghost'])).toBe(0);
  });

  it('returns 1x for a neutral hit', () => {
    expect(effectiveness('normal', ['fire'])).toBe(1);
  });

  it('cancels to 1x when one type doubles and the other halves', () => {
    // water vs water(0.5) + ground(2) => 1
    expect(effectiveness('water', ['water', 'ground'])).toBe(1);
  });
});

describe('typeAdvantage', () => {
  it('picks the best effectiveness among the attacker types', () => {
    // water vs rock = 2, fire vs rock = 0.5 -> best is 2
    expect(typeAdvantage(['water', 'fire'], ['rock'])).toBe(2);
  });

  it('finds the doubly-super-effective option', () => {
    expect(typeAdvantage(['ice', 'normal'], ['ground', 'flying'])).toBe(4);
  });

  it('returns 0 when the only attacking type is immune', () => {
    expect(typeAdvantage(['normal'], ['ghost'])).toBe(0);
  });

  it('is typed against TypeName', () => {
    const att: TypeName[] = ['dragon'];
    const def: TypeName[] = ['fairy'];
    expect(typeAdvantage(att, def)).toBe(0);
  });
});
