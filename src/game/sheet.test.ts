import { describe, it, expect } from 'vitest';
import {
  emptySheet,
  emptySlots,
  isComplete,
  isSlotFilled,
  takeAttribute,
  slotOffer,
  SLOTS,
} from './sheet';
import { SPECIES, BASE_TO_CHAIN } from '../data/species';

describe('empty sheet', () => {
  it('starts with all 7 slots empty', () => {
    const s = emptySheet();
    expect(emptySlots(s)).toEqual(SLOTS);
    expect(isComplete(s)).toBe(false);
  });
});

describe('slotOffer', () => {
  it('returns the species base stat for numeric slots', () => {
    expect(slotOffer('charmander', 'atk')).toBe(SPECIES.charmander.base.atk);
    expect(slotOffer('charmander', 'hp')).toBe(SPECIES.charmander.base.hp);
  });
  it('returns the type array, ability and evolution line', () => {
    expect(slotOffer('charizard', 'type')).toEqual(SPECIES.charizard.types);
    expect(slotOffer('charmander', 'ability')).toBe(SPECIES.charmander.ability);
    expect(slotOffer('magikarp', 'line')).toEqual(BASE_TO_CHAIN.magikarp);
  });
});

describe('takeAttribute', () => {
  it('fills a slot from a species and records the source', () => {
    const s = takeAttribute(emptySheet(), 'atk', 'machop');
    expect(s.atk).toBe(SPECIES.machop.base.atk);
    expect(s.sources.atk).toBe('machop');
    expect(isSlotFilled(s, 'atk')).toBe(true);
  });

  it('lets you Frankenstein attributes from different mons', () => {
    let s = emptySheet();
    s = takeAttribute(s, 'atk', 'machop'); // strong attacker
    s = takeAttribute(s, 'line', 'magikarp'); // weak stats, great evolution
    s = takeAttribute(s, 'type', 'gengar');
    expect(s.atk).toBe(SPECIES.machop.base.atk);
    expect(s.line).toEqual(BASE_TO_CHAIN.magikarp);
    expect(s.type).toEqual(SPECIES.gengar.types);
  });

  it('does not overwrite an already-filled slot', () => {
    let s = takeAttribute(emptySheet(), 'atk', 'machop');
    s = takeAttribute(s, 'atk', 'abra');
    expect(s.atk).toBe(SPECIES.machop.base.atk);
  });

  it('is complete once all 7 slots are filled', () => {
    let s = emptySheet();
    const src = ['snorlax', 'machop', 'geodude', 'abra', 'gengar', 'gastly', 'charmander'];
    SLOTS.forEach((slot, i) => {
      s = takeAttribute(s, slot, src[i]);
    });
    expect(isComplete(s)).toBe(true);
  });
});
