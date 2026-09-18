// ---------------------------------------------------------------------------
// Core domain types for DailyStretch
// ---------------------------------------------------------------------------

/** Fine-grained anatomical areas an exercise can target. */
export type BodyArea =
  | 'neck'
  | 'upper_trap'
  | 'levator'
  | 'shoulders'
  | 'scapula'
  | 'chest'
  | 'thoracic'
  | 'wrists'
  | 'forearms'
  | 'lower_back'
  | 'hips'
  | 'hip_flexors'
  | 'glutes'
  | 'hamstrings'
  | 'quads'
  | 'adductors'
  | 'calves'
  | 'ankles';

export const BODY_AREAS: BodyArea[] = [
  'neck',
  'upper_trap',
  'levator',
  'shoulders',
  'scapula',
  'chest',
  'thoracic',
  'wrists',
  'forearms',
  'lower_back',
  'hips',
  'hip_flexors',
  'glutes',
  'hamstrings',
  'quads',
  'adductors',
  'calves',
  'ankles',
];

export const BODY_AREA_LABELS: Record<BodyArea, string> = {
  neck: 'Neck',
  upper_trap: 'Upper trapezius',
  levator: 'Levator scapulae',
  shoulders: 'Shoulders',
  scapula: 'Shoulder blades',
  chest: 'Chest / pecs',
  thoracic: 'Thoracic spine',
  wrists: 'Wrists',
  forearms: 'Forearms',
  lower_back: 'Lower back',
  hips: 'Hips',
  hip_flexors: 'Hip flexors',
  glutes: 'Glutes',
  hamstrings: 'Hamstrings',
  quads: 'Quadriceps',
  adductors: 'Adductors / inner thighs',
  calves: 'Calves',
  ankles: 'Ankles',
};

/** Coarse regions used by the daily check-in. */
export type Region = 'neck' | 'shoulders' | 'upper_back' | 'lower_back' | 'hips' | 'legs' | 'wrists';

export const REGIONS: Region[] = ['neck', 'shoulders', 'upper_back', 'lower_back', 'hips', 'legs', 'wrists'];

export const REGION_LABELS: Record<Region, string> = {
  neck: 'Neck',
  shoulders: 'Shoulders',
  upper_back: 'Upper back',
  lower_back: 'Lower back',
  hips: 'Hips',
  legs: 'Legs',
  wrists: 'Wrists',
};

/** Which fine-grained areas roll up into each check-in region. */
export const REGION_AREAS: Record<Region, BodyArea[]> = {
  neck: ['neck', 'upper_trap', 'levator'],
  shoulders: ['shoulders', 'scapula', 'chest'],
  upper_back: ['thoracic', 'scapula'],
  lower_back: ['lower_back'],
  hips: ['hips', 'hip_flexors', 'glutes', 'adductors'],
  legs: ['hamstrings', 'quads', 'calves', 'ankles'],
  wrists: ['wrists', 'forearms'],
};

export type AreaStatus = 'good' | 'tight' | 'sore' | 'avoid';
export const AREA_STATUSES: AreaStatus[] = ['good', 'tight', 'sore', 'avoid'];
export const AREA_STATUS_LABELS: Record<AreaStatus, string> = {
  good: 'Good',
  tight: 'Tight',
  sore: 'Sore',
  avoid: 'Avoid today',
};

export type CheckIn = Partial<Record<Region, AreaStatus>>;

export type Position = 'seated' | 'standing' | 'floor';
export const POSITIONS: Position[] = ['seated', 'standing', 'floor'];
export const POSITION_LABELS: Record<Position, string> = {
  seated: 'Seated',
  standing: 'Standing',
  floor: 'Floor',
};

/** Position filter the user can choose when building a routine. */
export type PositionFilter = 'any' | 'seated' | 'standing' | 'floor' | 'mixed' | 'desk';
export const POSITION_FILTER_LABELS: Record<PositionFilter, string> = {
  any: 'Any',
  seated: 'Seated',
  standing: 'Standing',
  floor: 'Floor',
  mixed: 'Mixed',
  desk: 'Desk friendly',
};

export type Equipment = 'chair' | 'wall' | 'mat' | 'band' | 'foam_roller' | 'massage_ball';
export const EQUIPMENT: Equipment[] = ['chair', 'wall', 'mat', 'band', 'foam_roller', 'massage_ball'];
export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  chair: 'Chair',
  wall: 'Wall',
  mat: 'Yoga mat',
  band: 'Resistance band',
  foam_roller: 'Foam roller',
  massage_ball: 'Massage ball',
};

export type ExerciseKind = 'mobility' | 'stretch' | 'activation' | 'release';
export const EXERCISE_KIND_LABELS: Record<ExerciseKind, string> = {
  mobility: 'Mobility',
  stretch: 'Stretch',
  activation: 'Activation',
  release: 'Soft-tissue release',
};

export type Intensity = 'very_gentle' | 'gentle' | 'normal';
export const INTENSITIES: Intensity[] = ['very_gentle', 'gentle', 'normal'];
export const INTENSITY_LABELS: Record<Intensity, string> = {
  very_gentle: 'Very gentle',
  gentle: 'Gentle',
  normal: 'Normal',
};
export const INTENSITY_RANK: Record<Intensity, number> = { very_gentle: 0, gentle: 1, normal: 2 };

/**
 * How much the exercise moves or loads the cervical spine.
 * 0 = no direct neck movement (safe when neck is "avoid")
 * 1 = gentle, small-range or isometric neck work
 * 2 = moderate cervical range of motion (still conservative; never aggressive)
 */
export type CervicalLoad = 0 | 1 | 2;

/**
 * Movement category. Exercises in the same category are variants of the same
 * basic movement, and are never placed next to each other in a routine.
 */
export type MovementCategory =
  | 'chin_tuck'
  | 'deep_neck_flexor'
  | 'cervical_rotation'
  | 'cervical_lateral'
  | 'neck_isometric'
  | 'upper_trap_stretch'
  | 'levator_stretch'
  | 'scalene_stretch'
  | 'suboccipital_release'
  | 'shoulder_rolls'
  | 'scapular_retraction'
  | 'scapular_protraction'
  | 'wall_slides'
  | 'wall_angels'
  | 'shoulder_car'
  | 'posterior_shoulder_stretch'
  | 'rotator_cuff'
  | 'lat_stretch'
  | 'prone_scapular'
  | 'pec_stretch'
  | 'chest_opener'
  | 'thoracic_extension'
  | 'thoracic_rotation'
  | 'spinal_wave'
  | 'side_bend'
  | 'upper_back_release'
  | 'wrist_circles'
  | 'wrist_flexor_stretch'
  | 'wrist_extensor_stretch'
  | 'forearm_rotation'
  | 'finger_mobility'
  | 'forearm_release'
  | 'pelvic_tilt'
  | 'lumbar_flexion'
  | 'lumbar_rotation'
  | 'lumbar_extension'
  | 'core_stability'
  | 'hip_flexor_stretch'
  | 'glute_stretch'
  | 'hip_rotation'
  | 'hip_car'
  | 'glute_activation'
  | 'adductor_stretch'
  | 'hamstring_stretch'
  | 'hamstring_dynamic'
  | 'quad_stretch'
  | 'leg_swing'
  | 'calf_stretch'
  | 'ankle_mobility'
  | 'calf_activation'
  | 'full_body_flow'
  | 'squat_mobility';

export interface Exercise {
  id: string;
  name: string;
  category: MovementCategory;
  /** Main areas targeted. */
  primary: BodyArea[];
  /** Additional areas that benefit. */
  secondary: BodyArea[];
  kind: ExerciseKind;
  /** Positions the exercise can be performed in. */
  positions: Position[];
  /** Equipment required (all of them). Empty means bodyweight only. */
  equipment: Equipment[];
  /** Optional equipment that improves the exercise but isn't required. */
  optionalEquipment?: Equipment[];
  /** Can be done in ordinary work clothes at or beside a desk without lying down. */
  deskFriendly: boolean;
  /** Baseline intensity level. */
  intensity: Intensity;
  cervicalLoad: CervicalLoad;
  /** Default duration in seconds. */
  durationSec: number;
  /** Repetition guidance, e.g. "8-10 slow reps" or "hold 30s each side". */
  reps: string;
  /** Whether the exercise is performed per side (used for time display). */
  perSide?: boolean;
  /** One-line summary used in lists. */
  summary: string;
  /** Text demonstration: a short sequence of visual cues. */
  demo: string[];
  instructions: string[];
  breathing: string;
  mistakes: string[];
  easier: string;
  /** Optional named harder / alternative version in prose. */
  variation: string;
  cautions: string[];
}

// ---------------------------------------------------------------------------
// Routine templates and generation
// ---------------------------------------------------------------------------

export type RoutineFamily = 'neck' | 'desk' | 'upper' | 'lower' | 'full' | 'custom' | 'surprise';

export interface AreaWeight {
  /** Human label for the block, e.g. "Neck & upper back". */
  label: string;
  /** Areas exercises in this block may target (primary). */
  areas: BodyArea[];
  /** Relative share of routine time. */
  weight: number;
  /** Optional minimum seconds regardless of weight (0 = none). */
  minSec?: number;
}

export interface RoutineTemplate {
  id: string;
  family: RoutineFamily;
  name: string;
  description: string;
  minMinutes: number;
  maxMinutes: number;
  defaultMinutes: number;
  blocks: AreaWeight[];
  /** Default position filter for this template. */
  position: PositionFilter;
  /** Max cervical load allowed regardless of other settings. */
  maxCervicalLoad: CervicalLoad;
  /** Whether this template should get neck-priority injection when missing neck work. */
  neckPriority: boolean;
  /** Default intensity ceiling. */
  intensity: Intensity;
  tags?: string[];
}

export type FocusOption =
  | 'neck'
  | 'upper_back'
  | 'shoulders'
  | 'upper_body'
  | 'hips'
  | 'lower_body'
  | 'full_body'
  | 'desk';

export const FOCUS_LABELS: Record<FocusOption, string> = {
  neck: 'Neck',
  upper_back: 'Upper back',
  shoulders: 'Shoulders',
  upper_body: 'Upper body',
  hips: 'Hips',
  lower_body: 'Lower body',
  full_body: 'Full body',
  desk: 'Desk mobility',
};

export const TIME_OPTIONS = [2, 5, 10, 15, 20, 30] as const;
export type TimeOption = (typeof TIME_OPTIONS)[number];

export interface RoutineRequest {
  /** Template id, or 'custom' to derive blocks from focus. */
  templateId: string;
  minutes: number;
  focus?: FocusOption;
  intensity: Intensity;
  position: PositionFilter;
  /** Equipment available right now. */
  equipment: Equipment[];
  atDesk: boolean;
  checkIn: CheckIn;
  /** Optional random seed for reproducibility. */
  seed?: number;
}

export interface RoutineItem {
  exerciseId: string;
  /** Planned seconds for this item in this routine. */
  seconds: number;
  /** Block label the item was chosen for. */
  block: string;
}

export interface Routine {
  id: string;
  templateId: string;
  family: RoutineFamily;
  name: string;
  createdAt: number;
  requestedMinutes: number;
  items: RoutineItem[];
  /** Notes explaining adaptations (e.g. "Neck marked sore: reduced range"). */
  notes: string[];
  /** Fingerprint used to detect repeats. */
  fingerprint: string;
}

// ---------------------------------------------------------------------------
// User profile, feedback and history
// ---------------------------------------------------------------------------

export type ExerciseFlag = 'favorite' | 'works_well' | 'dont_show_often' | 'excluded';

export interface ExerciseFeedback {
  favorite: boolean;
  worksWell: boolean;
  dontShowOften: boolean;
  excluded: boolean;
  /** Timestamps of "painful" reports (most recent last). */
  painful: number[];
  /** Timestamps of "helpful" reports from sessions. */
  helpful: number[];
  /** Total times completed. */
  completed: number;
  /** Total times skipped during a session. */
  skipped: number;
  lastDone?: number;
}

export interface Profile {
  onboarded: boolean;
  name: string;
  /** Primary reason for using the app (informs neck priority). */
  neckPriority: boolean;
  /** Neck exercises disabled entirely (user toggle or onboarding advice). */
  neckExercisesEnabled: boolean;
  /** Onboarding answer: has a clinician advised avoiding neck movement? */
  avoidNeckAdvised: boolean;
  /** Onboarding: recent injury / acute pain flag. Forces very gentle mode. */
  acuteSymptoms: boolean;
  defaultIntensity: Intensity;
  defaultMinutes: number;
  ownedEquipment: Equipment[];
  worksAtDesk: boolean;
  /** Days for which painful exercises are avoided. */
  painAvoidDays: number;
  /** Whether to show the check-in before generating routines. */
  askCheckIn: boolean;
}

export type ItemOutcome = 'done' | 'skipped';

export interface SessionItemRecord {
  exerciseId: string;
  plannedSec: number;
  actualSec: number;
  outcome: ItemOutcome;
  /** Quick feedback given during the session. */
  feedback?: 'helpful' | 'painful' | 'neutral';
}

export interface SessionRecord {
  id: string;
  routineId: string;
  templateId: string;
  family: RoutineFamily;
  name: string;
  startedAt: number;
  endedAt: number;
  /** Total active seconds. */
  durationSec: number;
  items: SessionItemRecord[];
  completed: boolean;
  checkIn: CheckIn;
  /** User reported that neck exercises increased symptoms this session. */
  neckSymptomsIncreased?: boolean;
  /** 1-5 how the body felt afterwards. */
  feelRating?: number;
  note?: string;
}

export interface DailyCheckInRecord {
  date: string; // YYYY-MM-DD
  checkIn: CheckIn;
  /** Set when the user reports neck exercises worsened symptoms on this day. */
  neckSymptomsIncreased?: boolean;
}

export interface AppState {
  version: number;
  profile: Profile;
  feedback: Record<string, ExerciseFeedback>;
  sessions: SessionRecord[];
  /** Recently generated routines (most recent last). */
  recentRoutines: Routine[];
  checkIns: DailyCheckInRecord[];
  /** Index of the last quick-desk-reset sub-focus used, for rotation. */
  deskResetCursor: number;
}

export type SessionType = 'micro' | 'short' | 'full' | 'deep';

export function classifySession(durationSec: number): SessionType {
  const min = durationSec / 60;
  if (min < 4.5) return 'micro';
  if (min < 9.5) return 'short';
  if (min < 19.5) return 'full';
  return 'deep';
}

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  micro: 'Micro reset',
  short: 'Short session',
  full: 'Full session',
  deep: 'Deep session',
};
