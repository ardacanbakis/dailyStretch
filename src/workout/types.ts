/** Types for the strength-training side of the app. */

export interface WorkoutExercise {
  id: string;
  /** Display name. */
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  muscleGroup: string;
  secondary: string[];
  instructions: string[];
  /** Animation file name in the upstream media repository. */
  gif: string;
}

/** Raw record shape as stored in public/data/workout-exercises.json. */
export interface RawWorkoutExercise {
  id: string;
  n: string;
  b: string;
  q: string;
  t: string;
  m: string;
  s: string[];
  i: string[];
  g: string;
}

export interface WorkoutDataset {
  version: number;
  attribution: string;
  source: string;
  count: number;
  exercises: RawWorkoutExercise[];
}

export const BODY_PARTS = [
  'chest',
  'back',
  'shoulders',
  'upper arms',
  'lower arms',
  'waist',
  'upper legs',
  'lower legs',
  'cardio',
  'neck',
] as const;
export type BodyPart = (typeof BODY_PARTS)[number];

export const BODY_PART_LABELS: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  'upper arms': 'Arms',
  'lower arms': 'Forearms',
  waist: 'Core',
  'upper legs': 'Legs',
  'lower legs': 'Calves',
  cardio: 'Cardio',
  neck: 'Neck',
};

/** Equipment groups the user can own, mapped to dataset equipment values. */
export const GEAR_GROUPS: { id: string; label: string; match: string[] }[] = [
  { id: 'bodyweight', label: 'Bodyweight only', match: ['body weight'] },
  { id: 'dumbbell', label: 'Dumbbells', match: ['dumbbell'] },
  { id: 'barbell', label: 'Barbell', match: ['barbell', 'ez barbell', 'olympic barbell', 'trap bar', 'weighted'] },
  { id: 'kettlebell', label: 'Kettlebell', match: ['kettlebell'] },
  { id: 'band', label: 'Bands', match: ['band', 'resistance band', 'rope'] },
  { id: 'bench', label: 'Bench / ball', match: ['stability ball', 'bosu ball', 'medicine ball'] },
  { id: 'machine', label: 'Machines', match: ['cable', 'leverage machine', 'smith machine', 'sled machine', 'hammer', 'assisted'] },
  {
    id: 'cardio',
    label: 'Cardio machines',
    match: ['stationary bike', 'elliptical machine', 'stepmill machine', 'skierg machine', 'upper body ergometer'],
  },
  { id: 'other', label: 'Other gear', match: ['roller', 'wheel roller', 'tire'] },
];

export type Gear = string;

/** How a set is measured. */
export type SetMode = 'reps' | 'time';

export interface PlanItem {
  exerciseId: string;
  sets: number;
  /** Target reps per set, or seconds when mode is 'time'. */
  target: number;
  mode: SetMode;
  /** Rest between sets, seconds. */
  restSec: number;
  /** Block label, e.g. "Push" or "Warm-up". */
  block: string;
  /** Optional starting weight in the user's unit. */
  weight?: number;
}

export interface WorkoutPlan {
  id: string;
  templateId: string;
  name: string;
  createdAt: number;
  /** Estimated minutes. */
  minutes: number;
  items: PlanItem[];
  notes: string[];
  /** Mobility exercise ids from the stretch library, run before the main work. */
  warmup: string[];
  /** Mobility exercise ids run afterwards. */
  cooldown: string[];
}

export interface SetLog {
  reps: number;
  /** Weight in the user's unit; 0 for bodyweight. */
  weight: number;
  /** Seconds, for time-based work. */
  seconds?: number;
  done: boolean;
}

export interface WorkoutItemRecord {
  exerciseId: string;
  mode: SetMode;
  sets: SetLog[];
  skipped: boolean;
}

export interface WorkoutSession {
  id: string;
  planId: string;
  templateId: string;
  name: string;
  startedAt: number;
  endedAt: number;
  /** Total elapsed seconds including rest. */
  durationSec: number;
  items: WorkoutItemRecord[];
  completed: boolean;
  /** Total weight x reps across the session. */
  volume: number;
  note?: string;
  /** Perceived effort, 1-5. */
  effort?: number;
}

export type Unit = 'kg' | 'lb';

export interface WorkoutProfile {
  unit: Unit;
  gear: Gear[];
  /** Default rest between sets in seconds. */
  restSec: number;
  defaultMinutes: number;
  /** Prepend a short mobility warm-up drawn from the stretch library. */
  includeWarmup: boolean;
  includeCooldown: boolean;
  /** Keep neck-friendly programming: avoid behind-the-neck and heavy overhead loading cues. */
  neckFriendly: boolean;
}

export interface WorkoutState {
  profile: WorkoutProfile;
  sessions: WorkoutSession[];
  /** Recent plans, most recent last. */
  recentPlans: WorkoutPlan[];
  /** exerciseId -> feedback flags. */
  favorites: string[];
  excluded: string[];
  /** exerciseId -> last used weight. */
  lastWeight: Record<string, number>;
}

export function defaultWorkoutProfile(): WorkoutProfile {
  return {
    unit: 'kg',
    gear: ['bodyweight', 'dumbbell', 'band'],
    restSec: 60,
    defaultMinutes: 30,
    includeWarmup: true,
    includeCooldown: true,
    neckFriendly: true,
  };
}

export function defaultWorkoutState(): WorkoutState {
  return {
    profile: defaultWorkoutProfile(),
    sessions: [],
    recentPlans: [],
    favorites: [],
    excluded: [],
    lastWeight: {},
  };
}
