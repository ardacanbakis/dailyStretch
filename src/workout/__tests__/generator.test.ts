import { describe, expect, it } from 'vitest';
import { generateWorkout, prescriptionFor, workoutAlternatives } from '../generator';
import { WORKOUT_TEMPLATES, getWorkoutTemplate } from '../templates';
import { isAdvancedSkill, isNeckRisky, isStretchEntry, equipmentForGear } from '../data';
import { ALL_GEAR, NOW, allExercises, wState } from './helpers';

const exercises = allExercises();
const ctx = (state = wState()) => ({ exercises, state, now: NOW });

describe('workout generator', () => {
  it('fills every template with exercises', () => {
    for (const t of WORKOUT_TEMPLATES) {
      const plan = generateWorkout({ templateId: t.id, minutes: t.defaultMinutes, gear: ALL_GEAR, seed: 3 }, ctx());
      expect(plan.items.length, t.id).toBeGreaterThanOrEqual(3);
      expect(new Set(plan.items.map((i) => i.exerciseId)).size).toBe(plan.items.length);
    }
  });

  it('keeps every exercise inside the block it was chosen for', () => {
    const byId = new Map(exercises.map((e) => [e.id, e]));
    for (const t of WORKOUT_TEMPLATES) {
      for (let seed = 1; seed <= 6; seed++) {
        const plan = generateWorkout({ templateId: t.id, minutes: t.maxMinutes, gear: ALL_GEAR, seed }, ctx());
        for (const item of plan.items) {
          const e = byId.get(item.exerciseId)!;
          const block = t.blocks.find((b) => b.label === item.block);
          expect(block, `${t.id}/${item.block}`).toBeDefined();
          const ok =
            (block!.targets?.includes(e.target) ?? false) || (block!.bodyParts?.includes(e.bodyPart) ?? false);
          expect(ok, `${t.id} block "${item.block}" got "${e.name}" (${e.bodyPart}/${e.target})`).toBe(true);
        }
      }
    }
  });

  it('respects the available equipment', () => {
    for (const gear of [['bodyweight'], ['bodyweight', 'dumbbell'], ['band']]) {
      const allowed = equipmentForGear(gear);
      const plan = generateWorkout({ templateId: 'full_body', minutes: 40, gear, seed: 5 }, ctx());
      const byId = new Map(exercises.map((e) => [e.id, e]));
      for (const item of plan.items) {
        const e = byId.get(item.exerciseId)!;
        expect(allowed.has(e.equipment) || e.equipment === 'body weight', `${gear} got ${e.name}`).toBe(true);
      }
    }
  });

  it('leaves stretching to the mobility side of the app', () => {
    const byId = new Map(exercises.map((e) => [e.id, e]));
    for (const t of WORKOUT_TEMPLATES) {
      for (let seed = 1; seed <= 4; seed++) {
        const plan = generateWorkout({ templateId: t.id, minutes: t.maxMinutes, gear: ALL_GEAR, seed }, ctx());
        for (const item of plan.items) {
          const e = byId.get(item.exerciseId)!;
          expect(isStretchEntry(e), `${t.id} got ${e.name}`).toBe(false);
        }
      }
    }
  });

  it('leaves out advanced skills and partner drills', () => {
    const byId = new Map(exercises.map((e) => [e.id, e]));
    for (const t of WORKOUT_TEMPLATES) {
      for (let seed = 1; seed <= 4; seed++) {
        const plan = generateWorkout({ templateId: t.id, minutes: t.maxMinutes, gear: ALL_GEAR, seed }, ctx());
        for (const item of plan.items) {
          expect(isAdvancedSkill(byId.get(item.exerciseId)!), byId.get(item.exerciseId)!.name).toBe(false);
        }
      }
    }
  });

  it('honours neck-friendly mode', () => {
    const byId = new Map(exercises.map((e) => [e.id, e]));
    for (let seed = 1; seed <= 8; seed++) {
      const plan = generateWorkout({ templateId: 'push', minutes: 45, gear: ALL_GEAR, seed, neckFriendly: true }, ctx());
      for (const item of plan.items) expect(isNeckRisky(byId.get(item.exerciseId)!)).toBe(false);
    }
  });

  it('scales the number of exercises with the time available', () => {
    const short = generateWorkout({ templateId: 'full_body', minutes: 20, gear: ALL_GEAR, seed: 2 }, ctx());
    const long = generateWorkout({ templateId: 'full_body', minutes: 70, gear: ALL_GEAR, seed: 2 }, ctx());
    expect(long.items.length).toBeGreaterThan(short.items.length);
    expect(short.minutes).toBeLessThan(long.minutes);
  });

  it('never repeats an exercise and avoids what was trained recently', () => {
    const first = generateWorkout({ templateId: 'pull', minutes: 45, gear: ALL_GEAR, seed: 1 }, ctx());
    const state = wState({
      sessions: [
        {
          id: 's1',
          planId: first.id,
          templateId: 'pull',
          name: 'Pull',
          startedAt: NOW - 86400000,
          endedAt: NOW - 86000000,
          durationSec: 2400,
          completed: true,
          volume: 1000,
          items: first.items.map((i) => ({ exerciseId: i.exerciseId, mode: i.mode, skipped: false, sets: [{ reps: 8, weight: 20, done: true }] })),
        },
      ],
    });
    let overlap = 0;
    let total = 0;
    for (let seed = 10; seed < 20; seed++) {
      const next = generateWorkout({ templateId: 'pull', minutes: 45, gear: ALL_GEAR, seed }, ctx(state));
      total += next.items.length;
      overlap += next.items.filter((i) => first.items.some((f) => f.exerciseId === i.exerciseId)).length;
    }
    expect(overlap / total).toBeLessThan(0.35);
  });

  it('falls back to bodyweight when the chosen gear cannot fill a session', () => {
    const plan = generateWorkout({ templateId: 'full_body', minutes: 40, gear: ['cardio'], seed: 4 }, ctx());
    expect(plan.items.length).toBeGreaterThan(2);
    expect(plan.notes.join(' ')).toMatch(/bodyweight/i);
  });

  it('prescribes sensible sets, reps and rest', () => {
    for (const e of exercises.slice(0, 200)) {
      const p = prescriptionFor(e, 60);
      expect(p.sets).toBeGreaterThanOrEqual(3);
      expect(p.sets).toBeLessThanOrEqual(4);
      expect(p.target).toBeGreaterThan(0);
      expect(p.restSec).toBeGreaterThanOrEqual(30);
    }
    const cardio = exercises.find((e) => e.bodyPart === 'cardio')!;
    expect(prescriptionFor(cardio, 60).mode).toBe('time');
  });

  it('offers relevant swaps that respect gear', () => {
    const plan = generateWorkout({ templateId: 'upper_body', minutes: 45, gear: ['bodyweight', 'dumbbell'], seed: 7 }, ctx());
    const byId = new Map(exercises.map((e) => [e.id, e]));
    for (let i = 0; i < plan.items.length; i++) {
      const target = byId.get(plan.items[i].exerciseId)!;
      const alts = workoutAlternatives(plan, i, { templateId: 'upper_body', minutes: 45, gear: ['bodyweight', 'dumbbell'] }, ctx(), 5);
      expect(alts.length, target.name).toBeGreaterThan(0);
      for (const a of alts) {
        expect(a.id).not.toBe(target.id);
        expect(plan.items.some((it) => it.exerciseId === a.id)).toBe(false);
        expect(a.target === target.target || a.bodyPart === target.bodyPart).toBe(true);
        expect(['body weight', 'dumbbell']).toContain(a.equipment);
      }
    }
  });

  it('estimates a duration close to what was asked for', () => {
    for (const t of WORKOUT_TEMPLATES) {
      const plan = generateWorkout({ templateId: t.id, minutes: t.defaultMinutes, gear: ALL_GEAR, seed: 8 }, ctx());
      expect(plan.minutes, t.id).toBeGreaterThan(t.defaultMinutes * 0.55);
      expect(plan.minutes, t.id).toBeLessThan(t.defaultMinutes * 1.75);
    }
  });

  it('templates reference targets that exist in the dataset', () => {
    const targets = new Set(exercises.map((e) => e.target));
    const parts = new Set(exercises.map((e) => e.bodyPart));
    for (const t of WORKOUT_TEMPLATES) {
      for (const b of t.blocks) {
        for (const x of b.targets ?? []) expect(targets, `${t.id}/${x}`).toContain(x);
        for (const x of b.bodyParts ?? []) expect(parts, `${t.id}/${x}`).toContain(x);
      }
    }
    expect(getWorkoutTemplate('full_body')).toBeDefined();
  });
});
