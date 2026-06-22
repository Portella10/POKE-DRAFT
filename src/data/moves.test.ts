import { describe, it, expect } from 'vitest';
import {
  MOVE_NAMES,
  moveForType,
  INVESTIDA,
  GOLPE_FOCADO,
  WEAK_POWER,
  STRONG_POWER,
} from './moves';
import { TYPES } from './types';

describe('MOVE_NAMES', () => {
  it('names a weak and strong move for every type', () => {
    for (const t of TYPES) {
      expect(MOVE_NAMES[t].weak).toBeTruthy();
      expect(MOVE_NAMES[t].strong).toBeTruthy();
      expect(MOVE_NAMES[t].weak).not.toBe(MOVE_NAMES[t].strong);
    }
  });
});

describe('moveForType', () => {
  it('builds the weak variant with weak power', () => {
    const m = moveForType('fire', false);
    expect(m.type).toBe('fire');
    expect(m.power).toBe(WEAK_POWER);
    expect(m.name).toBe(MOVE_NAMES.fire.weak);
  });

  it('builds the strong variant with strong power and lower accuracy', () => {
    const m = moveForType('fire', true);
    expect(m.power).toBe(STRONG_POWER);
    expect(m.name).toBe(MOVE_NAMES.fire.strong);
    expect(m.accuracy).toBeLessThan(1);
  });
});

describe('fixed normal moves', () => {
  it('Investida is a reliable 40-power normal move', () => {
    expect(INVESTIDA).toMatchObject({ type: 'normal', power: 40, accuracy: 1 });
  });
  it('Golpe Focado is a reliable 70-power normal move', () => {
    expect(GOLPE_FOCADO).toMatchObject({ type: 'normal', power: 70, accuracy: 1 });
  });
});
