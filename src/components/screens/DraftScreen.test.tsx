import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DraftScreen } from './DraftScreen';
import { useGameStore, freshData } from '../../store/gameStore';
import { SPECIES } from '../../data/species';

beforeEach(() => {
  localStorage.clear();
  useGameStore.setState({
    ...freshData(),
    screen: 'draft',
    choiceRound: 0,
    choices: ['charmander', 'squirtle', 'machop'],
  });
});

describe('DraftScreen', () => {
  it('shows the ficha and the three Pokémon choices', () => {
    render(<DraftScreen />);
    expect(screen.getByText('Charmander')).toBeInTheDocument();
    expect(screen.getByText('Squirtle')).toBeInTheDocument();
    expect(screen.getByText('Machop')).toBeInTheDocument();
    // 3 cards x 7 attribute chips
    expect(screen.getAllByRole('button', { name: /Pegar/ })).toHaveLength(21);
  });

  it('taking an attribute fills the slot and advances the round', async () => {
    render(<DraftScreen />);
    await userEvent.click(
      screen.getByRole('button', { name: `Pegar Ataque ${SPECIES.machop.base.atk} de Machop` }),
    );
    expect(useGameStore.getState().sheet.atk).toBe(SPECIES.machop.base.atk);
    expect(useGameStore.getState().sheet.sources.atk).toBe('machop');
    expect(useGameStore.getState().choiceRound).toBe(1);
  });

  it('disables an attribute chip once its slot is filled', () => {
    useGameStore.setState({
      sheet: { atk: 99, sources: { atk: 'machop' } },
      choices: ['charmander', 'squirtle', 'machop'],
    });
    render(<DraftScreen />);
    const charCard = screen.getByText('Charmander').closest('.choice-card') as HTMLElement;
    expect(within(charCard).getByRole('button', { name: /Pegar Ataque/ })).toBeDisabled();
  });

  it('re-rolls the three choices', async () => {
    render(<DraftScreen />);
    await userEvent.click(screen.getByRole('button', { name: /Sortear outros 3/ }));
    expect(useGameStore.getState().choices).toHaveLength(3);
  });
});
