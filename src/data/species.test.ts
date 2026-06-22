import { describe, it, expect } from 'vitest';
import { SPECIES, CHAINS, BASE_TO_CHAIN, DRAFT_POOL } from './species';
import { TYPES, type TypeName } from './types';
import { ABILITIES } from './abilities';

const typeSet = new Set<string>(TYPES);

describe('SPECIES data integrity', () => {
  it('every species has valid types, label and a positive stat triple', () => {
    for (const [id, s] of Object.entries(SPECIES)) {
      expect(s.name).toBe(id);
      expect(s.id).toBeGreaterThan(0);
      expect(Number.isInteger(s.id)).toBe(true);
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.types.length).toBeGreaterThanOrEqual(1);
      expect(s.types.length).toBeLessThanOrEqual(2);
      for (const t of s.types) expect(typeSet.has(t)).toBe(true);
      for (const v of [s.base.hp, s.base.atk, s.base.def, s.base.spd]) {
        expect(v).toBeGreaterThan(0);
      }
      expect(ABILITIES[s.ability]).toBeDefined();
      if (s.coverage) expect(typeSet.has(s.coverage)).toBe(true);
    }
  });
});

describe('CHAINS', () => {
  it('contains 1-, 2- and 3-stage lines, all referencing known species', () => {
    const lengths = new Set(CHAINS.map((c) => c.length));
    expect(lengths.has(1)).toBe(true);
    expect(lengths.has(2)).toBe(true);
    expect(lengths.has(3)).toBe(true);
    for (const chain of CHAINS) {
      for (const name of chain) expect(SPECIES[name]).toBeDefined();
    }
  });
});

describe('BASE_TO_CHAIN and DRAFT_POOL', () => {
  it('maps every draftable basic form to a chain that starts with it', () => {
    expect(DRAFT_POOL.length).toBe(CHAINS.length);
    for (const base of DRAFT_POOL) {
      const chain = BASE_TO_CHAIN[base];
      expect(chain).toBeDefined();
      expect(chain[0]).toBe(base);
      expect(SPECIES[base]).toBeDefined();
    }
  });

  it('only contains basic (first-stage) forms', () => {
    const bases = new Set(CHAINS.map((c) => c[0]));
    for (const base of DRAFT_POOL) expect(bases.has(base)).toBe(true);
  });
});

describe('ability assignment', () => {
  it('shares one ability across each evolution line', () => {
    for (const chain of CHAINS) {
      const abilities = new Set(chain.map((n) => SPECIES[n].ability));
      expect(abilities.size).toBe(1);
    }
  });

  it('uses a varied spread of abilities across the roster', () => {
    const seen = new Set(Object.values(SPECIES).map((s) => s.ability));
    expect(seen.size).toBeGreaterThanOrEqual(6);
  });
});

describe('type variety', () => {
  it('represents all 18 types across the roster', () => {
    const seen = new Set<TypeName>();
    for (const s of Object.values(SPECIES)) for (const t of s.types) seen.add(t);
    expect(seen.size).toBe(18);
  });
});
