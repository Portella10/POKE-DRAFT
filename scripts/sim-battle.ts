// Calibration for the duel + the new Draft-Budget economy. Reports average duel
// length and, more importantly, how often a *budget-constrained* champion wins
// the whole championship against rivals scaled to its own power. The target is a
// genuine challenge (not the old 98% stomp): fun comes from drafting well.
// Run with:  npx vite-node scripts/sim-battle.ts
import { emptySheet, takeAttribute, SLOTS, isComplete, type Sheet } from '../src/game/sheet';
import { sheetFromSpecies, genRivalSheet } from '../src/game/draft';
import { buildChampion, initDuel, autoFinish } from '../src/game/battle';
import { stageForRound } from '../src/game/champion';
import { DRAFT_POOL } from '../src/data/species';
import { ROUNDS } from '../src/data/rounds';
import { mulberry32 } from '../src/game/rng';
import { slotCost, canAfford, powerOf, spentOn, DRAFT_BUDGET } from '../src/game/cost';
import type { SlotId } from '../src/game/sheet';

// A greedy budget drafter: each pick, take the highest-power affordable attribute
// offered, mimicking a thoughtful human who maximises within the budget.
function greedyDraft(rng: () => number): Sheet {
  let sheet = emptySheet();
  let budget = DRAFT_BUDGET;
  let guard = 0;
  while (!isComplete(sheet) && guard++ < 200) {
    const choices: string[] = [];
    const local = DRAFT_POOL.slice();
    for (let k = 0; k < 3 && local.length; k++) {
      choices.push(local.splice(Math.floor(rng() * local.length), 1)[0]);
    }
    let best: { slot: SlotId; id: string; gain: number } | null = null;
    for (const id of choices) {
      for (const slot of SLOTS) {
        if (sheet[slot] !== undefined) continue;
        if (!canAfford(sheet, budget, slot, id)) continue;
        const gain = slotCost(id, slot); // value ~ cost; greedily grab strongest affordable
        if (!best || gain > best.gain) best = { slot, id, gain };
      }
    }
    if (!best) continue; // nothing affordable here — reroll (free in the real game)
    sheet = takeAttribute(sheet, best.slot, best.id);
    budget -= slotCost(best.id, best.slot);
  }
  return sheet;
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

// championship sim: greedy budgeted player vs round-scaled rivals
const roundWins = ROUNDS.map(() => 0);
let titles = 0;
let totalSpent = 0;
const M = 600;
for (let i = 0; i < M; i++) {
  const rng = mulberry32(4000 + i);
  const player = greedyDraft(rng);
  totalSpent += spentOn(player);
  let alive = true;
  for (let r = 0; r < ROUNDS.length; r++) {
    const round = ROUNDS[r];
    const stage = stageForRound(player.line!, r);
    const target = powerOf(player, round.avgLevel, stage) * round.difficulty;
    const rivalSheet = genRivalSheet(r, rng, target);
    const p = buildChampion(player, round.avgLevel, stage);
    const ai = buildChampion(rivalSheet, round.avgLevel + (round.bossLevelBonus ?? 0), stageForRound(rivalSheet.line!, r));
    const f = autoFinish(initDuel(p, ai), rng);
    if (f.winner === 'player') roundWins[r]++;
    else { alive = false; break; }
  }
  if (alive) titles++;
}
console.log(`avg PD spent: ${(totalSpent / M).toFixed(0)} / ${DRAFT_BUDGET}`);
console.log('per-round win rate (of those who reached it):');
let reached = M;
for (let r = 0; r < ROUNDS.length; r++) {
  console.log(`  R${r + 1} ${ROUNDS[r].name.padEnd(30)} ${((roundWins[r] / reached) * 100).toFixed(0)}%`);
  reached = roundWins[r];
}
console.log(`championship title rate: ${((titles / M) * 100).toFixed(1)}%`);
