import type {
  AreaStatus,
  BodyArea,
  CervicalLoad,
  CheckIn,
  Exercise,
  Intensity,
  PositionFilter,
  Region,
  RoutineRequest,
  RoutineTemplate,
} from '../types';
import { INTENSITY_RANK, REGION_AREAS, REGIONS } from '../types';
import { NECK_AREAS, isNeckFocused } from '../data/exercises';
import type { EngineContext } from './context';
import { DAY_MS } from './context';

export interface Constraints {
  intensityCeiling: Intensity;
  maxCervicalLoad: CervicalLoad;
  /** Exercises whose primary areas hit these are removed entirely. */
  avoidAreas: Set<BodyArea>;
  /** Areas that should be treated conservatively. */
  soreAreas: Set<BodyArea>;
  /** Areas the user flagged as tight (get more time and mobility work). */
  tightAreas: Set<BodyArea>;
  /** Neck work is completely off for this routine. */
  neckOff: boolean;
  excludedIds: Set<string>;
  notes: string[];
}

function areasFor(checkIn: CheckIn, status: AreaStatus): Set<BodyArea> {
  const set = new Set<BodyArea>();
  for (const region of REGIONS) {
    if (checkIn[region] === status) {
      for (const a of REGION_AREAS[region]) set.add(a);
    }
  }
  return set;
}

function minIntensity(a: Intensity, b: Intensity): Intensity {
  return INTENSITY_RANK[a] <= INTENSITY_RANK[b] ? a : b;
}

export function deriveConstraints(request: RoutineRequest, template: RoutineTemplate, ctx: EngineContext): Constraints {
  const notes: string[] = [];
  const checkIn = { ...ctx.checkIn, ...request.checkIn };
  const { profile } = ctx;

  let intensityCeiling = minIntensity(request.intensity, template.intensity);
  let maxCervicalLoad: CervicalLoad = template.maxCervicalLoad;
  let neckOff = false;

  const avoidAreas = areasFor(checkIn, 'avoid');
  const soreAreas = areasFor(checkIn, 'sore');
  const tightAreas = areasFor(checkIn, 'tight');

  if (!profile.neckExercisesEnabled) {
    neckOff = true;
    notes.push('Neck exercises are disabled in your settings, so this routine works around the neck.');
  } else if (profile.avoidNeckAdvised) {
    neckOff = true;
    notes.push('Your onboarding answers say direct neck movement should be avoided, so the neck block is replaced with thoracic, shoulder and chest work.');
  } else if (ctx.neckSymptomsIncreasedToday) {
    neckOff = true;
    notes.push('You reported that neck exercises increased symptoms today, so direct neck work is left out.');
  } else if (checkIn.neck === 'avoid') {
    neckOff = true;
    notes.push('Neck marked "avoid today": direct neck movements are excluded in favour of thoracic, shoulder and chest work.');
  } else if (checkIn.neck === 'sore') {
    maxCervicalLoad = Math.min(maxCervicalLoad, 1) as CervicalLoad;
    intensityCeiling = minIntensity(intensityCeiling, 'gentle');
    notes.push('Neck marked "sore": only small-range, conservative neck movements are used.');
  } else if (checkIn.neck === 'tight') {
    notes.push('Neck marked "tight": extra gentle neck, thoracic and shoulder mobility added.');
  }

  if (profile.acuteSymptoms) {
    maxCervicalLoad = Math.min(maxCervicalLoad, 1) as CervicalLoad;
    intensityCeiling = minIntensity(intensityCeiling, 'gentle');
    notes.push('Acute symptoms flag is on: intensity is capped at gentle.');
  }

  if (neckOff) {
    maxCervicalLoad = 0;
    for (const a of NECK_AREAS) avoidAreas.add(a);
  }

  for (const region of REGIONS) {
    const status = checkIn[region];
    if (region === 'neck' || !status) continue;
    if (status === 'avoid') notes.push(`${labelRegion(region)} marked "avoid today": skipped.`);
    if (status === 'sore') notes.push(`${labelRegion(region)} marked "sore": kept to gentle stretches and releases.`);
    if (status === 'tight') notes.push(`${labelRegion(region)} marked "tight": given a little more time.`);
  }
  if (soreAreas.size > 0 && !checkIn.neck) {
    intensityCeiling = intensityCeiling === 'normal' ? 'gentle' : intensityCeiling;
  }

  const excludedIds = new Set<string>();
  const painWindow = (profile.painAvoidDays || 14) * DAY_MS;
  for (const [id, fb] of Object.entries(ctx.feedback)) {
    if (fb.excluded) excludedIds.add(id);
    const lastPain = fb.painful[fb.painful.length - 1];
    if (lastPain && ctx.now - lastPain < painWindow) excludedIds.add(id);
  }

  return { intensityCeiling, maxCervicalLoad, avoidAreas, soreAreas, tightAreas, neckOff, excludedIds, notes };
}

function labelRegion(region: Region): string {
  return region.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export function positionAllowed(e: Exercise, filter: PositionFilter, atDesk: boolean): boolean {
  if (atDesk && !e.deskFriendly) return false;
  switch (filter) {
    case 'seated':
      return e.positions.includes('seated');
    case 'standing':
      return e.positions.includes('standing');
    case 'floor':
      return e.positions.includes('floor');
    case 'desk':
      return e.deskFriendly && (e.positions.includes('seated') || e.positions.includes('standing'));
    case 'mixed':
    case 'any':
    default:
      return true;
  }
}

export function equipmentAvailable(e: Exercise, available: readonly string[]): boolean {
  return e.equipment.every((eq) => available.includes(eq));
}

/** Hard filter: can this exercise appear at all in this routine? */
export function passesConstraints(e: Exercise, c: Constraints, request: RoutineRequest): boolean {
  if (c.excludedIds.has(e.id)) return false;
  if (e.cervicalLoad > c.maxCervicalLoad) return false;
  if (c.neckOff && isNeckFocused(e)) return false;
  if (e.primary.some((a) => c.avoidAreas.has(a))) return false;
  if (INTENSITY_RANK[e.intensity] > INTENSITY_RANK[c.intensityCeiling]) return false;
  if (!positionAllowed(e, request.position, request.atDesk)) return false;
  if (!equipmentAvailable(e, request.equipment)) return false;
  // Sore areas: only gentle stretches / releases / mobility, never activation at normal intensity.
  if (e.primary.some((a) => c.soreAreas.has(a))) {
    if (e.intensity === 'normal') return false;
    if (e.kind === 'activation' && e.intensity !== 'very_gentle') return false;
  }
  return true;
}
