import { useGameStore, TOTAL_PICKS } from '../../store/gameStore';
import { SPECIES, BASE_TO_CHAIN } from '../../data/species';
import { ABILITIES } from '../../data/abilities';
import { TYPE_LABELS_PT } from '../../data/types';
import {
  SLOTS,
  SLOT_LABELS,
  isSlotFilled,
  type SlotId,
  type Sheet,
} from '../../game/sheet';
import { Sprite } from '../Sprite';

/** Human-readable value a species offers for a slot. */
function offerText(speciesId: string, slot: SlotId): string {
  const sp = SPECIES[speciesId];
  switch (slot) {
    case 'hp':
      return `${sp.base.hp}`;
    case 'atk':
      return `${sp.base.atk}`;
    case 'def':
      return `${sp.base.def}`;
    case 'spd':
      return `${sp.base.spd}`;
    case 'type':
      return sp.types.map((t) => TYPE_LABELS_PT[t]).join('/');
    case 'ability':
      return ABILITIES[sp.ability].label;
    case 'line':
      return `${BASE_TO_CHAIN[speciesId].length} estágios`;
  }
}

/** Current value on the sheet for a slot (for the ficha display). */
function sheetText(sheet: Sheet, slot: SlotId): string {
  if (!isSlotFilled(sheet, slot)) return '—';
  switch (slot) {
    case 'type':
      return sheet.type!.map((t) => TYPE_LABELS_PT[t]).join('/');
    case 'ability':
      return ABILITIES[sheet.ability!].label;
    case 'line':
      return sheet.line!.map((id) => SPECIES[id].label).join(' → ');
    default:
      return `${sheet[slot]}`;
  }
}

function ChoiceCard({ speciesId }: { speciesId: string }) {
  const sheet = useGameStore((s) => s.sheet);
  const choose = useGameStore((s) => s.chooseAttribute);
  const sp = SPECIES[speciesId];

  return (
    <div className="choice-card">
      <Sprite id={sp.id} primaryType={sp.types[0]} alt={sp.label} size={72} />
      <div className="choice-name">{sp.label}</div>
      <div className="chips">
        {SLOTS.map((slot) => {
          const filled = isSlotFilled(sheet, slot);
          return (
            <button
              key={slot}
              type="button"
              className={`chip-btn slot-${slot}`}
              disabled={filled}
              aria-label={`Pegar ${SLOT_LABELS[slot]} ${offerText(speciesId, slot)} de ${sp.label}`}
              onClick={() => choose(slot, speciesId)}
            >
              <span className="chip-slot">{SLOT_LABELS[slot]}</span>
              <span className="chip-val">{offerText(speciesId, slot)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DraftScreen() {
  const sheet = useGameStore((s) => s.sheet);
  const choices = useGameStore((s) => s.choices);
  const choiceRound = useGameStore((s) => s.choiceRound);
  const rerollChoices = useGameStore((s) => s.rerollChoices);

  return (
    <section className="draft">
      <h2>
        Monte seu Campeão — Escolha {Math.min(choiceRound + 1, TOTAL_PICKS)} de {TOTAL_PICKS}
      </h2>
      <p className="muted">
        Pegue <strong>um atributo ainda vazio</strong> de um dos 3 Pokémon. Tudo conta: força,
        estilo (tipo), habilidade e se a evolução é boa.
      </p>

      <div className="ficha" aria-label="Ficha do campeão">
        {SLOTS.map((slot) => (
          <div key={slot} className={`ficha-slot${isSlotFilled(sheet, slot) ? ' filled' : ''}`}>
            <span className="ficha-label">{SLOT_LABELS[slot]}</span>
            <span className="ficha-val">{sheetText(sheet, slot)}</span>
          </div>
        ))}
      </div>

      <div className="choices">
        {choices.map((id) => (
          <ChoiceCard key={id} speciesId={id} />
        ))}
      </div>

      <button type="button" className="secondary" onClick={() => rerollChoices()}>
        🎲 Sortear outros 3
      </button>
    </section>
  );
}
