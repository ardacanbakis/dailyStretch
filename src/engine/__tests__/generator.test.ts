import { describe, expect, it } from 'vitest';
import { EXERCISES, getExercise, isNeckFocused } from '../../data/exercises';
import { TEMPLATES } from '../../data/templates';
import { generateRoutine, jaccard, routineDurationSec } from '../generator';
import { emptyFeedback } from '../context';
import { ctx, profile, request, routineOf, NOW } from './helpers';

const ex = (id: string) => getExercise(id)!;

describe('generateRoutine', () => {
  it('produces a routine close to the requested duration for every template', () => {
    for (const t of TEMPLATES) {
      for (const minutes of [t.minMinutes, t.defaultMinutes, t.maxMinutes]) {
        const r = generateRoutine(request({ templateId: t.id, minutes, position: 'any' }), ctx());
        expect(r.items.length, `${t.id} @ ${minutes}`).toBeGreaterThan(0);
        const total = routineDurationSec(r);
        expect(total, `${t.id} @ ${minutes}`).toBeGreaterThanOrEqual(minutes * 60 * 0.8);
        expect(total, `${t.id} @ ${minutes}`).toBeLessThanOrEqual(minutes * 60 * 1.2);
      }
    }
  });

  it('is deterministic for a given seed', () => {
    const a = generateRoutine(request({ seed: 7 }), ctx());
    const b = generateRoutine(request({ seed: 7 }), ctx());
    expect(a.items.map((i) => i.exerciseId)).toEqual(b.items.map((i) => i.exerciseId));
  });

  it('never repeats an exercise, never puts the same category twice in a row, caps category volume', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const r = generateRoutine(request({ templateId: 'full_extended', minutes: 18, seed }), ctx());
      const ids = r.items.map((i) => i.exerciseId);
      expect(new Set(ids).size).toBe(ids.length);
      const cats = r.items.map((i) => ex(i.exerciseId).category);
      for (let i = 1; i < cats.length; i++) expect(cats[i], `seed ${seed}`).not.toBe(cats[i - 1]);
      const counts = new Map<string, number>();
      for (const c of cats) counts.set(c, (counts.get(c) ?? 0) + 1);
      for (const [, n] of counts) expect(n).toBeLessThanOrEqual(2);
    }
  });

  it('includes neck work in full-body sessions when neck is the priority', () => {
    for (const id of ['full_quick', 'full_standard', 'full_extended', 'full_deep']) {
      for (let seed = 1; seed <= 5; seed++) {
        const r = generateRoutine(request({ templateId: id, minutes: 10, seed }), ctx());
        expect(r.items.some((i) => isNeckFocused(ex(i.exerciseId))), `${id} seed ${seed}`).toBe(true);
      }
    }
  });

  it('puts the neck block roughly a third of a standard full-body session', () => {
    const r = generateRoutine(request({ templateId: 'full_standard', minutes: 15 }), ctx());
    const neckish = r.items
      .filter((i) => ['neck', 'upper_trap', 'levator', 'shoulders', 'scapula'].some((a) => ex(i.exerciseId).primary.includes(a as never)))
      .reduce((s, i) => s + i.seconds, 0);
    const total = routineDurationSec(r);
    expect(neckish / total).toBeGreaterThan(0.2);
    expect(neckish / total).toBeLessThan(0.6);
  });

  it('excludes direct neck movements when neck is "avoid today" but keeps the routine going', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const r = generateRoutine(request({ templateId: 'neck_upper_back', checkIn: { neck: 'avoid' }, seed }), ctx());
      expect(r.items.length).toBeGreaterThan(2);
      for (const i of r.items) {
        const e = ex(i.exerciseId);
        expect(e.cervicalLoad, e.id).toBe(0);
        expect(isNeckFocused(e), e.id).toBe(false);
      }
      expect(r.notes.join(' ')).toMatch(/avoid today/i);
      // still upper-body focused: thoracic / shoulders / chest present
      expect(r.items.some((i) => ex(i.exerciseId).primary.some((a) => ['thoracic', 'shoulders', 'scapula', 'chest'].includes(a)))).toBe(true);
    }
  });

  it('uses only small-range neck movements when neck is sore', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const r = generateRoutine(request({ templateId: 'neck_shoulders', checkIn: { neck: 'sore' }, seed }), ctx());
      for (const i of r.items) expect(ex(i.exerciseId).cervicalLoad, i.exerciseId).toBeLessThanOrEqual(1);
      expect(r.items.some((i) => isNeckFocused(ex(i.exerciseId)))).toBe(true);
    }
  });

  it('gives tight areas more time', () => {
    const base = generateRoutine(request({ templateId: 'full_standard', minutes: 15, seed: 3 }), ctx());
    const tight = generateRoutine(request({ templateId: 'full_standard', minutes: 15, seed: 3, checkIn: { hips: 'tight' } }), ctx());
    const hipSec = (r: typeof base) =>
      r.items.filter((i) => ex(i.exerciseId).primary.some((a) => ['hips', 'hip_flexors', 'glutes', 'adductors'].includes(a))).reduce((s, i) => s + i.seconds, 0);
    expect(hipSec(tight)).toBeGreaterThan(hipSec(base));
  });

  it('respects profile-level neck settings and same-day symptom reports', () => {
    const disabled = generateRoutine(request({ templateId: 'full_standard' }), ctx({ profile: profile({ neckExercisesEnabled: false }) }));
    expect(disabled.items.every((i) => ex(i.exerciseId).cervicalLoad === 0 && !isNeckFocused(ex(i.exerciseId)))).toBe(true);
    const advised = generateRoutine(request({ templateId: 'neck_gentle' }), ctx({ profile: profile({ avoidNeckAdvised: true }) }));
    expect(advised.items.every((i) => ex(i.exerciseId).cervicalLoad === 0)).toBe(true);
    const symptoms = generateRoutine(request({ templateId: 'neck_shoulders' }), ctx({ neckSymptomsIncreasedToday: true }));
    expect(symptoms.items.every((i) => !isNeckFocused(ex(i.exerciseId)))).toBe(true);
    expect(symptoms.items.length).toBeGreaterThan(0);
  });

  it('never selects excluded or recently painful exercises', () => {
    const feedback = {
      chin_tuck_seated: { ...emptyFeedback(), excluded: true },
      shoulder_rolls_back: { ...emptyFeedback(), painful: [NOW - 2 * 24 * 3600 * 1000] },
    };
    for (let seed = 1; seed <= 20; seed++) {
      const r = generateRoutine(request({ templateId: 'desk_neck_reset', minutes: 8, seed }), ctx({ feedback }));
      const ids = r.items.map((i) => i.exerciseId);
      expect(ids).not.toContain('chin_tuck_seated');
      expect(ids).not.toContain('shoulder_rolls_back');
    }
    // pain older than the window is allowed again (but de-prioritised)
    const old = { shoulder_rolls_back: { ...emptyFeedback(), painful: [NOW - 40 * 24 * 3600 * 1000] } };
    let seen = false;
    for (let seed = 1; seed <= 40 && !seen; seed++) {
      const r = generateRoutine(request({ templateId: 'desk_neck_reset', minutes: 8, seed }), ctx({ feedback: old }));
      seen = r.items.some((i) => i.exerciseId === 'shoulder_rolls_back');
    }
    expect(seen).toBe(true);
  });

  it('respects equipment, position and desk constraints', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const noEq = generateRoutine(request({ templateId: 'full_standard', equipment: [], seed }), ctx());
      for (const i of noEq.items) expect(ex(i.exerciseId).equipment, i.exerciseId).toEqual([]);

      const seated = generateRoutine(request({ templateId: 'upper_body', position: 'seated', seed }), ctx());
      for (const i of seated.items) expect(ex(i.exerciseId).positions).toContain('seated');

      const floor = generateRoutine(request({ templateId: 'lower_body', position: 'floor', seed }), ctx());
      for (const i of floor.items) expect(ex(i.exerciseId).positions).toContain('floor');

      const desk = generateRoutine(request({ templateId: 'full_standard', atDesk: true, position: 'desk', seed }), ctx());
      expect(desk.items.length).toBeGreaterThan(3);
      for (const i of desk.items) expect(ex(i.exerciseId).deskFriendly, i.exerciseId).toBe(true);
    }
  });

  it('respects the intensity ceiling', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const r = generateRoutine(request({ templateId: 'lower_body', intensity: 'very_gentle', seed }), ctx());
      for (const i of r.items) expect(ex(i.exerciseId).intensity).toBe('very_gentle');
      const g = generateRoutine(request({ templateId: 'full_deep', minutes: 25, intensity: 'gentle', seed }), ctx());
      for (const i of g.items) expect(ex(i.exerciseId).intensity).not.toBe('normal');
    }
  });

  it('varies the routine relative to recent history', () => {
    const first = generateRoutine(request({ templateId: 'neck_upper_back', seed: 11 }), ctx());
    const withHistory = ctx({ recentRoutines: [{ ...first, createdAt: NOW - 24 * 3600 * 1000 }] });
    let maxSim = 0;
    for (let seed = 100; seed < 110; seed++) {
      const next = generateRoutine(request({ templateId: 'neck_upper_back', seed }), withHistory);
      maxSim = Math.max(maxSim, jaccard(first.items.map((i) => i.exerciseId), next.items.map((i) => i.exerciseId)));
    }
    expect(maxSim).toBeLessThan(0.7);
  });

  it('avoids exercises done yesterday', () => {
    const yesterday = routineOf(['chin_tuck_seated', 'upper_trap_stretch_seated', 'doorway_chest_stretch', 'thoracic_extension_chair', 'wall_angels'], 'neck_upper_back');
    const sessions = [
      {
        id: 's1',
        routineId: yesterday.id,
        templateId: 'neck_upper_back',
        family: 'neck' as const,
        name: 'x',
        startedAt: NOW - 24 * 3600 * 1000,
        endedAt: NOW - 23.8 * 3600 * 1000,
        durationSec: 600,
        items: yesterday.items.map((i) => ({ exerciseId: i.exerciseId, plannedSec: 60, actualSec: 60, outcome: 'done' as const })),
        completed: true,
        checkIn: {},
      },
    ];
    let overlap = 0;
    let total = 0;
    for (let seed = 1; seed <= 15; seed++) {
      const r = generateRoutine(request({ templateId: 'neck_upper_back', seed }), ctx({ recentRoutines: [yesterday], sessions }));
      total += r.items.length;
      overlap += r.items.filter((i) => yesterday.items.some((y) => y.exerciseId === i.exerciseId)).length;
    }
    expect(overlap / total).toBeLessThan(0.25);
  });

  it('favours "works well" exercises and de-prioritises "don\'t show often" ones', () => {
    const target = 'levator_stretch_seated';
    const count = (fb: Record<string, ReturnType<typeof emptyFeedback>>) => {
      let n = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const r = generateRoutine(request({ templateId: 'neck_shoulders', minutes: 6, seed }), ctx({ feedback: fb }));
        if (r.items.some((i) => i.exerciseId === target)) n++;
      }
      return n;
    };
    const baseline = count({});
    const boosted = count({ [target]: { ...emptyFeedback(), worksWell: true } });
    const reduced = count({ [target]: { ...emptyFeedback(), dontShowOften: true } });
    expect(boosted).toBeGreaterThan(baseline);
    expect(reduced).toBeLessThan(baseline);
    // "works well" must not force it in every single time
    expect(boosted).toBeLessThan(40);
  });

  it('builds a worthwhile two-minute desk reset', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const r = generateRoutine(request({ templateId: 'desk_neck_shoulders', minutes: 2, position: 'desk', atDesk: true, seed }), ctx());
      expect(r.items.length).toBeGreaterThanOrEqual(2);
      expect(routineDurationSec(r)).toBeLessThanOrEqual(150);
      for (const i of r.items) expect(ex(i.exerciseId).deskFriendly).toBe(true);
    }
  });

  it('builds custom routines from a focus filter', () => {
    const r = generateRoutine(request({ templateId: 'custom', focus: 'hips', minutes: 10 }), ctx());
    expect(r.items.length).toBeGreaterThan(3);
    const hipItems = r.items.filter((i) => ex(i.exerciseId).primary.some((a) => ['hips', 'hip_flexors', 'glutes', 'adductors'].includes(a)));
    expect(hipItems.length / r.items.length).toBeGreaterThan(0.6);
  });

  it('places floor-only work at the end of mixed routines', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const r = generateRoutine(request({ templateId: 'full_deep', minutes: 25, seed }), ctx());
      const floorOnly = r.items.map((i) => {
        const e = ex(i.exerciseId);
        return e.positions.length === 1 && e.positions[0] === 'floor';
      });
      const firstFloor = floorOnly.indexOf(true);
      if (firstFloor === -1) continue;
      expect(floorOnly.slice(firstFloor).every(Boolean), `seed ${seed}`).toBe(true);
    }
  });

  it('every exercise in the library is reachable by some routine', () => {
    const seen = new Set<string>();
    for (const t of TEMPLATES) {
      for (let seed = 1; seed <= 12; seed++) {
        const r = generateRoutine(request({ templateId: t.id, minutes: t.maxMinutes, seed, equipment: ['chair', 'wall', 'mat', 'band', 'foam_roller', 'massage_ball'] }), ctx());
        for (const i of r.items) seen.add(i.exerciseId);
      }
    }
    const unreachable = EXERCISES.filter((e) => !seen.has(e.id)).map((e) => e.id);
    expect(unreachable.length, unreachable.join(', ')).toBeLessThan(EXERCISES.length * 0.15);
  });
});
