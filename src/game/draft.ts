// Draft rolling (the 3 mons shown each choice round) and rival generation.
// The rival is a "pure" Pokémon: every sheet slot comes from one species.

import { DRAFT_POOL } from '../data/species';
import { ROUNDS } from '../data/rounds';
import { emptySheet, takeAttribute, SLOTS, type Sheet } from './sheet';
import { stageForRound } from './champion';
import { powerOf } from './cost';
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

/**
 * The rival champion's sheet for a round. Boss rounds use a fixed line. When a
 * `targetPower` is given (the player's own power, scaled by round difficulty),
 * the rival is the "pure" Pokémon whose champion comes closest to that power —
 * so a min-maxed player always meets a worthy opponent, never a pushover.
 */
export function genRivalSheet(roundIdx: number, rng: Rng = Math.random, targetPower?: number): Sheet {
  const round = ROUNDS[roundIdx];
  if (round.boss && round.bossSpecies) return sheetFromSpecies(round.bossSpecies);
  if (targetPower === undefined) {
    return sheetFromSpecies(pickDistinct(DRAFT_POOL, 1, rng, new Set())[0]);
  }

  const ranked = DRAFT_POOL.map((id) => {
    const sheet = sheetFromSpecies(id);
    const power = powerOf(sheet, round.avgLevel, stageForRound(sheet.line!, roundIdx));
    return { id, dist: Math.abs(power - targetPower) };
  }).sort((a, b) => a.dist - b.dist);

  // Pick among the few closest matches for variety, kept deterministic by the rng.
  const pool = ranked.slice(0, Math.min(3, ranked.length));
  return sheetFromSpecies(pool[Math.floor(rng() * pool.length)].id);
}
