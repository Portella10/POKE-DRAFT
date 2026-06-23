// Championship config: a 5-round elimination ladder with rising battle levels.
// Battles are 1v1 (your built champion vs a "pure" rival Pokémon). The grand
// final is a fixed top-tier line. Pure data.

export interface RoundConfig {
  idx: number;
  name: string;
  /** level both champions fight at this round */
  avgLevel: number;
  /** how close the rival's power is scaled to yours (1 = mirror match) */
  difficulty: number;
  boss?: boolean;
  /** basic-form id whose line the boss champion is built from */
  bossSpecies?: string;
  /** extra effective levels granted to a boss rival (its "Master's aura") */
  bossLevelBonus?: number;
}

export const ROUNDS: RoundConfig[] = [
  { idx: 0, name: 'Rodada 1 — Quartas', avgLevel: 18, difficulty: 0.82 },
  { idx: 1, name: 'Rodada 2 — Oitavas', avgLevel: 24, difficulty: 0.88 },
  { idx: 2, name: 'Rodada 3 — Semifinal', avgLevel: 30, difficulty: 0.94 },
  { idx: 3, name: 'Rodada 4 — Final Regional', avgLevel: 36, difficulty: 1.0 },
  {
    idx: 4,
    name: 'GRANDE FINAL — Mestre da Liga',
    avgLevel: 42,
    difficulty: 1.08,
    boss: true,
    bossSpecies: 'dratini', // Dragonite line — fully evolved by the final
    bossLevelBonus: 18, // the Master fights above your weight class
  },
];

export const FINAL_ROUND_IDX = ROUNDS.length - 1;
