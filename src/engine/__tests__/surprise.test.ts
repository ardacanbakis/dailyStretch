import { describe, expect, it } from 'vitest';
import { getExercise, isNeckFocused } from '../../data/exercises';
import { generateSurprise, nextDeskReset, pickSurpriseTemplate } from '../surprise';
import { ctx, profile, routineOf } from './helpers';

describe('surprise me', () => {
  it('never picks a neck-family template when the neck must be avoided', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const t = pickSurpriseTemplate(ctx({ checkIn: { neck: 'avoid' } }), { seed });
      expect(t.family).not.toBe('neck');
      const { routine } = generateSurprise(ctx({ checkIn: { neck: 'avoid' } }), { seed });
      for (const i of routine.items) expect(isNeckFocused(getExercise(i.exerciseId)!)).toBe(false);
    }
  });

  it('leans toward neck work when neck is the priority and tight', () => {
    let neck = 0;
    for (let seed = 1; seed <= 40; seed++) {
      if (pickSurpriseTemplate(ctx({ checkIn: { neck: 'tight' } }), { seed, atDesk: false }).family === 'neck') neck++;
    }
    expect(neck).toBeGreaterThan(15);
  });

  it('prefers desk resets for very short sessions at the desk', () => {
    let desk = 0;
    for (let seed = 1; seed <= 30; seed++) {
      if (pickSurpriseTemplate(ctx(), { seed, minutes: 3, atDesk: true }).family === 'desk') desk++;
    }
    expect(desk).toBeGreaterThan(15);
  });

  it('avoids the family used most recently', () => {
    const recent = [routineOf(['chin_tuck_seated'], 'neck_gentle'), routineOf(['chin_tuck_wall'], 'neck_shoulders')].map((r) => ({ ...r, family: 'neck' as const }));
    let neck = 0;
    for (let seed = 1; seed <= 40; seed++) {
      if (pickSurpriseTemplate(ctx({ recentRoutines: recent }), { seed, atDesk: false }).family === 'neck') neck++;
    }
    expect(neck).toBeLessThan(25);
  });

  it('produces a complete routine within the requested time', () => {
    const { request, routine } = generateSurprise(ctx({ profile: profile({ defaultMinutes: 10 }) }), { seed: 4, minutes: 10 });
    expect(routine.items.length).toBeGreaterThan(2);
    expect(request.minutes).toBeGreaterThanOrEqual(5);
    expect(routine.name).toMatch(/^Surprise/);
  });

  it('rotates desk resets and skips ones the check-in rules out', () => {
    const c = ctx();
    const a = nextDeskReset(-1, {}, c);
    const b = nextDeskReset(a.cursor, {}, c);
    expect(a.template.id).not.toBe(b.template.id);
    const skipWrists = nextDeskReset(1, { wrists: 'avoid' }, c);
    expect(skipWrists.template.id).not.toBe('desk_wrists_shoulders');
  });
});
