import { TYPE_COLORS, TYPE_EMOJIS, TYPE_LABELS_PT, type TypeName } from '../data/types';

export function TypeBadge({ type }: { type: TypeName }) {
  return (
    <span className="type-badge" style={{ background: TYPE_COLORS[type] }} data-type={type}>
      <span aria-hidden>{TYPE_EMOJIS[type]}</span> {TYPE_LABELS_PT[type]}
    </span>
  );
}
