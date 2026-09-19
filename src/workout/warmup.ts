import { EXERCISES } from '../data/exercises';
import { generateRoutine } from '../engine/generator';
import type { EngineContext } from '../engine/context';
import type { BodyArea, RoutineRequest } from '../types';
import type { WorkoutTemplate } from './templates';

/**
 * Mobility drawn from the stretch library to open and close a workout. Neck and
 * upper-back work stays in the warm-up for every session, since that is the
 * whole reason this app exists.
 */
const WARMUP_AREAS: Record<string, BodyArea[]> = {
  full: ['neck', 'thoracic', 'shoulders', 'hips', 'ankles'],
  upper_body: ['neck', 'thoracic', 'shoulders', 'scapula', 'chest'],
  lower_body: ['hips', 'hip_flexors', 'glutes', 'ankles', 'thoracic'],
  push: ['shoulders', 'scapula', 'chest', 'thoracic'],
  pull: ['thoracic', 'scapula', 'shoulders', 'neck'],
  legs: ['hips', 'hip_flexors', 'glutes', 'ankles'],
  posture: ['neck', 'thoracic', 'scapula', 'chest'],
  core: ['thoracic', 'lower_back', 'hips'],
  arms: ['shoulders', 'wrists', 'forearms'],
  cardio: ['ankles', 'hips', 'thoracic'],
};

function areasFor(template: WorkoutTemplate): BodyArea[] {
  return WARMUP_AREAS[template.id] ?? WARMUP_AREAS[template.family] ?? WARMUP_AREAS.full;
}

/** Build a short mobility warm-up as a list of stretch-library exercise ids. */
export function buildWarmup(template: WorkoutTemplate, ctx: EngineContext, minutes = 3, seed?: number): string[] {
  const areas = areasFor(template);
  const request: RoutineRequest = {
    templateId: 'custom',
    minutes,
    focus: 'full_body',
    intensity: 'gentle',
    position: 'any',
    equipment: ctx.profile.ownedEquipment,
    atDesk: false,
    checkIn: ctx.checkIn,
    seed,
  };
  const routine = generateRoutine(
    { ...request, templateId: 'custom' },
    { ...ctx, exercises: EXERCISES.filter((e) => e.kind === 'mobility' || e.kind === 'activation') },
  );
  const picked = routine.items.map((i) => i.exerciseId);
  if (picked.length > 0) return picked;
  // Fall back to a direct pick if the engine could not fill the request.
  return EXERCISES.filter((e) => e.kind === 'mobility' && e.primary.some((a) => areas.includes(a)))
    .slice(0, 4)
    .map((e) => e.id);
}

/** Build a short cool-down of stretches. */
export function buildCooldown(template: WorkoutTemplate, ctx: EngineContext, minutes = 2, seed?: number): string[] {
  const areas = areasFor(template);
  const pool = EXERCISES.filter(
    (e) => (e.kind === 'stretch' || e.kind === 'release') && e.primary.some((a) => areas.includes(a)),
  );
  const excluded = new Set(
    Object.entries(ctx.feedback)
      .filter(([, f]) => f.excluded)
      .map(([id]) => id),
  );
  const usable = pool.filter((e) => !excluded.has(e.id) && e.equipment.every((q) => ctx.profile.ownedEquipment.includes(q)));
  const list = usable.length ? usable : pool;
  const start = seed ? seed % Math.max(1, list.length) : 0;
  const count = Math.max(2, Math.round((minutes * 60) / 55));
  const out: string[] = [];
  for (let i = 0; i < Math.min(count, list.length); i++) out.push(list[(start + i * 3) % list.length].id);
  return [...new Set(out)];
}
