// Move pool data: one weak + one strong named attack per type, plus the two
// universal normal moves. Pure data; the level-aware builder lives in game/moves.ts.

import type { TypeName } from './types';

export interface Move {
  name: string;
  type: TypeName;
  power: number;
  accuracy: number; // 0..1
}

export const WEAK_POWER = 50;
export const STRONG_POWER = 85;
export const WEAK_ACCURACY = 1;
export const STRONG_ACCURACY = 0.9;

export const MOVE_NAMES: Record<TypeName, { weak: string; strong: string }> = {
  normal: { weak: 'Pancada', strong: 'Corpo Sólido' },
  fire: { weak: 'Brasa', strong: 'Lança-Chamas' },
  water: { weak: 'Jato de Água', strong: 'Surfar' },
  electric: { weak: 'Choque do Trovão', strong: 'Raio' },
  grass: { weak: 'Folha Navalha', strong: 'Tempestade Floral' },
  ice: { weak: 'Vento Gélido', strong: 'Nevasca' },
  fighting: { weak: 'Caratê', strong: 'Soco Dinâmico' },
  poison: { weak: 'Ácido', strong: 'Bomba de Lodo' },
  ground: { weak: 'Bofetão de Lama', strong: 'Terremoto' },
  flying: { weak: 'Ataque Aéreo', strong: 'Brisa Cortante' },
  psychic: { weak: 'Confusão', strong: 'Psíquico' },
  bug: { weak: 'Picada', strong: 'Broca Letal' },
  rock: { weak: 'Joga-Pedra', strong: 'Rocha Veloz' },
  ghost: { weak: 'Lamber', strong: 'Bola Sombria' },
  dragon: { weak: 'Sopro do Dragão', strong: 'Garra Dragão' },
  dark: { weak: 'Mordida', strong: 'Investida Noturna' },
  steel: { weak: 'Garra de Metal', strong: 'Cabeça de Ferro' },
  fairy: { weak: 'Vento Feérico', strong: 'Brilho Mágico' },
};

export const INVESTIDA: Move = { name: 'Investida', type: 'normal', power: 40, accuracy: 1 };
export const GOLPE_FOCADO: Move = { name: 'Golpe Focado', type: 'normal', power: 70, accuracy: 1 };

/** Build a single typed attack, choosing the strong variant when `strong` is true. */
export function moveForType(type: TypeName, strong: boolean): Move {
  return {
    name: MOVE_NAMES[type][strong ? 'strong' : 'weak'],
    type,
    power: strong ? STRONG_POWER : WEAK_POWER,
    accuracy: strong ? STRONG_ACCURACY : WEAK_ACCURACY,
  };
}
