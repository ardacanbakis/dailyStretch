import type { AppState, Exercise, Profile, Routine, RoutineRequest } from '../../types';
import { EXERCISES } from '../../data/exercises';
import type { EngineContext } from '../context';

export const NOW = Date.UTC(2026, 8, 18, 9, 0, 0);

export function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    onboarded: true,
    name: 'Test',
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
    ...overrides,
  };
}

export function ctx(overrides: Partial<EngineContext> = {}, exercises: Exercise[] = EXERCISES): EngineContext {
  return {
    exercises,
    profile: profile(),
    feedback: {},
    recentRoutines: [],
    sessions: [],
    checkIn: {},
    neckSymptomsIncreasedToday: false,
    now: NOW,
    ...overrides,
  };
}

export function request(overrides: Partial<RoutineRequest> = {}): RoutineRequest {
  return {
    templateId: 'full_standard',
    minutes: 10,
    intensity: 'normal',
    position: 'any',
    equipment: ['chair', 'wall', 'mat'],
    atDesk: false,
    checkIn: {},
    seed: 42,
    ...overrides,
  };
}

export function routineOf(ids: string[], templateId = 'full_standard', createdAt = NOW - 24 * 3600 * 1000): Routine {
  return {
    id: 'r_' + ids.join('_').slice(0, 20),
    templateId,
    family: 'full',
    name: 'Prev',
    createdAt,
    requestedMinutes: 10,
    items: ids.map((exerciseId) => ({ exerciseId, seconds: 60, block: 'x' })),
    notes: [],
    fingerprint: [...ids].sort().join('|'),
  };
}

export function emptyState(): AppState {
  return {
    version: 1,
    profile: profile(),
    feedback: {},
    sessions: [],
    recentRoutines: [],
    checkIns: [],
    deskResetCursor: -1,
  };
}
