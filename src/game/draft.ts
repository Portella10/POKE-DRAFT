// Draft rolling (the 3 mons shown each choice round) and rival generation.
// The rival is a "pure" Pokémon: every sheet slot comes from one species.

import { DRAFT_POOL } from '../data/species';
import { ROUNDS } from '../data/rounds';
import { emptySheet, takeAttribute, SLOTS, type Sheet } from './sheet';
import type { Rng } from './rng';

function pickDistinct(
  pool: readonly string[],
  count: number,
  rng: Rng,
  exclude: Set<string>,
): string[] {
  const local = pool.filter((p) => !exclude.has(p));
  const picks: string[] = [];
  for (let k = 0; k < count && local.length > 0; k++) {
    const idx = Math.floor(rng() * local.length);
    picks.push(local.splice(idx, 1)[0]);
  }
  return picks;
}

/** Roll the basic forms shown in a choice round. */
export function rollChoices(rng: Rng = Math.random, count = 3, exclude: Iterable<string> = []): string[] {
  return pickDistinct(DRAFT_POOL, count, rng, new Set(exclude));
}

/** Build a complete sheet where every slot is taken from a single species. */
export function sheetFromSpecies(base: string): Sheet {
  let sheet = emptySheet();
  for (const slot of SLOTS) sheet = takeAttribute(sheet, slot, base);
  return sheet;
}

/** The rival champion's sheet for a round (boss rounds use a fixed line). */
export function genRivalSheet(roundIdx: number, rng: Rng = Math.random): Sheet {
  const round = ROUNDS[roundIdx];
  const base =
    round.boss && round.bossSpecies ? round.bossSpecies : pickDistinct(DRAFT_POOL, 1, rng, new Set())[0];
  return sheetFromSpecies(base);
}
