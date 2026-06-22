// Central game store: screen routing, the attribute-draft sheet, championship
// progression and the live 1v1 duel. Persisted to localStorage.
//
// Determinism: a single integer `seed` drives every random action via mulberry32
// and is advanced after each use, so a persisted game resumes reproducibly.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mulberry32 } from '../game/rng';
import {
  emptySheet,
  takeAttribute,
  isComplete,
  type Sheet,
  type SlotId,
} from '../game/sheet';
import { rollChoices, genRivalSheet } from '../game/draft';
import { stageForRound } from '../game/champion';
import { buildChampion, initDuel, autoTurn, autoFinish, type DuelState } from '../game/battle';
import { ROUNDS, FINAL_ROUND_IDX } from '../data/rounds';

export type Screen = 'start' | 'draft' | 'arena' | 'battle' | 'result';
export type Speed = 1 | 2 | 4;

export const TOTAL_PICKS = 7; // one per sheet slot

export interface GameData {
  screen: Screen;
  sheet: Sheet;
  choiceRound: number; // picks made so far (0..7)
  choices: string[]; // the 3 basic forms shown now
  roundIdx: number;
  rivalSheet: Sheet | null;
  duel: DuelState | null;
  speed: Speed;
  autoPlaying: boolean;
  champion: boolean;
  eliminated: boolean;
  lastResult: 'win' | 'lose' | null;
  seed: number;
}

export interface GameActions {
  newGame: () => void;
  startDraft: () => void;
  rerollChoices: () => void;
  chooseAttribute: (slot: SlotId, speciesId: string) => void;
  startRound: () => void;
  tick: () => void;
  setSpeed: (speed: Speed) => void;
  toggleAuto: () => void;
  skipBattle: () => void;
  resolveBattle: () => void;
}

export type GameStore = GameData & GameActions;

export function freshData(): GameData {
  return {
    screen: 'start',
    sheet: emptySheet(),
    choiceRound: 0,
    choices: [],
    roundIdx: 0,
    rivalSheet: null,
    duel: null,
    speed: 1,
    autoPlaying: false,
    champion: false,
    eliminated: false,
    lastResult: null,
    seed: 1,
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => {
      const takeRng = () => {
        const seed = get().seed;
        set({ seed: seed + 1 });
        return mulberry32(seed);
      };

      return {
        ...freshData(),

        newGame: () => set({ ...freshData(), seed: get().seed + 1 }),

        startDraft: () => {
          const rng = takeRng();
          set({
            ...freshData(),
            seed: get().seed,
            screen: 'draft',
            sheet: emptySheet(),
            choiceRound: 0,
            choices: rollChoices(rng),
          });
        },

        rerollChoices: () => {
          const rng = takeRng();
          set({ choices: rollChoices(rng) });
        },

        chooseAttribute: (slot, speciesId) => {
          const sheet = takeAttribute(get().sheet, slot, speciesId);
          const picks = get().choiceRound + 1;
          const rng = takeRng();
          if (isComplete(sheet)) {
            set({
              sheet,
              choiceRound: picks,
              choices: [],
              roundIdx: 0,
              rivalSheet: genRivalSheet(0, rng),
              screen: 'arena',
            });
            return;
          }
          set({ sheet, choiceRound: picks, choices: rollChoices(rng) });
        },

        startRound: () => {
          const round = ROUNDS[get().roundIdx];
          const sheet = get().sheet;
          const rivalSheet = get().rivalSheet;
          if (!rivalSheet) return;
          const player = buildChampion(sheet, round.avgLevel, stageForRound(sheet.line!, round.idx));
          const ai = buildChampion(
            rivalSheet,
            round.avgLevel,
            stageForRound(rivalSheet.line!, round.idx),
          );
          set({ duel: initDuel(player, ai), screen: 'battle', autoPlaying: true, lastResult: null });
        },

        tick: () => {
          const d = get().duel;
          if (!d || d.over || !get().autoPlaying) return;
          const next = autoTurn(d, takeRng());
          set({
            duel: next,
            autoPlaying: !next.over,
            lastResult: next.over ? (next.winner === 'player' ? 'win' : 'lose') : get().lastResult,
          });
        },

        setSpeed: (speed) => set({ speed }),

        toggleAuto: () => {
          const d = get().duel;
          if (!d || d.over) return;
          set({ autoPlaying: !get().autoPlaying });
        },

        skipBattle: () => {
          const d = get().duel;
          if (!d || d.over) return;
          const final = autoFinish(d, takeRng());
          set({
            duel: final,
            autoPlaying: false,
            lastResult: final.winner === 'player' ? 'win' : 'lose',
          });
        },

        resolveBattle: () => {
          const d = get().duel;
          if (!d || !d.over) return;

          if (d.winner !== 'player') {
            set({ eliminated: true, screen: 'result', duel: null, autoPlaying: false });
            return;
          }
          if (get().roundIdx >= FINAL_ROUND_IDX) {
            set({ champion: true, screen: 'result', duel: null, autoPlaying: false });
            return;
          }
          const nextRound = get().roundIdx + 1;
          const rng = takeRng();
          set({
            roundIdx: nextRound,
            rivalSheet: genRivalSheet(nextRound, rng),
            duel: null,
            autoPlaying: false,
            screen: 'arena',
          });
        },
      };
    },
    {
      name: 'poke-draft-cup',
      version: 3,
      migrate: () => freshData(), // older saves use an incompatible model
      partialize: (s): GameData => ({
        screen: s.screen,
        sheet: s.sheet,
        choiceRound: s.choiceRound,
        choices: s.choices,
        roundIdx: s.roundIdx,
        rivalSheet: s.rivalSheet,
        duel: s.duel,
        speed: s.speed,
        autoPlaying: s.autoPlaying,
        champion: s.champion,
        eliminated: s.eliminated,
        lastResult: s.lastResult,
        seed: s.seed,
      }),
    },
  ),
);
