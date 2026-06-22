// One-shot generator: pulls official types + base stats from PokéAPI and
// materialises a fully static `src/data/species.ts`. Run with:
//   node scripts/gen-species.mjs
// The game and the tests only ever read the generated file (offline, deterministic).

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'data', 'species.ts');

// Curated evolution lines (1, 2 or 3 stages) chosen to cover all 18 types.
const CHAINS = [
  ['charmander', 'charmeleon', 'charizard'],
  ['squirtle', 'wartortle', 'blastoise'],
  ['bulbasaur', 'ivysaur', 'venusaur'],
  ['treecko', 'grovyle', 'sceptile'],
  ['chimchar', 'monferno', 'infernape'],
  ['piplup', 'prinplup', 'empoleon'],
  ['ralts', 'kirlia', 'gardevoir'],
  ['gastly', 'haunter', 'gengar'],
  ['dratini', 'dragonair', 'dragonite'],
  ['larvitar', 'pupitar', 'tyranitar'],
  ['beldum', 'metang', 'metagross'],
  ['trapinch', 'vibrava', 'flygon'],
  ['swinub', 'piloswine', 'mamoswine'],
  ['machop', 'machoke', 'machamp'],
  ['abra', 'kadabra', 'alakazam'],
  ['shinx', 'luxio', 'luxray'],
  ['tympole', 'palpitoad', 'seismitoad'],
  ['zubat', 'golbat', 'crobat'],
  ['geodude', 'graveler', 'golem'],
  ['magikarp', 'gyarados'],
  ['magnemite', 'magneton'],
  ['scyther', 'scizor'],
  ['sandshrew', 'sandslash'],
  ['snorunt', 'glalie'],
  ['riolu', 'lucario'],
  ['tauros'],
  ['snorlax'],
  ['lapras'],
  ['aerodactyl'],
  ['skarmory'],
  ['absol'],
  ['mawile'],
];

// Optional extra coverage type per species (flavour: a notable off-type move).
const COVERAGE = {
  charizard: 'dragon',
  blastoise: 'ice',
  sceptile: 'dragon',
  infernape: 'rock',
  empoleon: 'ice',
  gardevoir: 'ice',
  gengar: 'fighting',
  dragonite: 'fire',
  tyranitar: 'fire',
  metagross: 'ground',
  flygon: 'fire',
  mamoswine: 'rock',
  machamp: 'rock',
  alakazam: 'fighting',
  luxray: 'ice',
  seismitoad: 'poison',
  crobat: 'fighting',
  golem: 'fire',
  gyarados: 'dark',
  scizor: 'fighting',
  sandslash: 'rock',
  glalie: 'dark',
  lucario: 'fire',
  aerodactyl: 'fire',
  absol: 'fighting',
};

// One battle ability per evolution line (applied to every stage). Spread across
// the roster so the draft has meaningful ability variety.
const ABILITY_BY_BASE = {
  charmander: 'guts',
  squirtle: 'shell',
  bulbasaur: 'regen',
  treecko: 'swift',
  chimchar: 'guts',
  piplup: 'shell',
  ralts: 'lucky',
  gastly: 'drain',
  dratini: 'intimidate',
  larvitar: 'shell',
  beldum: 'focus',
  trapinch: 'swift',
  swinub: 'guts',
  machop: 'guts',
  abra: 'focus',
  shinx: 'swift',
  tympole: 'regen',
  zubat: 'drain',
  geodude: 'shell',
  magikarp: 'intimidate',
  magnemite: 'focus',
  scyther: 'swift',
  sandshrew: 'shell',
  snorunt: 'lucky',
  riolu: 'focus',
  tauros: 'intimidate',
  snorlax: 'regen',
  lapras: 'shell',
  aerodactyl: 'swift',
  skarmory: 'shell',
  absol: 'lucky',
  mawile: 'intimidate',
};

const PT_LABEL = {}; // display names (just capitalised English ids here)

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function baseOf(name) {
  const chain = CHAINS.find((c) => c.includes(name));
  return chain ? chain[0] : name;
}

async function fetchJson(url, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
}

async function fetchMon(name) {
  const json = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${name}`);
  const types = json.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name);
  const stat = (key) => json.stats.find((s) => s.stat.name === key).base_stat;
  return {
    name,
    id: json.id,
    label: PT_LABEL[name] ?? cap(name),
    types,
    base: {
      hp: stat('hp'),
      atk: stat('attack'),
      def: stat('defense'),
      spd: stat('speed'),
    },
    ability: ABILITY_BY_BASE[baseOf(name)] ?? 'shell',
    coverage: COVERAGE[name],
  };
}

async function main() {
  const names = CHAINS.flat();
  const species = {};
  for (const name of names) {
    species[name] = await fetchMon(name);
    process.stdout.write(`.${name}`);
  }
  process.stdout.write('\n');

  const baseToChain = {};
  for (const chain of CHAINS) baseToChain[chain[0]] = chain;
  const draftPool = CHAINS.map((c) => c[0]);

  const speciesEntries = names
    .map((n) => {
      const s = species[n];
      const cov = s.coverage ? `, coverage: '${s.coverage}'` : '';
      const b = s.base;
      return `  ${n}: { name: '${n}', id: ${s.id}, label: '${s.label}', types: [${s.types
        .map((t) => `'${t}'`)
        .join(
          ', ',
        )}], base: { hp: ${b.hp}, atk: ${b.atk}, def: ${b.def}, spd: ${b.spd} }, ability: '${s.ability}'${cov} },`;
    })
    .join('\n');

  const chainsLit = CHAINS.map((c) => `  [${c.map((n) => `'${n}'`).join(', ')}],`).join('\n');
  const baseToChainLit = Object.entries(baseToChain)
    .map(([k, c]) => `  ${k}: [${c.map((n) => `'${n}'`).join(', ')}],`)
    .join('\n');
  const draftPoolLit = draftPool.map((n) => `'${n}'`).join(', ');

  const out = `// AUTO-GENERATED by scripts/gen-species.mjs from PokéAPI base stats & types.
// Do not edit by hand — re-run the generator to refresh. Pure static data.
import type { TypeName } from './types';
import type { AbilityId } from './abilities';

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface Species {
  /** stable id (English lowercase) */
  name: string;
  /** national Pokédex number (used to build sprite URLs) */
  id: number;
  /** display label */
  label: string;
  /** 1-2 types, slot order preserved */
  types: TypeName[];
  /** official base stats */
  base: BaseStats;
  /** battle ability (shared across the evolution line) */
  ability: AbilityId;
  /** optional off-type coverage move */
  coverage?: TypeName;
}

/** Curated evolution lines (basic -> ... -> final). */
export const CHAINS: readonly string[][] = [
${chainsLit}
];

export const SPECIES: Record<string, Species> = {
${speciesEntries}
};

/** Maps each basic form to its full evolution line. */
export const BASE_TO_CHAIN: Record<string, readonly string[]> = {
${baseToChainLit}
};

/** All draftable basic forms. */
export const DRAFT_POOL: readonly string[] = [${draftPoolLit}];
`;

  await writeFile(OUT, out, 'utf8');
  console.log(`Wrote ${names.length} species to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
