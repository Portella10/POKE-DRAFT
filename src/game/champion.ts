// Turns a completed sheet into concrete combat numbers. The evolution *line*
// drives the sprite and an evolution stat bonus that grows through the
// championship; the *type* and *ability* slots come straight from the sheet.

import { SPECIES, type Species } from '../data/species';
import { ABILITIES } from '../data/abilities';
import type { Move } from '../data/moves';
import { buildMoves } from './moves';
import type { Sheet } from './sheet';

export const START_LV = 14;
/** Stat multiplier at each evolution stage (rewards good evolution lines). */
export const STAGE_BONUS = [1, 1.16, 1.34];

export interface ChampionStats {
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  critChance: number;
}

export function levelFactor(level: number): number {
  return 1 + (level - START_LV) * 0.03;
}

/** Evolution stage reached by a given championship round, gated by line length. */
export function stageForRound(line: readonly string[], roundIdx: number): number {
  const max = line.length - 1;
  if (max <= 0) return 0;
  if (max === 1) return roundIdx >= 2 ? 1 : 0;
  if (roundIdx >= 3) return Math.min(2, max);
  if (roundIdx >= 1) return 1;
  return 0;
}

/** Species id (and thus sprite/label) representing the champion at a stage. */
export function championSpeciesId(sheet: Sheet, stage: number): string {
  const line = sheet.line!;
  return line[Math.min(stage, line.length - 1)];
}

export function championStats(sheet: Sheet, level: number, stage: number): ChampionStats {
  const lf = levelFactor(level);
  const sb = STAGE_BONUS[Math.min(stage, STAGE_BONUS.length - 1)];
  const ab = ABILITIES[sheet.ability!];
  const speedMult = ab.speedMult ?? 1;

  return {
    maxHp: Math.round((120 + sheet.hp! * 4.5) * lf * sb),
    atk: sheet.atk! * lf * sb,
    def: sheet.def! * lf * sb,
    speed: sheet.spd! * lf * sb * speedMult,
    critChance: ab.critChance ?? 0.06,
  };
}

/** Move-set: STAB from the sheet type + the line's coverage + reliable normals. */
export function championMoves(sheet: Sheet, stage: number): Move[] {
  const lineSpecies = SPECIES[championSpeciesId(sheet, stage)];
  const synthetic: Species = { ...lineSpecies, types: sheet.type!, coverage: lineSpecies.coverage };
  const strong = stage > 0 || sheet.line!.length === 1;
  return buildMoves(synthetic, strong);
}
