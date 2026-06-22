// Move-set builder: STAB (+ optional coverage) at the right power tier, always
// backed by the two universal normal moves, capped at 4 unique moves.
// `strong` is driven by evolution stage in battle (evolved/single-stage = strong).

import type { Species } from '../data/species';
import { type Move, moveForType, INVESTIDA, GOLPE_FOCADO } from '../data/moves';

export const MAX_MOVES = 4;

export function buildMoves(species: Species, strong: boolean): Move[] {
  const candidates: Move[] = [];

  for (const t of species.types) candidates.push(moveForType(t, strong));
  if (species.coverage) candidates.push(moveForType(species.coverage, strong));
  candidates.push(GOLPE_FOCADO); // 70 power, reliable
  candidates.push(INVESTIDA); // 40 power, reliable

  const seen = new Set<string>();
  const moves: Move[] = [];
  for (const m of candidates) {
    if (seen.has(m.name)) continue;
    seen.add(m.name);
    moves.push(m);
    if (moves.length === MAX_MOVES) break;
  }
  return moves;
}
