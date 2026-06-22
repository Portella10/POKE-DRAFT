import { ABILITIES, type AbilityId } from '../data/abilities';

export function AbilityBadge({ id }: { id: AbilityId }) {
  const a = ABILITIES[id];
  return (
    <span className="ability-badge" title={a.desc}>
      <span aria-hidden>{a.emoji}</span> {a.label}
    </span>
  );
}
