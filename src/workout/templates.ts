import type { WorkoutExercise } from './types';

export type WorkoutFamily = 'full' | 'split' | 'focus' | 'quick' | 'posture';

export interface WorkoutBlock {
  label: string;
  /** Dataset body parts this block may draw from. */
  bodyParts?: string[];
  /** Dataset target muscles this block may draw from (takes priority). */
  targets?: string[];
  /** Relative share of the exercise budget. */
  weight: number;
  /** Prefer multi-joint movements first in this block. */
  compound?: boolean;
}

export interface WorkoutTemplate {
  id: string;
  family: WorkoutFamily;
  name: string;
  description: string;
  minMinutes: number;
  maxMinutes: number;
  defaultMinutes: number;
  blocks: WorkoutBlock[];
  /** Only bodyweight exercises. */
  bodyweightOnly?: boolean;
  tags?: string[];
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'full_body',
    family: 'full',
    name: 'Full Body',
    description: 'One session covering legs, back, chest, shoulders and core.',
    minMinutes: 20,
    maxMinutes: 75,
    defaultMinutes: 45,
    blocks: [
      { label: 'Legs', bodyParts: ['upper legs'], weight: 2, compound: true },
      { label: 'Pull', targets: ['lats', 'upper back'], weight: 2, compound: true },
      { label: 'Push', targets: ['pectorals'], weight: 2, compound: true },
      { label: 'Shoulders', targets: ['delts'], weight: 1.2 },
      { label: 'Core', targets: ['abs'], weight: 1.2 },
    ],
  },
  {
    id: 'upper_body',
    family: 'split',
    name: 'Upper Body',
    description: 'Back, chest, shoulders and arms in one session.',
    minMinutes: 20,
    maxMinutes: 75,
    defaultMinutes: 45,
    blocks: [
      { label: 'Back', targets: ['lats', 'upper back'], weight: 2.2, compound: true },
      { label: 'Chest', targets: ['pectorals'], weight: 2, compound: true },
      { label: 'Shoulders', targets: ['delts'], weight: 1.5 },
      { label: 'Arms', targets: ['biceps', 'triceps'], weight: 1.5 },
    ],
  },
  {
    id: 'lower_body',
    family: 'split',
    name: 'Lower Body',
    description: 'Quads, hamstrings, glutes and calves.',
    minMinutes: 20,
    maxMinutes: 75,
    defaultMinutes: 45,
    blocks: [
      { label: 'Squat pattern', targets: ['quads'], weight: 2, compound: true },
      { label: 'Hinge pattern', targets: ['hamstrings', 'glutes'], weight: 2, compound: true },
      { label: 'Single leg', targets: ['glutes', 'quads'], weight: 1.2 },
      { label: 'Calves', targets: ['calves'], weight: 1 },
      { label: 'Core', targets: ['abs'], weight: 1 },
    ],
  },
  {
    id: 'push',
    family: 'split',
    name: 'Push',
    description: 'Chest, shoulders and triceps.',
    minMinutes: 20,
    maxMinutes: 60,
    defaultMinutes: 40,
    blocks: [
      { label: 'Chest', targets: ['pectorals'], weight: 2.5, compound: true },
      { label: 'Shoulders', targets: ['delts'], weight: 2 },
      { label: 'Triceps', targets: ['triceps'], weight: 1.5 },
    ],
  },
  {
    id: 'pull',
    family: 'split',
    name: 'Pull',
    description: 'Back, rear shoulders and biceps.',
    minMinutes: 20,
    maxMinutes: 60,
    defaultMinutes: 40,
    blocks: [
      { label: 'Back width', targets: ['lats'], weight: 2, compound: true },
      { label: 'Back thickness', targets: ['upper back'], weight: 2, compound: true },
      { label: 'Biceps', targets: ['biceps'], weight: 1.5 },
    ],
  },
  {
    id: 'legs',
    family: 'split',
    name: 'Legs',
    description: 'A dedicated leg session with calves and core.',
    minMinutes: 20,
    maxMinutes: 60,
    defaultMinutes: 40,
    blocks: [
      { label: 'Quads', targets: ['quads'], weight: 2.2, compound: true },
      { label: 'Hamstrings and glutes', targets: ['hamstrings', 'glutes'], weight: 2.2, compound: true },
      { label: 'Calves', targets: ['calves'], weight: 1.2 },
    ],
  },
  {
    id: 'posture',
    family: 'posture',
    name: 'Posture & Upper Back',
    description: 'Rows, rear delts and upper-back work that supports the neck. Built for desk workers.',
    minMinutes: 15,
    maxMinutes: 45,
    defaultMinutes: 30,
    tags: ['neck'],
    blocks: [
      { label: 'Upper back', targets: ['upper back'], weight: 3, compound: true },
      { label: 'Rear shoulders', targets: ['delts'], weight: 2 },
      { label: 'Lats', targets: ['lats'], weight: 1.5 },
      { label: 'Core', targets: ['abs'], weight: 1 },
    ],
  },
  {
    id: 'core',
    family: 'focus',
    name: 'Core',
    description: 'Abs, obliques and trunk stability.',
    minMinutes: 10,
    maxMinutes: 35,
    defaultMinutes: 20,
    blocks: [{ label: 'Core', targets: ['abs'], weight: 3 }, { label: 'Lower back', targets: ['spine'], weight: 1 }],
  },
  {
    id: 'arms',
    family: 'focus',
    name: 'Arms',
    description: 'Biceps, triceps and forearms.',
    minMinutes: 15,
    maxMinutes: 45,
    defaultMinutes: 30,
    blocks: [
      { label: 'Biceps', targets: ['biceps'], weight: 2 },
      { label: 'Triceps', targets: ['triceps'], weight: 2 },
      { label: 'Forearms', targets: ['forearms'], weight: 1 },
    ],
  },
  {
    id: 'bodyweight_quick',
    family: 'quick',
    name: 'Quick Bodyweight',
    description: 'No equipment, anywhere. Short and full body.',
    minMinutes: 8,
    maxMinutes: 30,
    defaultMinutes: 15,
    bodyweightOnly: true,
    blocks: [
      { label: 'Legs', bodyParts: ['upper legs'], weight: 1.5 },
      { label: 'Push', targets: ['pectorals', 'triceps'], weight: 1.5 },
      { label: 'Pull and back', targets: ['lats', 'upper back'], weight: 1.2 },
      { label: 'Core', targets: ['abs'], weight: 1.5 },
    ],
  },
  {
    id: 'bodyweight_core',
    family: 'quick',
    name: 'Quick Core',
    description: 'Ten to twenty minutes of bodyweight trunk work.',
    minMinutes: 8,
    maxMinutes: 25,
    defaultMinutes: 12,
    bodyweightOnly: true,
    blocks: [{ label: 'Core', targets: ['abs'], weight: 3 }, { label: 'Glutes', targets: ['glutes'], weight: 1 }],
  },
  {
    id: 'cardio',
    family: 'focus',
    name: 'Cardio',
    description: 'Conditioning work, timed rather than counted.',
    minMinutes: 10,
    maxMinutes: 45,
    defaultMinutes: 20,
    blocks: [{ label: 'Conditioning', bodyParts: ['cardio'], weight: 3 }],
  },
];

const byId = new Map(WORKOUT_TEMPLATES.map((t) => [t.id, t]));

export function getWorkoutTemplate(id: string): WorkoutTemplate | undefined {
  return byId.get(id);
}

/** Multi-joint movements, recognised from the name and target combination. */
const COMPOUND_WORDS = [
  'squat',
  'deadlift',
  'press',
  'row',
  'pull-up',
  'pullup',
  'chin-up',
  'pulldown',
  'lunge',
  'dip',
  'push-up',
  'pushup',
  'clean',
  'snatch',
  'thruster',
  'step-up',
  'hip thrust',
  'good morning',
  'bench',
];

export function isCompound(e: WorkoutExercise): boolean {
  const n = e.name.toLowerCase();
  if (COMPOUND_WORDS.some((w) => n.includes(w))) return true;
  return e.secondary.length >= 2 && !n.includes('curl') && !n.includes('raise') && !n.includes('fly');
}
