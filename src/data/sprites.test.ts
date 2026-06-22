import { describe, it, expect } from 'vitest';
import { frontSprite, backSprite } from './sprites';
import { SPECIES } from './species';

describe('sprite URLs', () => {
  it('builds a front sprite URL from a Pokédex id', () => {
    expect(frontSprite(4)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
    );
  });

  it('builds a back sprite URL', () => {
    expect(backSprite(4)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/4.png',
    );
  });

  it('works for every species id in the roster', () => {
    for (const s of Object.values(SPECIES)) {
      expect(frontSprite(s.id)).toContain(`/${s.id}.png`);
    }
  });
});
