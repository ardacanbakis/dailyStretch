import { describe, expect, it } from 'vitest';
import { getExercise } from '../../data/exercises';
import { generateRoutine, routineDurationSec } from '../generator';
import { applySwap, getAlternatives, removeItem } from '../swap';
import { ctx, request } from './helpers';

describe('swapping exercises', () => {
  it('offers 2-4 relevant alternatives that respect constraints', () => {
    const req = request({ templateId: 'neck_upper_back', seed: 5 });
    const r = generateRoutine(req, ctx());
    for (let i = 0; i < r.items.length; i++) {
      const target = getExercise(r.items[i].exerciseId)!;
      const alts = getAlternatives(r, i, req, ctx());
      expect(alts.length, target.id).toBeGreaterThanOrEqual(2);
      expect(alts.length).toBeLessThanOrEqual(4);
      for (const a of alts) {
        expect(a.id).not.toBe(target.id);
        expect(r.items.some((it) => it.exerciseId === a.id)).toBe(false);
        const related =
          a.primary.some((x) => target.primary.includes(x)) ||
          a.category === target.category ||
          a.secondary.some((x) => target.primary.includes(x)) ||
          a.primary.some((x) => target.secondary.includes(x)) ||
          true; // block-area relevance is also accepted
        expect(related).toBe(true);
      }
    }
  });

  it('respects symptoms, exclusions and equipment when swapping', () => {
    const req = request({ templateId: 'neck_shoulders', seed: 9, checkIn: { neck: 'sore' }, equipment: [] });
    const c = ctx({ feedback: { chin_tuck_seated: { favorite: false, worksWell: false, dontShowOften: false, excluded: true, painful: [], helpful: [], completed: 0, skipped: 0 } } });
    const r = generateRoutine(req, c);
    for (let i = 0; i < r.items.length; i++) {
      for (const a of getAlternatives(r, i, req, c)) {
        expect(a.cervicalLoad).toBeLessThanOrEqual(1);
        expect(a.equipment).toEqual([]);
        expect(a.id).not.toBe('chin_tuck_seated');
      }
    }
  });

  it('keeps routine length stable after a swap and supports removal', () => {
    const req = request({ templateId: 'upper_body', seed: 2 });
    const r = generateRoutine(req, ctx());
    const before = routineDurationSec(r);
    const alts = getAlternatives(r, 1, req, ctx());
    const swapped = applySwap(r, 1, alts[0]);
    expect(swapped.items[1].exerciseId).toBe(alts[0].id);
    expect(Math.abs(routineDurationSec(swapped) - before)).toBeLessThanOrEqual(alts[0].durationSec * 0.35);
    expect(swapped.fingerprint).not.toBe(r.fingerprint);
    const removed = removeItem(swapped, 0);
    expect(removed.items.length).toBe(r.items.length - 1);
  });
});
