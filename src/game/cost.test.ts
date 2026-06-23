import { describe, it, expect } from 'vitest';
import {
  slotCost,
  typeCost,
  lineCost,
  canAfford,
  minToComplete,
  MIN_SLOT_COST,
  DRAFT_BUDGET,
  powerOf,
  spentOn,
} from './cost';
import { emptySheet, takeAttribute, SLOTS } from './sheet';
import { sheetFromSpecies } from './draft';
import { DRAFT_POOL } from '../data/species';

describe('slotCost', () => {
  it('charges more for a stronger stat donor', () => {
    expect(slotCost('snorlax', 'hp')).toBeGreaterThan(slotCost('ralts', 'hp'));
    expect(slotCost('absol', 'atk')).toBeGreaterThan(slotCost('magikarp', 'atk'));
    expect(slotCost('skarmory', 'def')).toBeGreaterThan(slotCost('abra', 'def'));
  });

  it('never charges less than 1 PD for a numeric slot', () => {
    for (const id of DRAFT_POOL) {
      for (const slot of ['hp', 'atk', 'def', 'spd'] as const) {
        expect(slotCost(id, slot)).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe('typeCost', () => {
  it('stays within the design band for every pool type', () => {
    for (const id of DRAFT_POOL) {
      const c = typeCost(slotCostType(id));
      expect(c).toBeGreaterThanOrEqual(4);
      expect(c).toBeLessThanOrEqual(28);
    }
  });
});

function slotCostType(id: string) {
  // helper kept local: pull the species' types via the public sheet path
  return sheetFromSpecies(id).type!;
}

describe('lineCost', () => {
  it('values a long, strong line above a single-stage one', () => {
    expect(lineCost(['dratini', 'dragonair', 'dragonite'])).toBeGreaterThan(lineCost(['snorlax']));
  });

  it('rewards a weak base with a great evolution (Magikarp → Gyarados)', () => {
    // The Magikarp line should out-value most single-stage mons despite weak base stats.
    expect(lineCost(['magikarp', 'gyarados'])).toBeGreaterThan(lineCost(['tauros']));
  });
});

describe('budget feasibility', () => {
  it('the budget is far below the cost of maxing every slot', () => {
    const greedy = SLOTS.reduce(
      (sum, slot) => sum + Math.max(...DRAFT_POOL.map((id) => slotCost(id, slot))),
      0,
    );
    expect(DRAFT_BUDGET).toBeLessThan(greedy);
  });

  it('the full budget always covers a minimum complete sheet', () => {
    const floor = SLOTS.reduce((sum, slot) => sum + MIN_SLOT_COST[slot], 0);
    expect(DRAFT_BUDGET).toBeGreaterThan(floor);
  });

  it('minToComplete shrinks as slots get filled', () => {
    const empty = emptySheet();
    const partial = takeAttribute(empty, 'hp', 'snorlax');
    expect(minToComplete(partial, 'atk')).toBeLessThan(minToComplete(empty, 'atk'));
  });
});

describe('canAfford', () => {
  it('allows any single pick on a full budget', () => {
    expect(canAfford(emptySheet(), DRAFT_BUDGET, 'hp', 'snorlax')).toBe(true);
  });

  it('blocks a pick that would strand the remaining slots', () => {
    // 5 PD cannot afford an expensive donor and still fill six more slots.
    expect(canAfford(emptySheet(), 5, 'atk', 'absol')).toBe(false);
  });

  it('refuses to fill an already-filled slot', () => {
    const s = takeAttribute(emptySheet(), 'hp', 'snorlax');
    expect(canAfford(s, DRAFT_BUDGET, 'hp', 'ralts')).toBe(false);
  });
});

describe('powerOf', () => {
  it('grows when a champion evolves to a higher stage', () => {
    const s = sheetFromSpecies('dratini');
    expect(powerOf(s, 30, 2)).toBeGreaterThan(powerOf(s, 30, 0));
  });
});

describe('spentOn', () => {
  it('sums the cost of every filled slot', () => {
    const s = sheetFromSpecies('machop');
    const expected = SLOTS.reduce((sum, slot) => sum + slotCost('machop', slot), 0);
    expect(spentOn(s)).toBe(expected);
  });
});
