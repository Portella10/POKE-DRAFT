import { useState } from 'react';
import { frontSprite, backSprite } from '../data/sprites';
import { TYPE_EMOJIS, type TypeName } from '../data/types';

interface SpriteProps {
  id: number;
  primaryType: TypeName;
  alt: string;
  back?: boolean;
  size?: number;
}

/** Classic pixel sprite from the PokéAPI CDN, with a type-emoji fallback. */
export function Sprite({ id, primaryType, alt, back, size = 80 }: SpriteProps) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <span className="sprite fallback" role="img" aria-label={alt} style={{ fontSize: size * 0.7 }}>
        {TYPE_EMOJIS[primaryType]}
      </span>
    );
  }
  return (
    <img
      className="sprite"
      src={back ? backSprite(id) : frontSprite(id)}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
}
