import { useSyncExternalStore } from 'react';
import type {
  AppState,
  CheckIn,
  ExerciseFeedback,
  ExerciseFlag,
  Profile,
  Routine,
  SessionRecord,
} from '../types';
import { dateKey, emptyFeedback } from '../engine/context';
import { defaultWorkoutState, type WorkoutPlan, type WorkoutProfile, type WorkoutSession } from '../workout/types';

export const STORAGE_KEY = 'dailystretch.state.v1';
export const STATE_VERSION = 2;
const MAX_RECENT_ROUTINES = 30;
const MAX_CHECKINS = 120;

export function defaultProfile(): Profile {
  return {
    onboarded: false,
    name: '',
    neckPriority: true,
    neckExercisesEnabled: true,
    avoidNeckAdvised: false,
    acuteSymptoms: false,
    defaultIntensity: 'gentle',
    defaultMinutes: 10,
    ownedEquipment: ['chair', 'wall', 'mat'],
    worksAtDesk: true,
    painAvoidDays: 14,
    askCheckIn: true,
  };
}

export function defaultState(): AppState {
  return {
    version: STATE_VERSION,
    mode: 'mobility',
    profile: defaultProfile(),
    feedback: {},
    sessions: [],
    recentRoutines: [],
    checkIns: [],
    deskResetCursor: -1,
    workout: defaultWorkoutState(),
  };
}

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function loadState(): AppState {
  const base = defaultState();
  const s = storage();
  if (!s) return base;
  try {
    const raw = s.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...base,
      ...parsed,
      version: STATE_VERSION,
      profile: { ...base.profile, ...(parsed.profile ?? {}) },
      feedback: parsed.feedback ?? {},
      sessions: parsed.sessions ?? [],
      recentRoutines: parsed.recentRoutines ?? [],
      checkIns: parsed.checkIns ?? [],
      deskResetCursor: parsed.deskResetCursor ?? -1,
      workout: {
        ...base.workout,
        ...(parsed.workout ?? {}),
        profile: { ...base.workout.profile, ...(parsed.workout?.profile ?? {}) },
      },
    };
  } catch {
    return base;
  }
}

function persist(state: AppState): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable: keep running in memory.
  }
}

type Listener = () => void;
let state: AppState = loadState();
const listeners = new Set<Listener>();

export function getState(): AppState {
  return state;
}

export function setState(updater: (s: AppState) => AppState): void {
  state = updater(state);
  persist(state);
  for (const l of listeners) l();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

function feedbackFor(s: AppState, id: string): ExerciseFeedback {
  return s.feedback[id] ?? emptyFeedback();
}

function withFeedback(s: AppState, id: string, update: (fb: ExerciseFeedback) => ExerciseFeedback): AppState {
  return { ...s, feedback: { ...s.feedback, [id]: update(feedbackFor(s, id)) } };
}

export function todayCheckIn(s: AppState, now = Date.now()) {
  return s.checkIns.find((c) => c.date === dateKey(now));
}

export const actions = {
  updateProfile(patch: Partial<Profile>): void {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  },

  completeOnboarding(patch: Partial<Profile>): void {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch, onboarded: true } }));
  },

  setFlag(exerciseId: string, flag: ExerciseFlag, value: boolean): void {
    setState((s) =>
      withFeedback(s, exerciseId, (fb) => {
        const next = { ...fb };
        if (flag === 'favorite') next.favorite = value;
        if (flag === 'works_well') next.worksWell = value;
        if (flag === 'dont_show_often') {
          next.dontShowOften = value;
          if (value) next.worksWell = false;
        }
        if (flag === 'excluded') {
          next.excluded = value;
          if (value) {
            next.favorite = false;
            next.worksWell = false;
          }
        }
        return next;
      }),
    );
  },

  reportPain(exerciseId: string, when = Date.now()): void {
    setState((s) => withFeedback(s, exerciseId, (fb) => ({ ...fb, painful: [...fb.painful, when].slice(-20) })));
  },

  clearPain(exerciseId: string): void {
    setState((s) => withFeedback(s, exerciseId, (fb) => ({ ...fb, painful: [] })));
  },

  reportHelpful(exerciseId: string, when = Date.now()): void {
    setState((s) => withFeedback(s, exerciseId, (fb) => ({ ...fb, helpful: [...fb.helpful, when].slice(-50) })));
  },

  rememberRoutine(routine: Routine): void {
    setState((s) => {
      const without = s.recentRoutines.filter((r) => r.id !== routine.id);
      return { ...s, recentRoutines: [...without, routine].slice(-MAX_RECENT_ROUTINES) };
    });
  },

  recordSession(record: SessionRecord): void {
    setState((s) => {
      let next: AppState = { ...s, sessions: [...s.sessions.filter((x) => x.id !== record.id), record] };
      for (const item of record.items) {
        next = withFeedback(next, item.exerciseId, (fb) => {
          const out = { ...fb };
          if (item.outcome === 'done') {
            out.completed += 1;
            out.lastDone = record.endedAt;
          } else {
            out.skipped += 1;
          }
          if (item.feedback === 'helpful') out.helpful = [...fb.helpful, record.endedAt].slice(-50);
          if (item.feedback === 'painful') out.painful = [...fb.painful, record.endedAt].slice(-20);
          return out;
        });
      }
      if (record.neckSymptomsIncreased) {
        next = setDayFlag(next, record.endedAt, true);
      }
      return next;
    });
  },

  setTodayCheckIn(checkIn: CheckIn, now = Date.now()): void {
    setState((s) => {
      const date = dateKey(now);
      const existing = s.checkIns.find((c) => c.date === date);
      const record = { ...(existing ?? { date }), checkIn };
      return { ...s, checkIns: [...s.checkIns.filter((c) => c.date !== date), record].slice(-MAX_CHECKINS) };
    });
  },

  setNeckSymptomsIncreasedToday(value: boolean, now = Date.now()): void {
    setState((s) => setDayFlag(s, now, value));
  },

  setDeskResetCursor(cursor: number): void {
    setState((s) => ({ ...s, deskResetCursor: cursor }));
  },

  deleteSession(id: string): void {
    setState((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id) }));
  },

  setMode(mode: 'mobility' | 'workout'): void {
    setState((s) => ({ ...s, mode }));
  },

  updateWorkoutProfile(patch: Partial<WorkoutProfile>): void {
    setState((s) => ({ ...s, workout: { ...s.workout, profile: { ...s.workout.profile, ...patch } } }));
  },

  rememberWorkoutPlan(plan: WorkoutPlan): void {
    setState((s) => {
      const without = s.workout.recentPlans.filter((p) => p.id !== plan.id);
      return { ...s, workout: { ...s.workout, recentPlans: [...without, plan].slice(-20) } };
    });
  },

  recordWorkoutSession(record: WorkoutSession): void {
    setState((s) => {
      const lastWeight = { ...s.workout.lastWeight };
      for (const item of record.items) {
        const best = item.sets.filter((x) => x.done && x.weight > 0).map((x) => x.weight);
        if (best.length) lastWeight[item.exerciseId] = Math.max(...best);
      }
      return {
        ...s,
        workout: {
          ...s.workout,
          lastWeight,
          sessions: [...s.workout.sessions.filter((x) => x.id !== record.id), record],
        },
      };
    });
  },

  deleteWorkoutSession(id: string): void {
    setState((s) => ({ ...s, workout: { ...s.workout, sessions: s.workout.sessions.filter((x) => x.id !== id) } }));
  },

  toggleWorkoutFavorite(id: string): void {
    setState((s) => {
      const has = s.workout.favorites.includes(id);
      return {
        ...s,
        workout: { ...s.workout, favorites: has ? s.workout.favorites.filter((x) => x !== id) : [...s.workout.favorites, id] },
      };
    });
  },

  toggleWorkoutExcluded(id: string): void {
    setState((s) => {
      const has = s.workout.excluded.includes(id);
      return {
        ...s,
        workout: {
          ...s.workout,
          excluded: has ? s.workout.excluded.filter((x) => x !== id) : [...s.workout.excluded, id],
          favorites: has ? s.workout.favorites : s.workout.favorites.filter((x) => x !== id),
        },
      };
    });
  },

  resetAll(): void {
    setState(() => defaultState());
  },

  exportJson(): string {
    return JSON.stringify(getState(), null, 2);
  },

  importJson(json: string): boolean {
    try {
      const parsed = JSON.parse(json) as Partial<AppState>;
      if (!parsed || typeof parsed !== 'object' || !parsed.profile) return false;
      const base = defaultState();
      setState(() => ({
        ...base,
        ...parsed,
        version: STATE_VERSION,
        profile: { ...base.profile, ...parsed.profile },
        feedback: parsed.feedback ?? {},
        sessions: parsed.sessions ?? [],
        recentRoutines: parsed.recentRoutines ?? [],
        checkIns: parsed.checkIns ?? [],
        deskResetCursor: parsed.deskResetCursor ?? -1,
        workout: {
          ...base.workout,
          ...(parsed.workout ?? {}),
          profile: { ...base.workout.profile, ...(parsed.workout?.profile ?? {}) },
        },
      }));
      return true;
    } catch {
      return false;
    }
  },
};

function setDayFlag(s: AppState, when: number, value: boolean): AppState {
  const date = dateKey(when);
  const existing = s.checkIns.find((c) => c.date === date);
  const record = { ...(existing ?? { date, checkIn: {} }), neckSymptomsIncreased: value };
  return { ...s, checkIns: [...s.checkIns.filter((c) => c.date !== date), record].slice(-MAX_CHECKINS) };
}
