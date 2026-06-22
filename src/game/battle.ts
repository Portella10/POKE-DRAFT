// 1v1 automatic duel between two built champions, with ability effects. Pure +
// immutable: autoTurn returns a fresh state, all randomness via an injected Rng.

import { effectiveness, type TypeName } from '../data/types';
import { SPECIES } from '../data/species';
import { ABILITIES, type AbilityId } from '../data/abilities';
import type { Move } from '../data/moves';
import type { Sheet } from './sheet';
import { championStats, championMoves, championSpeciesId } from './champion';

export const CRIT_MULT = 1.6;
export const MAX_TURNS = 60;

export interface BattleChampion {
  name: string;
  id: number; // Pokédex id for the sprite
  types: TypeName[];
  level: number;
  stage: number;
  ability: AbilityId;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  speed: number;
  critChance: number;
  moves: Move[];
  fainted: boolean;
}

export type Winner = 'player' | 'ai' | null;
export type SideKey = 'player' | 'ai';

export interface DuelState {
  player: BattleChampion;
  ai: BattleChampion;
  turn: number;
  log: string[];
  over: boolean;
  winner: Winner;
}

export interface DamageResult {
  dmg: number;
  eff: number;
  crit: boolean;
}

export interface AttackResult extends DamageResult {
  hit: boolean;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function buildChampion(sheet: Sheet, level: number, stage: number): BattleChampion {
  const species = SPECIES[championSpeciesId(sheet, stage)];
  const st = championStats(sheet, level, stage);
  return {
    name: species.label,
    id: species.id,
    types: [...sheet.type!],
    level,
    stage,
    ability: sheet.ability!,
    maxHp: st.maxHp,
    hp: st.maxHp,
    atk: st.atk,
    def: st.def,
    speed: st.speed,
    critChance: st.critChance,
    moves: championMoves(sheet, stage),
    fainted: false,
  };
}

export function calcDamage(
  att: BattleChampion,
  def: BattleChampion,
  move: Move,
  rng: () => number = Math.random,
): DamageResult {
  const eff = effectiveness(move.type, def.types);
  if (eff === 0) return { dmg: 0, eff: 0, crit: false };

  const attAb = ABILITIES[att.ability];
  const defAb = ABILITIES[def.ability];

  let atk = att.atk;
  if (attAb.lowHpAtkMult && att.hp < att.maxHp / 3) atk *= attAb.lowHpAtkMult; // guts

  const ratio = clamp(atk / def.def, 0.4, 2.6);
  const stab = att.types.includes(move.type) ? 1.5 : 1;
  const crit = rng() < att.critChance;
  const base = ((2 * att.level) / 5 + 2) * move.power * ratio / 28 + 2;
  const variance = 0.85 + rng() * 0.15;
  let raw = base * stab * eff * (crit ? CRIT_MULT : 1) * variance;
  if (defAb.dmgTakenMult) raw *= defAb.dmgTakenMult; // shell

  return { dmg: Math.max(1, Math.round(raw)), eff, crit };
}

export function resolveAttack(
  att: BattleChampion,
  def: BattleChampion,
  move: Move,
  rng: () => number = Math.random,
): AttackResult {
  const attAb = ABILITIES[att.ability];
  if (!attAb.neverMiss && rng() >= move.accuracy) return { hit: false, dmg: 0, eff: 1, crit: false }; // focus = never miss
  return { hit: true, ...calcDamage(att, def, move, rng) };
}

export function aiChoose(
  att: BattleChampion,
  def: BattleChampion,
  rng: () => number = Math.random,
): number {
  const scored = att.moves
    .map((m, i) => ({
      i,
      score: m.power * (att.types.includes(m.type) ? 1.5 : 1) * effectiveness(m.type, def.types),
    }))
    .sort((a, b) => b.score - a.score);
  if (scored.length > 1 && rng() < 0.2) return scored[1].i;
  return scored[0].i;
}

function effLabel(eff: number): string {
  if (eff === 0) return ' Não teve efeito...';
  if (eff >= 2) return ' Foi super eficaz!';
  if (eff < 1) return ' Não foi muito eficaz...';
  return '';
}

export function initDuel(player: BattleChampion, ai: BattleChampion): DuelState {
  // Intimidate lowers the opponent's ATK once at the start.
  const pAb = ABILITIES[player.ability];
  const aAb = ABILITIES[ai.ability];
  if (pAb.oppAtkMult) ai.atk *= pAb.oppAtkMult;
  if (aAb.oppAtkMult) player.atk *= aAb.oppAtkMult;
  const log = ['O duelo começou!'];
  if (pAb.oppAtkMult) log.push(`${player.name} intimidou ${ai.name}!`);
  if (aAb.oppAtkMult) log.push(`${ai.name} intimidou ${player.name}!`);
  return { player, ai, turn: 0, log, over: false, winner: null };
}

interface Action {
  side: SideKey;
  moveIdx: number;
}

function applyOneAttack(s: DuelState, act: Action, rng: () => number): void {
  const attacker = act.side === 'player' ? s.player : s.ai;
  const defender = act.side === 'player' ? s.ai : s.player;
  if (attacker.fainted || defender.fainted) return;

  const move = attacker.moves[act.moveIdx];
  const res = resolveAttack(attacker, defender, move, rng);
  if (!res.hit) {
    s.log.push(`${attacker.name} usou ${move.name}, mas errou!`);
    return;
  }

  defender.hp = Math.max(0, defender.hp - res.dmg);
  const critTxt = res.crit ? ' Acerto crítico!' : '';
  s.log.push(`${attacker.name} usou ${move.name} (${res.dmg}).${critTxt}${effLabel(res.eff)}`);

  const attAb = ABILITIES[attacker.ability];
  if (attAb.lifesteal && res.dmg > 0) {
    const heal = Math.round(res.dmg * attAb.lifesteal);
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal); // drain
  }

  if (defender.hp <= 0) {
    defender.fainted = true;
    s.log.push(`${defender.name} desmaiou!`);
    s.over = true;
    s.winner = act.side;
  }
}

function regen(c: BattleChampion, log: string[]): void {
  const ab = ABILITIES[c.ability];
  if (c.fainted || !ab.healPerTurn || c.hp >= c.maxHp) return;
  const heal = Math.round(c.maxHp * ab.healPerTurn);
  c.hp = Math.min(c.maxHp, c.hp + heal);
  log.push(`${c.name} se regenerou (+${heal}).`);
}

export function autoTurn(state: DuelState, rng: () => number = Math.random): DuelState {
  if (state.over) return state;
  const s: DuelState = structuredClone(state);

  const actions: Action[] = [
    { side: 'player', moveIdx: aiChoose(s.player, s.ai, rng) },
    { side: 'ai', moveIdx: aiChoose(s.ai, s.player, rng) },
  ];
  actions.sort((a, b) => {
    const sa = a.side === 'player' ? s.player.speed : s.ai.speed;
    const sb = b.side === 'player' ? s.player.speed : s.ai.speed;
    if (sb !== sa) return sb - sa;
    return rng() < 0.5 ? -1 : 1;
  });

  for (const act of actions) {
    if (s.over) break;
    applyOneAttack(s, act, rng);
  }

  if (!s.over) {
    regen(s.player, s.log);
    regen(s.ai, s.log);
  }

  s.turn += 1;

  if (!s.over && s.turn >= MAX_TURNS) {
    s.over = true;
    s.winner = s.player.hp / s.player.maxHp >= s.ai.hp / s.ai.maxHp ? 'player' : 'ai';
    s.log.push('Tempo esgotado! Vence quem tem mais vida.');
  }

  return s;
}

export function autoFinish(state: DuelState, rng: () => number = Math.random): DuelState {
  let s = state;
  let guard = 0;
  while (!s.over && guard < MAX_TURNS + 5) {
    s = autoTurn(s, rng);
    guard++;
  }
  return s;
}
