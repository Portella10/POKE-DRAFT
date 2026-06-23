// The strategic heart of the draft: every attribute has a *weight*, expressed as
// a cost in "Pontos de Draft" (PD). You draft against a fixed budget, so a huge
// HP donor leaves little room for Attack — each slot becomes a real trade-off.
//
// Pure + deterministic: costs depend only on static species/type/ability data, so
// they are trivially testable and identical in UI, store and balancing sims.

import { SPECIES } from '../data/species';
import { BASE_TO_CHAIN } from '../data/species';
import { TYPES, effectiveness, type TypeName } from '../data/types';
import { type AbilityId } from '../data/abilities';
import { SLOTS, slotOffer, type SlotId, type Sheet } from './sheet';
import { DRAFT_POOL } from '../data/species';
import { championStats } from './champion';

/** Total Draft Points a player may spend across the seven picks. */
export const DRAFT_BUDGET = 135;

/** Per-stat weight: a floor (cheap below it) and a price per point above it. */
const STAT_WEIGHT: Record<'hp' | 'atk' | 'def' | 'spd', { floor: number; per: number }> = {
  hp: { floor: 20, per: 0.3 }, // lots of points, but each one is worth ~4.5 effective HP
  atk: { floor: 10, per: 0.35 }, // attack dominates the damage formula
  def: { floor: 15, per: 0.3 },
  spd: { floor: 10, per: 0.28 }, // turn order + Ímpeto, but less swingy than ATK
};

/** Each ability's battle value as a flat PD tier. */
const ABILITY_COST: Record<AbilityId, number> = {
  focus: 14, // never miss — pure consistency
  drain: 13, // sustain + damage
  lucky: 12, // crit chance
  shell: 12, // flat damage reduction
  swift: 9,
  intimidate: 9,
  regen: 8,
  guts: 7,
};

function clampInt(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

/** Defensive bulk of a (possibly dual) type: positive = resists more than it fears. */
export function typeDefScore(types: readonly TypeName[]): number {
  return TYPES.reduce((acc, atk) => acc + (1 - effectiveness(atk, types as TypeName[])), 0);
}

/** Offensive reach: most super-effective matchups any single STAB type can land. */
export function typeOffScore(types: readonly TypeName[]): number {
  return types.reduce((best, t) => {
    const hits = TYPES.filter((d) => effectiveness(t, [d]) > 1).length;
    return Math.max(best, hits);
  }, 0);
}

/** PD cost of a type slot, blending offensive coverage and defensive bulk. */
export function typeCost(types: readonly TypeName[]): number {
  return clampInt(typeOffScore(types) * 1.0 + typeDefScore(types) * 1.3 + 8, 4, 28);
}

/** PD cost of an evolution line: rewards long lines and a strong final form. */
export function lineCost(line: readonly string[]): number {
  const final = SPECIES[line[line.length - 1]];
  const bst = final.base.hp + final.base.atk + final.base.def + final.base.spd;
  const evolves = line.length - 1;
  return clampInt((bst - 200) * 0.06 + evolves * 9 + 1, 3, 34);
}

/** PD cost of taking a given slot from a given basic-form species. */
export function slotCost(speciesId: string, slot: SlotId): number {
  switch (slot) {
    case 'hp':
    case 'atk':
    case 'def':
    case 'spd': {
      const w = STAT_WEIGHT[slot];
      return Math.max(1, Math.round((SPECIES[speciesId].base[slot] - w.floor) * w.per));
    }
    case 'type':
      return typeCost(SPECIES[speciesId].types);
    case 'ability':
      return ABILITY_COST[SPECIES[speciesId].ability];
    case 'line':
      return lineCost(BASE_TO_CHAIN[speciesId]);
  }
}

/** Cheapest available cost for each slot across the whole pool (for feasibility). */
export const MIN_SLOT_COST: Record<SlotId, number> = (() => {
  const out = {} as Record<SlotId, number>;
  for (const slot of SLOTS) {
    out[slot] = Math.min(...DRAFT_POOL.map((id) => slotCost(id, slot)));
  }
  return out;
})();

/** Sum of the cheapest possible costs for the slots a sheet still needs to fill. */
export function minToComplete(sheet: Sheet, excluding: SlotId): number {
  return SLOTS.reduce((acc, slot) => {
    if (slot === excluding || sheet[slot] !== undefined) return acc;
    return acc + MIN_SLOT_COST[slot];
  }, 0);
}

/**
 * Whether a pick is allowed: it must fit the remaining budget *and* still leave
 * enough to fill every other empty slot at minimum cost — so you can never spend
 * yourself into a dead end.
 */
export function canAfford(sheet: Sheet, remaining: number, slot: SlotId, speciesId: string): boolean {
  if (sheet[slot] !== undefined) return false;
  const cost = slotCost(speciesId, slot);
  return cost + minToComplete(sheet, slot) <= remaining;
}

/**
 * A single scalar describing how dangerous a built champion is, weighting each
 * stat by its real battle impact. Used to scale rivals to the player's strength.
 */
export function powerOf(sheet: Sheet, level: number, stage: number): number {
  const s = championStats(sheet, level, stage);
  return s.maxHp * 0.5 + s.atk * 1.4 + s.def * 0.8 + s.speed * 0.6 + s.critChance * 120;
}

/** Total PD currently committed on a sheet (sum of each filled slot's cost). */
export function spentOn(sheet: Sheet): number {
  return SLOTS.reduce((acc, slot) => {
    const src = sheet.sources[slot];
    return src !== undefined ? acc + slotCost(src, slot) : acc;
  }, 0);
}

// Re-export to keep callers importing slotOffer alongside cost from one place.
export { slotOffer };
