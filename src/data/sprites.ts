// Classic pixel sprite URLs from the PokéAPI sprite CDN, built from the national
// Pokédex id. Loaded at runtime by the UI (with an emoji fallback on error).

const BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

/** Front-facing sprite (used for opponents). */
export function frontSprite(id: number): string {
  return `${BASE}/${id}.png`;
}

/** Back-facing sprite (used for the player's own active mon). */
export function backSprite(id: number): string {
  return `${BASE}/back/${id}.png`;
}
