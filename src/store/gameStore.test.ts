import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, freshData, TOTAL_PICKS } from './gameStore';
import { emptySlots, isComplete } from '../game/sheet';
import { FINAL_ROUND_IDX } from '../data/rounds';

const store = useGameStore;
const reset = () => store.setState({ ...freshData() });

/** Drive the 7 attribute picks to completion (take the first empty slot each time). */
function completeDraft() {
  store.getState().startDraft();
  for (let i = 0; i < TOTAL_PICKS; i++) {
    const st = store.getState();
    const slot = emptySlots(st.sheet)[0];
    store.getState().chooseAttribute(slot, st.choices[0]);
  }
}

beforeEach(() => {
  localStorage.clear();
  reset();
});

describe('attribute draft', () => {
  it('startDraft opens the draft with 3 choices and an empty sheet', () => {
    store.getState().startDraft();
    const s = store.getState();
    expect(s.screen).toBe('draft');
    expect(s.choices).toHaveLength(3);
    expect(emptySlots(s.sheet)).toHaveLength(TOTAL_PICKS);
  });

  it('choosing an attribute fills its slot and advances the round', () => {
    store.getState().startDraft();
    const first = store.getState().choices[0];
    store.getState().chooseAttribute('atk', first);
    const s = store.getState();
    expect(s.sheet.atk).toBeDefined();
    expect(s.sheet.sources.atk).toBe(first);
    expect(s.choiceRound).toBe(1);
  });

  it('completing all 7 picks builds the champion and moves to the arena', () => {
    completeDraft();
    const s = store.getState();
    expect(isComplete(s.sheet)).toBe(true);
    expect(s.screen).toBe('arena');
    expect(s.rivalSheet).not.toBeNull();
    expect(isComplete(s.rivalSheet!)).toBe(true);
  });

  it('rerollChoices yields a fresh set', () => {
    store.getState().startDraft();
    const before = store.getState().choices;
    store.getState().rerollChoices();
    expect(store.getState().choices).not.toEqual(before);
  });
});

describe('duel lifecycle', () => {
  it('startRound builds a 1v1 duel', () => {
    completeDraft();
    store.getState().startRound();
    const s = store.getState();
    expect(s.duel).not.toBeNull();
    expect(s.duel?.player.hp).toBeGreaterThan(0);
    expect(s.duel?.ai.hp).toBeGreaterThan(0);
    expect(s.screen).toBe('battle');
    expect(s.autoPlaying).toBe(true);
  });

  it('tick advances the duel turn', () => {
    completeDraft();
    store.getState().startRound();
    store.getState().tick();
    expect(store.getState().duel!.turn).toBe(1);
  });

  it('skipBattle fast-forwards to a finished duel', () => {
    completeDraft();
    store.getState().startRound();
    store.getState().skipBattle();
    expect(store.getState().duel!.over).toBe(true);
    expect(store.getState().lastResult).not.toBeNull();
  });

  it('setSpeed and toggleAuto adjust playback', () => {
    completeDraft();
    store.getState().startRound();
    store.getState().setSpeed(4);
    expect(store.getState().speed).toBe(4);
    store.getState().toggleAuto();
    expect(store.getState().autoPlaying).toBe(false);
  });
});

describe('progression', () => {
  const finishWith = (winner: 'player' | 'ai') => {
    completeDraft();
    store.getState().startRound();
    const d = store.getState().duel!;
    store.setState({ duel: { ...d, over: true, winner } });
  };

  it('a win advances to the next round and a new rival', () => {
    finishWith('player');
    store.getState().resolveBattle();
    expect(store.getState().roundIdx).toBe(1);
    expect(store.getState().screen).toBe('arena');
    expect(store.getState().rivalSheet).not.toBeNull();
  });

  it('a loss eliminates the player', () => {
    finishWith('ai');
    store.getState().resolveBattle();
    expect(store.getState().eliminated).toBe(true);
    expect(store.getState().screen).toBe('result');
  });

  it('winning the grand final crowns the champion', () => {
    completeDraft();
    store.setState({ roundIdx: FINAL_ROUND_IDX });
    store.getState().startRound();
    const d = store.getState().duel!;
    store.setState({ duel: { ...d, over: true, winner: 'player' } });
    store.getState().resolveBattle();
    expect(store.getState().champion).toBe(true);
    expect(store.getState().screen).toBe('result');
  });
});

describe('persistence', () => {
  it('writes progress and rehydrates it', async () => {
    store.getState().startDraft();
    store.getState().chooseAttribute('atk', store.getState().choices[0]);

    const raw = localStorage.getItem('poke-draft-cup');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).state.sheet.atk).toBeDefined();

    reset();
    expect(store.getState().sheet.atk).toBeUndefined();
    localStorage.setItem('poke-draft-cup', raw!);
    await store.persist.rehydrate();
    expect(store.getState().sheet.atk).toBeDefined();
    expect(store.getState().screen).toBe('draft');
  });

  it('newGame clears progress', () => {
    completeDraft();
    store.getState().newGame();
    const s = store.getState();
    expect(emptySlots(s.sheet)).toHaveLength(TOTAL_PICKS);
    expect(s.roundIdx).toBe(0);
    expect(s.screen).toBe('start');
  });
});
