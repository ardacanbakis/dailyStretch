import { readFileSync } from 'node:fs';
import type { WorkoutDataset, WorkoutExercise, WorkoutState } from '../types';
import { defaultWorkoutState } from '../types';

let cached: WorkoutExercise[] | null = null;

export function allExercises(): WorkoutExercise[] {
  if (cached) return cached;
  const raw = JSON.parse(readFileSync('public/data/workout-exercises.json', 'utf8')) as WorkoutDataset;
  cached = raw.exercises.map((r) => ({
    id: r.id,
    name: r.n,
    bodyPart: r.b,
    equipment: r.q,
    target: r.t,
    muscleGroup: r.m,
    secondary: r.s,
    instructions: r.i,
    gif: r.g,
  }));
  return cached;
}

export const ALL_GEAR = ['bodyweight', 'dumbbell', 'barbell', 'kettlebell', 'band', 'bench', 'machine', 'cardio', 'other'];

export function wState(overrides: Partial<WorkoutState> = {}): WorkoutState {
  return { ...defaultWorkoutState(), ...overrides };
}

export const NOW = Date.UTC(2026, 8, 19, 9, 0, 0);
