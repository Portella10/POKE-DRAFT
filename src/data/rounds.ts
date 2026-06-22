// Championship config: a 5-round elimination ladder with rising battle levels.
// Battles are 1v1 (your built champion vs a "pure" rival Pokémon). The grand
// final is a fixed top-tier line. Pure data.

export interface RoundConfig {
  idx: number;
  name: string;
  /** level both champions fight at this round */
  avgLevel: number;
  boss?: boolean;
  /** basic-form id whose line the boss champion is built from */
  bossSpecies?: string;
}

export const ROUNDS: RoundConfig[] = [
  { idx: 0, name: 'Rodada 1 — Quartas', avgLevel: 18 },
  { idx: 1, name: 'Rodada 2 — Oitavas', avgLevel: 24 },
  { idx: 2, name: 'Rodada 3 — Semifinal', avgLevel: 30 },
  { idx: 3, name: 'Rodada 4 — Final Regional', avgLevel: 36 },
  {
    idx: 4,
    name: 'GRANDE FINAL — Mestre da Liga',
    avgLevel: 42,
    boss: true,
    bossSpecies: 'dratini', // Dragonite line — fully evolved by the final
  },
];

export const FINAL_ROUND_IDX = ROUNDS.length - 1;
