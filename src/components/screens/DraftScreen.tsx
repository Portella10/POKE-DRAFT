import { useGameStore, TOTAL_PICKS } from '../../store/gameStore';
import { SPECIES, BASE_TO_CHAIN } from '../../data/species';
import { ABILITIES } from '../../data/abilities';
import { TYPE_LABELS_PT } from '../../data/types';
import { SLOTS, SLOT_LABELS, isSlotFilled, type SlotId, type Sheet } from '../../game/sheet';
import { slotCost, canAfford, DRAFT_BUDGET } from '../../game/cost';
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

/** Slot emoji for quick visual scanning. */
const SLOT_ICON: Record<SlotId, string> = {
  hp: '❤️',
  atk: '⚔️',
  def: '🛡️',
  spd: '💨',
  type: '🌀',
  ability: '✨',
  line: '🧬',
};

function ChoiceCard({ speciesId }: { speciesId: string }) {
  const sheet = useGameStore((s) => s.sheet);
  const budget = useGameStore((s) => s.budget);
  const choose = useGameStore((s) => s.chooseAttribute);
  const sp = SPECIES[speciesId];

  return (
    <div className="choice-card" data-type={sp.types[0]}>
      <div className="choice-sprite">
        <Sprite id={sp.id} primaryType={sp.types[0]} alt={sp.label} size={84} />
      </div>
      <div className="choice-name">{sp.label}</div>
      <div className="chips">
        {SLOTS.map((slot) => {
          const filled = isSlotFilled(sheet, slot);
          const cost = slotCost(speciesId, slot);
          const affordable = canAfford(sheet, budget, slot, speciesId);
          const disabled = filled || !affordable;
          const cls = filled ? 'taken' : !affordable ? 'broke' : '';
          return (
            <button
              key={slot}
              type="button"
              className={`chip-btn slot-${slot} ${cls}`}
              disabled={disabled}
              aria-label={`Pegar ${SLOT_LABELS[slot]} ${offerText(speciesId, slot)} de ${sp.label} por ${cost} PD`}
              onClick={() => choose(slot, speciesId)}
            >
              <span className="chip-slot">
                {SLOT_ICON[slot]} {SLOT_LABELS[slot]}
              </span>
              <span className="chip-val">{offerText(speciesId, slot)}</span>
              <span className="chip-cost">{cost} PD</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DraftScreen() {
  const sheet = useGameStore((s) => s.sheet);
  const budget = useGameStore((s) => s.budget);
  const choices = useGameStore((s) => s.choices);
  const choiceRound = useGameStore((s) => s.choiceRound);
  const rerollChoices = useGameStore((s) => s.rerollChoices);

  const spent = DRAFT_BUDGET - budget;
  const spentPct = Math.round((spent / DRAFT_BUDGET) * 100);

  // Safety net: with very little PD left, a given trio may offer nothing you can
  // afford for an empty slot. There is always an affordable option somewhere in
  // the pool, so nudge the player to re-roll instead of letting them feel stuck.
  const anyAffordable = choices.some((id) =>
    SLOTS.some((slot) => canAfford(sheet, budget, slot, id)),
  );

  return (
    <section className="draft">
      <div className="draft-head">
        <div>
          <h2>
            Monte seu Campeão{' '}
            <span className="muted">
              — Escolha {Math.min(choiceRound + 1, TOTAL_PICKS)} de {TOTAL_PICKS}
            </span>
          </h2>
          <p className="muted lead">
            Cada atributo tem um <strong>custo em PD</strong>. Você não pode pegar tudo no máximo —
            o que vale a Vida do gigante vale dois golpes do veloz. Gaste com sabedoria.
          </p>
        </div>
        <div className="budget" aria-label={`Orçamento: ${budget} de ${DRAFT_BUDGET} pontos de draft`}>
          <div className="budget-top">
            <span className="budget-num">{budget}</span>
            <span className="budget-den">/ {DRAFT_BUDGET} PD</span>
          </div>
          <div className="budget-bar" role="meter" aria-valuenow={budget} aria-valuemin={0} aria-valuemax={DRAFT_BUDGET}>
            <div
              className={`budget-fill ${budget < DRAFT_BUDGET * 0.2 ? 'low' : ''}`}
              style={{ width: `${100 - spentPct}%` }}
            />
          </div>
          <div className="budget-label muted">Pontos de Draft restantes</div>
        </div>
      </div>

      <div className="ficha" aria-label="Ficha do campeão">
        {SLOTS.map((slot) => {
          const filled = isSlotFilled(sheet, slot);
          return (
            <div key={slot} className={`ficha-slot${filled ? ' filled' : ''}`}>
              <span className="ficha-label">
                {SLOT_ICON[slot]} {SLOT_LABELS[slot]}
              </span>
              <span className="ficha-val">{sheetText(sheet, slot)}</span>
              {filled && sheet.sources[slot] && (
                <span className="ficha-src">de {SPECIES[sheet.sources[slot]!].label}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="choices">
        {choices.map((id) => (
          <ChoiceCard key={id} speciesId={id} />
        ))}
      </div>

      {!anyAffordable && (
        <p className="draft-stuck">
          💸 Nenhum destes cabe no seu orçamento agora — sorteie outros 3.
        </p>
      )}
      <button
        type="button"
        className={`secondary reroll${!anyAffordable ? ' pulse' : ''}`}
        onClick={() => rerollChoices()}
      >
        🎲 Sortear outros 3
      </button>
    </section>
  );
}
