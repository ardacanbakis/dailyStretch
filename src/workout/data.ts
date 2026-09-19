import type { RawWorkoutExercise, WorkoutDataset, WorkoutExercise } from './types';
import { GEAR_GROUPS } from './types';

/**
 * Exercise media lives in the upstream dataset repository and is served from a
 * CDN rather than bundled here: the animations are © Gym visual and are used
 * under the terms the dataset repository documents, at their original 180x180
 * size and with attribution shown wherever they appear.
 */
const MEDIA_SOURCES = [
  'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/',
  'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/',
];

export const MEDIA_ATTRIBUTION = '© Gym visual — gymvisual.com';
export const MEDIA_SOURCE_COUNT = MEDIA_SOURCES.length;

/**
 * Animation (~95 KB) or still thumbnail (~7 KB) for an exercise. Lists use the
 * still so browsing stays light; the player and detail sheet use the animation.
 */
export function mediaUrl(gif: string, sourceIndex = 0, kind: 'gif' | 'still' = 'gif'): string {
  const base = MEDIA_SOURCES[Math.min(sourceIndex, MEDIA_SOURCES.length - 1)];
  if (kind === 'still') return `${base}images/${gif.replace(/\.gif$/, '.jpg')}`;
  return `${base}videos/${gif}`;
}

function expand(r: RawWorkoutExercise): WorkoutExercise {
  return {
    id: r.id,
    name: r.n,
    bodyPart: r.b,
    equipment: r.q,
    target: r.t,
    muscleGroup: r.m,
    secondary: r.s,
    instructions: r.i,
    gif: r.g,
  };
}

let cache: WorkoutExercise[] | null = null;
let pending: Promise<WorkoutExercise[]> | null = null;
let attribution = '';

export function loadedExercises(): WorkoutExercise[] | null {
  return cache;
}

export function datasetAttribution(): string {
  return attribution || MEDIA_ATTRIBUTION;
}

/** Fetch and cache the exercise dataset. Safe to call repeatedly. */
export function loadWorkoutExercises(): Promise<WorkoutExercise[]> {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;

  // A single-file build can carry the dataset inline instead of fetching it.
  const inline = typeof document !== 'undefined' ? document.getElementById('workout-data') : null;
  if (inline?.textContent) {
    try {
      const d = JSON.parse(inline.textContent) as WorkoutDataset;
      attribution = d.attribution;
      cache = d.exercises.map(expand);
      return Promise.resolve(cache);
    } catch {
      // fall through to the network
    }
  }

  const base = import.meta.env.BASE_URL ?? '/';
  pending = fetch(`${base}data/workout-exercises.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`Exercise data failed to load (${r.status})`);
      return r.json() as Promise<WorkoutDataset>;
    })
    .then((d) => {
      attribution = d.attribution;
      cache = d.exercises.map(expand);
      return cache;
    })
    .catch((err) => {
      pending = null;
      throw err;
    });
  return pending;
}

/** Which gear group an equipment value belongs to. */
export function gearOf(equipment: string): string {
  for (const g of GEAR_GROUPS) if (g.match.includes(equipment)) return g.id;
  return 'other';
}

export function equipmentForGear(gear: readonly string[]): Set<string> {
  const set = new Set<string>();
  for (const g of GEAR_GROUPS) {
    if (!gear.includes(g.id)) continue;
    for (const m of g.match) set.add(m);
  }
  return set;
}

export function isBodyweight(e: WorkoutExercise): boolean {
  return e.equipment === 'body weight' || e.equipment === 'assisted';
}

/**
 * Movements that load the cervical spine or place a bar behind the neck.
 * Excluded when the neck-friendly setting is on, which is the default here
 * because neck comfort is this app's guiding constraint.
 */
export function isNeckRisky(e: WorkoutExercise): boolean {
  const n = e.name.toLowerCase();
  if (e.bodyPart === 'neck') return false;
  return (
    n.includes('behind neck') ||
    n.includes('behind the neck') ||
    n.includes('behind head') && n.includes('press') ||
    n.includes('upright row') ||
    n.includes('hack squat') && n.includes('barbell') ||
    n.includes('shrug') && n.includes('behind') ||
    n.includes('neck press') ||
    n.includes('sit-up') && n.includes('hands behind')
  );
}

/** Cardio and machine work that cannot carry a weight value. */
export function isTimeBased(e: WorkoutExercise): boolean {
  if (e.bodyPart === 'cardio') return true;
  const n = e.name.toLowerCase();
  return n.includes('plank') || n.includes('hold') || n.includes('stretch') || n.includes('wall sit');
}

/**
 * Advanced calisthenics skills and partner drills. They are browsable, but the
 * plan generator leaves them out so a generated session stays doable alone.
 */
const SKILL_WORDS = [
  'back lever',
  'front lever',
  'planche',
  'muscle up',
  'muscle-up',
  'human flag',
  'iron cross',
  'maltese',
  'one arm chin',
  'one arm pull',
  'handstand',
  'skin the cat',
  'gironda sternum',
  'gorilla chin',
  'dragon flag',
  'assisted ',
  'partner',
  '(male)',
  'pov)',
];

export function isAdvancedSkill(e: WorkoutExercise): boolean {
  const n = e.name.toLowerCase();
  return SKILL_WORDS.some((w) => n.includes(w));
}

/**
 * Stretching and soft-tissue entries in the dataset. They stay browsable, but
 * generated strength sessions leave them out: stretching is what the mobility
 * side of the app is for, and it has purpose-built routines for it.
 */
export function isStretchEntry(e: WorkoutExercise): boolean {
  const n = e.name.toLowerCase();
  return (
    n.includes('stretch') ||
    n.includes('yoga pose') ||
    n.includes('foam roll') ||
    n.startsWith('roller ') ||
    n.includes('sphinx') ||
    n.includes('upward facing dog')
  );
}
