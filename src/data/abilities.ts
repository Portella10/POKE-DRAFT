// Battle abilities. Each is pure data: the numeric fields are read by the duel
// engine and the champion stat builder, so effects stay data-driven and testable.

export type AbilityId =
  | 'guts'
  | 'shell'
  | 'swift'
  | 'lucky'
  | 'regen'
  | 'intimidate'
  | 'drain'
  | 'focus';

export interface Ability {
  id: AbilityId;
  label: string;
  emoji: string;
  desc: string;
  /** flat stat multipliers applied when the champion is built */
  speedMult?: number;
  critChance?: number;
  /** dynamic battle effects */
  lowHpAtkMult?: number; // ATK x this while below 1/3 HP
  dmgTakenMult?: number; // incoming damage x this
  healPerTurn?: number; // fraction of max HP healed each turn
  lifesteal?: number; // fraction of damage dealt healed back
  oppAtkMult?: number; // applied once to the opponent at duel start
  neverMiss?: boolean; // attacks never miss
}

export const ABILITIES: Record<AbilityId, Ability> = {
  guts: {
    id: 'guts',
    label: 'Fúria',
    emoji: '😤',
    desc: '+25% de Ataque quando está com pouca vida.',
    lowHpAtkMult: 1.25,
  },
  shell: {
    id: 'shell',
    label: 'Couraça',
    emoji: '🛡️',
    desc: 'Reduz em 15% o dano recebido.',
    dmgTakenMult: 0.85,
  },
  swift: {
    id: 'swift',
    label: 'Ímpeto',
    emoji: '💨',
    desc: '+15% de Velocidade.',
    speedMult: 1.15,
  },
  lucky: {
    id: 'lucky',
    label: 'Sortudo',
    emoji: '🍀',
    desc: 'Chance de acerto crítico de 20%.',
    critChance: 0.2,
  },
  regen: {
    id: 'regen',
    label: 'Regenerar',
    emoji: '💚',
    desc: 'Cura 6% da vida máxima a cada turno.',
    healPerTurn: 0.06,
  },
  intimidate: {
    id: 'intimidate',
    label: 'Intimidar',
    emoji: '😠',
    desc: 'Reduz 10% do Ataque do oponente no início.',
    oppAtkMult: 0.9,
  },
  drain: {
    id: 'drain',
    label: 'Vampírico',
    emoji: '🧛',
    desc: 'Cura 25% do dano causado.',
    lifesteal: 0.25,
  },
  focus: {
    id: 'focus',
    label: 'Precisão',
    emoji: '🎯',
    desc: 'Seus golpes nunca erram.',
    neverMiss: true,
  },
};

export const ABILITY_IDS = Object.keys(ABILITIES) as AbilityId[];

export function getAbility(id: AbilityId): Ability {
  return ABILITIES[id];
}
