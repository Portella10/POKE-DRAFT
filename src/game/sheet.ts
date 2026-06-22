// The champion "sheet": seven attribute slots filled across draft rounds, each
// taken from a different basic-form Pokémon. Pure & immutable.

import { SPECIES, BASE_TO_CHAIN } from '../data/species';
import type { TypeName } from '../data/types';
import type { AbilityId } from '../data/abilities';

export type SlotId = 'hp' | 'atk' | 'def' | 'spd' | 'type' | 'ability' | 'line';

export const SLOTS: SlotId[] = ['hp', 'atk', 'def', 'spd', 'type', 'ability', 'line'];

export const SLOT_LABELS: Record<SlotId, string> = {
  hp: 'Vida',
  atk: 'Ataque',
  def: 'Defesa',
  spd: 'Velocidade',
  type: 'Tipo',
  ability: 'Habilidade',
  line: 'Linha Evolutiva',
};

export interface Sheet {
  hp?: number;
  atk?: number;
  def?: number;
  spd?: number;
  type?: TypeName[];
  ability?: AbilityId;
  line?: string[]; // evolution chain (basic -> ... -> final)
  /** which basic-form species each slot was taken from (for display) */
  sources: Partial<Record<SlotId, string>>;
}

export function emptySheet(): Sheet {
  return { sources: {} };
}

export function isSlotFilled(sheet: Sheet, slot: SlotId): boolean {
  return sheet[slot] !== undefined;
}

export function emptySlots(sheet: Sheet): SlotId[] {
  return SLOTS.filter((s) => !isSlotFilled(sheet, s));
}

export function isComplete(sheet: Sheet): boolean {
  return emptySlots(sheet).length === 0;
}

/** The value a basic-form species offers for a slot (raw, for display or storage). */
export function slotOffer(
  speciesId: string,
  slot: SlotId,
): number | TypeName[] | AbilityId | string[] {
  const sp = SPECIES[speciesId];
  switch (slot) {
    case 'hp':
      return sp.base.hp;
    case 'atk':
      return sp.base.atk;
    case 'def':
      return sp.base.def;
    case 'spd':
      return sp.base.spd;
    case 'type':
      return [...sp.types];
    case 'ability':
      return sp.ability;
    case 'line':
      return [...BASE_TO_CHAIN[speciesId]];
  }
}

/** Fill a slot from a species' attribute (no-op if already filled). Immutable. */
export function takeAttribute(sheet: Sheet, slot: SlotId, speciesId: string): Sheet {
  if (isSlotFilled(sheet, slot)) return sheet;
  return {
    ...sheet,
    [slot]: slotOffer(speciesId, slot),
    sources: { ...sheet.sources, [slot]: speciesId },
  };
}
