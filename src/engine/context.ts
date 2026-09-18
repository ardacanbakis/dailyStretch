import type {
  AppState,
  CheckIn,
  Exercise,
  ExerciseFeedback,
  Profile,
  Routine,
  SessionRecord,
} from '../types';

/** Everything the engine needs to know about the user beyond the request itself. */
export interface EngineContext {
  exercises: Exercise[];
  profile: Profile;
  feedback: Record<string, ExerciseFeedback>;
  recentRoutines: Routine[];
  sessions: SessionRecord[];
  /** Today's check-in, if any. */
  checkIn: CheckIn;
  /** User reported neck exercises increased symptoms today. */
  neckSymptomsIncreasedToday: boolean;
  now: number;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export function dateKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function emptyFeedback(): ExerciseFeedback {
  return {
    favorite: false,
    worksWell: false,
    dontShowOften: false,
    excluded: false,
    painful: [],
    helpful: [],
    completed: 0,
    skipped: 0,
  };
}

export function contextFromState(state: AppState, exercises: Exercise[], now = Date.now()): EngineContext {
  const today = dateKey(now);
  const todayRecord = state.checkIns.find((c) => c.date === today);
  return {
    exercises,
    profile: state.profile,
    feedback: state.feedback,
    recentRoutines: state.recentRoutines,
    sessions: state.sessions,
    checkIn: todayRecord?.checkIn ?? {},
    neckSymptomsIncreasedToday: Boolean(todayRecord?.neckSymptomsIncreased),
    now,
  };
}
