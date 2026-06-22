import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BattleScreen } from './BattleScreen';
import { useGameStore, freshData } from '../../store/gameStore';
import { initDuel, buildChampion } from '../../game/battle';
import { sheetFromSpecies } from '../../game/draft';

const makeDuel = () =>
  initDuel(
    buildChampion(sheetFromSpecies('charmander'), 18, 0),
    buildChampion(sheetFromSpecies('squirtle'), 18, 0),
  );

beforeEach(() => {
  localStorage.clear();
  // autoPlaying false so the timer loop stays idle (deterministic tests).
  useGameStore.setState({ ...freshData(), screen: 'battle', autoPlaying: false, duel: makeDuel() });
});

describe('BattleScreen (1v1 duel)', () => {
  it('renders both champions with HP meters and sprites', () => {
    render(<BattleScreen />);
    expect(screen.getByText(/Você: Charmander/)).toBeInTheDocument();
    expect(screen.getByText(/Rival: Squirtle/)).toBeInTheDocument();
    expect(screen.getAllByRole('meter')).toHaveLength(2);
    expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(2);
  });

  it('changes the playback speed', async () => {
    render(<BattleScreen />);
    await userEvent.click(screen.getByRole('button', { name: '4x' }));
    expect(useGameStore.getState().speed).toBe(4);
  });

  it('skips to the end and shows the result banner', async () => {
    render(<BattleScreen />);
    await userEvent.click(screen.getByRole('button', { name: /Pular/ }));
    expect(useGameStore.getState().duel!.over).toBe(true);
    expect(screen.getByText(/venceu o duelo|perdeu/)).toBeInTheDocument();
  });
});
