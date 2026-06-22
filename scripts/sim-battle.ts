// Calibration for the 1v1 duel. Reports average duel length, plus a sanity check
// that a well-built Frankenstein champion beats random "pure" rivals.
// Run with:  npx vite-node scripts/sim-battle.ts
import { emptySheet, takeAttribute, SLOTS } from '../src/game/sheet';
import { sheetFromSpecies } from '../src/game/draft';
import { buildChampion, initDuel, autoFinish } from '../src/game/battle';
import { stageForRound } from '../src/game/champion';
import { DRAFT_POOL } from '../src/data/species';
import { ROUNDS } from '../src/data/rounds';
import { mulberry32 } from '../src/game/rng';

// A hand min-maxed champion: high atk/def/hp donors, strong type, good ability, good line.
function goodSheet() {
  let s = emptySheet();
  const donors: Record<string, string> = {
    hp: 'snorlax',
    atk: 'machop', // machamp line atk
    def: 'geodude', // golem line def
    spd: 'abra', // alakazam speed
    type: 'gengar', // ghost/poison
    ability: 'gastly', // drain
    line: 'dratini', // dragonite line (great evolution)
  };
  for (const slot of SLOTS) s = takeAttribute(s, slot, donors[slot]);
  return s;
}

// turn-length calibration: two pure rivals
let total = 0;
let min = Infinity;
let max = 0;
const N = 400;
for (let i = 0; i < N; i++) {
  const round = 2;
  const lvl = ROUNDS[round].avgLevel;
  const a = buildChampion(sheetFromSpecies('charmander'), lvl, stageForRound(['charmander', 'charmeleon', 'charizard'], round));
  const b = buildChampion(sheetFromSpecies('squirtle'), lvl, stageForRound(['squirtle', 'wartortle', 'blastoise'], round));
  const f = autoFinish(initDuel(a, b), mulberry32(700 + i));
  total += f.turn;
  min = Math.min(min, f.turn);
  max = Math.max(max, f.turn);
}
console.log(`avg duel turns: ${(total / N).toFixed(1)}  (min ${min}, max ${max})`);

// design check: good Frankenstein vs random pure rivals, across all rounds
let wins = 0;
const M = 500;
for (let i = 0; i < M; i++) {
  const rng = mulberry32(9000 + i);
  const round = Math.floor(rng() * ROUNDS.length);
  const lvl = ROUNDS[round].avgLevel;
  const gs = goodSheet();
  const player = buildChampion(gs, lvl, stageForRound(gs.line!, round));
  const rivalBase = DRAFT_POOL[Math.floor(rng() * DRAFT_POOL.length)];
  const rs = sheetFromSpecies(rivalBase);
  const rival = buildChampion(rs, lvl, stageForRound(rs.line!, round));
  const f = autoFinish(initDuel(player, rival), rng);
  if (f.winner === 'player') wins++;
}
console.log(`good champion winrate vs random rivals: ${((wins / M) * 100).toFixed(0)}%`);
