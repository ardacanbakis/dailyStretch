import type { CheckIn, Intensity, Routine, RoutineFamily, RoutineRequest, RoutineTemplate } from '../types';
import { DESK_RESET_ROTATION, TEMPLATES, getTemplate } from '../data/templates';
import type { EngineContext } from './context';
import { generateRoutine } from './generator';
import { mulberry32, randomSeed, weightedIndex } from './rng';

export interface SurpriseOptions {
  minutes?: number;
  atDesk?: boolean;
  equipment?: RoutineRequest['equipment'];
  position?: RoutineRequest['position'];
  checkIn?: CheckIn;
  seed?: number;
}

function neckIsOff(ctx: EngineContext, checkIn: CheckIn): boolean {
  return (
    !ctx.profile.neckExercisesEnabled ||
    ctx.profile.avoidNeckAdvised ||
    ctx.neckSymptomsIncreasedToday ||
    checkIn.neck === 'avoid'
  );
}

/**
 * Choose a template for "Surprise Me" using body status, available time,
 * recent history and the neck-priority preference. Rules, not pure chance.
 */
export function pickSurpriseTemplate(ctx: EngineContext, opts: SurpriseOptions = {}): RoutineTemplate {
  const checkIn = { ...ctx.checkIn, ...(opts.checkIn ?? {}) };
  const minutes = opts.minutes ?? ctx.profile.defaultMinutes;
  const atDesk = opts.atDesk ?? ctx.profile.worksAtDesk;
  const rng = mulberry32(opts.seed ?? randomSeed());
  const neckOff = neckIsOff(ctx, checkIn);

  const weights: Record<RoutineFamily, number> = {
    neck: neckOff ? 0 : ctx.profile.neckPriority ? 4 : 2,
    full: 3,
    upper: 2,
    lower: 1,
    desk: atDesk ? 2 : 0.5,
    custom: 0,
    surprise: 0,
  };

  if (checkIn.neck === 'tight') weights.neck += 2;
  if (checkIn.neck === 'sore') weights.neck += 1;
  if (checkIn.shoulders === 'tight' || checkIn.upper_back === 'tight') {
    weights.upper += 1.5;
    weights.neck += 0.5;
  }
  if (checkIn.hips === 'tight' || checkIn.legs === 'tight') weights.lower += 2.5;
  if (checkIn.lower_back === 'tight') weights.lower += 1;
  if (checkIn.wrists === 'tight') weights.desk += 1;
  if (checkIn.hips === 'avoid' && checkIn.legs === 'avoid') weights.lower = 0;

  if (minutes <= 5) {
    weights.desk *= 2.5;
    weights.lower *= 0.4;
  } else if (minutes >= 10) {
    weights.desk = 0;
  }
  if (minutes >= 15) weights.full += 1.5;

  // Families whose templates cannot reasonably fit the available time are out.
  for (const f of Object.keys(weights) as RoutineFamily[]) {
    const feasible = TEMPLATES.some((t) => t.family === f && minutes >= t.minMinutes - 1 && minutes <= t.maxMinutes + 3);
    if (!feasible) weights[f] = 0;
  }
  if (Object.values(weights).every((w) => w <= 0)) weights.full = 1;

  // Avoid repeating the same family two days running.
  const recentFamilies = ctx.recentRoutines.slice(-2).map((r) => r.family);
  for (const f of recentFamilies) weights[f] *= 0.5;

  const families: RoutineFamily[] = ['neck', 'full', 'upper', 'lower', 'desk'];
  const family = families[weightedIndex(families.map((f) => weights[f]), rng)];

  let pool = TEMPLATES.filter((t) => t.family === family);
  if (family === 'desk') {
    const rotated = DESK_RESET_ROTATION.map((id) => getTemplate(id)!).filter(Boolean);
    pool = rotated;
  }
  if (checkIn.neck === 'sore') {
    const gentle = pool.filter((t) => t.maxCervicalLoad <= 1);
    if (gentle.length) pool = gentle;
  }
  if (atDesk) {
    const deskable = pool.filter((t) => t.position === 'desk' || t.position === 'any');
    if (deskable.length) pool = deskable;
  }
  const recentIds = new Set(ctx.recentRoutines.slice(-5).map((r) => r.templateId));
  const fresh = pool.filter((t) => !recentIds.has(t.id));
  if (fresh.length) pool = fresh;
  // Prefer templates whose natural range includes the requested time.
  const fitting = pool.filter((t) => minutes >= t.minMinutes - 1 && minutes <= t.maxMinutes + 2);
  if (fitting.length) pool = fitting;

  return pool[Math.floor(rng() * pool.length)] ?? getTemplate('full_standard')!;
}

export function buildSurpriseRequest(ctx: EngineContext, opts: SurpriseOptions = {}): RoutineRequest {
  const checkIn = { ...ctx.checkIn, ...(opts.checkIn ?? {}) };
  const template = pickSurpriseTemplate(ctx, opts);
  const minutes = opts.minutes ?? ctx.profile.defaultMinutes;
  const anySore = Object.values(checkIn).some((s) => s === 'sore');
  let intensity: Intensity = ctx.profile.defaultIntensity;
  if (anySore && intensity === 'normal') intensity = 'gentle';
  const atDesk = opts.atDesk ?? ctx.profile.worksAtDesk;
  return {
    templateId: template.id,
    minutes: Math.max(template.minMinutes, Math.min(template.maxMinutes, minutes)),
    intensity,
    position: opts.position ?? (atDesk ? 'desk' : template.position),
    equipment: opts.equipment ?? ctx.profile.ownedEquipment,
    atDesk,
    checkIn,
    seed: opts.seed,
  };
}

export function generateSurprise(ctx: EngineContext, opts: SurpriseOptions = {}): { request: RoutineRequest; routine: Routine } {
  const request = buildSurpriseRequest(ctx, opts);
  const routine = generateRoutine(request, ctx);
  return { request, routine: { ...routine, family: 'surprise', name: `Surprise: ${routine.name}` } };
}

/** Next Quick Desk Reset template in the rotation, skipping ones the check-in rules out. */
export function nextDeskReset(cursor: number, checkIn: CheckIn, ctx: EngineContext): { template: RoutineTemplate; cursor: number } {
  const neckOff = neckIsOff(ctx, checkIn);
  for (let step = 1; step <= DESK_RESET_ROTATION.length; step++) {
    const idx = (cursor + step) % DESK_RESET_ROTATION.length;
    const t = getTemplate(DESK_RESET_ROTATION[idx])!;
    if (t.id === 'desk_wrists_shoulders' && checkIn.wrists === 'avoid') continue;
    if (t.id === 'desk_hips_upper_back' && checkIn.hips === 'avoid') continue;
    if (t.id === 'desk_neck_shoulders' && neckOff && checkIn.shoulders === 'avoid') continue;
    return { template: t, cursor: idx };
  }
  return { template: getTemplate('desk_mixed')!, cursor };
}
