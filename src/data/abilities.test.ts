import { describe, it, expect } from 'vitest';
import { ABILITIES, ABILITY_IDS, getAbility } from './abilities';

describe('ABILITIES catalogue', () => {
  it('defines the eight abilities with label, emoji and description', () => {
    expect(ABILITY_IDS).toHaveLength(8);
    for (const id of ABILITY_IDS) {
      const a = ABILITIES[id];
      expect(a.id).toBe(id);
      expect(a.label).toBeTruthy();
      expect(a.emoji).toBeTruthy();
      expect(a.desc).toBeTruthy();
    }
  });

  it('carries the documented effect numbers', () => {
    expect(ABILITIES.swift.speedMult).toBeCloseTo(1.15);
    expect(ABILITIES.lucky.critChance).toBeCloseTo(0.2);
    expect(ABILITIES.guts.lowHpAtkMult).toBeCloseTo(1.25);
    expect(ABILITIES.shell.dmgTakenMult).toBeCloseTo(0.85);
    expect(ABILITIES.regen.healPerTurn).toBeCloseTo(0.06);
    expect(ABILITIES.drain.lifesteal).toBeCloseTo(0.25);
    expect(ABILITIES.intimidate.oppAtkMult).toBeCloseTo(0.9);
    expect(ABILITIES.focus.neverMiss).toBe(true);
  });

  it('getAbility returns the entry by id', () => {
    expect(getAbility('guts')).toBe(ABILITIES.guts);
  });
});
