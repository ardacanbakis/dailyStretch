import type {
  BodyArea,
  Exercise,
  Routine,
  RoutineItem,
  RoutineRequest,
  RoutineTemplate,
} from '../types';
import { customTemplate, fullBodyTemplateFor, getTemplate } from '../data/templates';
import { NECK_AREAS } from '../data/exercises';
import { deriveConstraints, passesConstraints, type Constraints } from './constraints';
import { lastDoneMap, recentCategoryUsage, scoreExercise } from './scoring';
import { mulberry32, randomSeed, weightedIndex, type Rng } from './rng';
import type { EngineContext } from './context';

/** Seconds allowed between exercises to read the card and change position. */
export const TRANSITION_SEC = 8;
/** Blocks shorter than this cannot fit an exercise and are merged away. */
const MIN_BLOCK_SEC = 35;
/** Per-category cap so one movement pattern never dominates. */
const MAX_PER_CATEGORY = 2;
/** Per-area cap on primary-target count to avoid excessive volume for one area. */
const MAX_PER_AREA = 5;
const MIN_SCALE = 0.7;
const MAX_SCALE = 1.3;

export interface PlannedBlock {
  label: string;
  areas: BodyArea[];
  seconds: number;
}

export function resolveTemplate(request: RoutineRequest): RoutineTemplate {
  if (request.templateId === 'custom') return customTemplate(request.focus ?? 'full_body', request.minutes);
  return getTemplate(request.templateId) ?? fullBodyTemplateFor(request.minutes);
}

interface WorkingBlock {
  label: string;
  areas: BodyArea[];
  weight: number;
  minSec: number;
}

/**
 * Turn the template's relative block weights into concrete seconds for the
 * requested duration, adapting to today's check-in and the safety constraints.
 */
export function planBlocks(
  template: RoutineTemplate,
  minutes: number,
  constraints: Constraints,
  ctx: EngineContext,
  notes: string[] = [],
): PlannedBlock[] {
  const totalSec = Math.max(60, Math.round(minutes * 60));

  let blocks: WorkingBlock[] = template.blocks.map((b) => ({
    label: b.label,
    areas: [...b.areas],
    weight: b.weight,
    minSec: b.minSec ?? 0,
  }));

  // Remove avoided areas; track how much neck weight we lose so it can be redirected.
  let removedNeckWeight = 0;
  blocks = blocks
    .map((b) => {
      const kept = b.areas.filter((a) => !constraints.avoidAreas.has(a));
      const hadNeck = b.areas.some((a) => NECK_AREAS.includes(a));
      if (kept.length === 0) {
        if (hadNeck) removedNeckWeight += b.weight;
        return null;
      }
      const lostShare = 1 - kept.length / b.areas.length;
      if (hadNeck && kept.every((a) => !NECK_AREAS.includes(a))) removedNeckWeight += b.weight * lostShare;
      return { ...b, areas: kept, minSec: hadNeck && constraints.neckOff ? 0 : b.minSec };
    })
    .filter((b): b is WorkingBlock => b !== null);

  if (constraints.neckOff && removedNeckWeight > 0) {
    const around: BodyArea[] = ['thoracic', 'shoulders', 'scapula', 'chest'].filter(
      (a) => !constraints.avoidAreas.has(a as BodyArea),
    ) as BodyArea[];
    if (around.length > 0) {
      blocks.unshift({ label: 'Around the neck', areas: around, weight: removedNeckWeight, minSec: 0 });
    }
  }

  // Neck-priority injection for templates that should include neck work but currently do not.
  const hasNeck = blocks.some((b) => b.areas.some((a) => NECK_AREAS.includes(a)));
  if (template.neckPriority && ctx.profile.neckPriority && !constraints.neckOff && !hasNeck) {
    blocks.unshift({ label: 'Neck', areas: [...NECK_AREAS], weight: 0, minSec: Math.min(90, Math.round(totalSec * 0.15)) });
    notes.push('Added a short neck block because neck health is your priority.');
  }

  // Check-in modifiers.
  for (const b of blocks) {
    const tight = b.areas.some((a) => constraints.tightAreas.has(a));
    const sore = b.areas.some((a) => constraints.soreAreas.has(a));
    const isNeck = b.areas.some((a) => NECK_AREAS.includes(a));
    const neckSupport = b.areas.some((a) => a === 'thoracic' || a === 'shoulders' || a === 'scapula');
    if (tight) b.weight *= 1.4;
    if (constraints.tightAreas.has('neck') && neckSupport && !isNeck) b.weight *= 1.2;
    if (sore && !isNeck) b.weight *= 0.85;
  }

  // Convert weights to seconds while honouring minimums.
  const sumW = blocks.reduce((s, b) => s + b.weight, 0) || 1;
  let planned = blocks.map((b) => ({ ...b, seconds: (b.weight / sumW) * totalSec }));
  for (let pass = 0; pass < 3; pass++) {
    const fixed = planned.filter((b) => b.seconds < b.minSec);
    for (const f of fixed) f.seconds = f.minSec;
    const fixedSec = planned.filter((b) => b.seconds <= b.minSec).reduce((s, b) => s + b.seconds, 0);
    const flexible = planned.filter((b) => b.seconds > b.minSec);
    const flexibleSec = flexible.reduce((s, b) => s + b.seconds, 0) || 1;
    const room = Math.max(0, totalSec - fixedSec);
    for (const b of flexible) b.seconds = (b.seconds / flexibleSec) * room;
  }

  // Merge blocks that are too small to hold an exercise into their neighbour.
  const result: PlannedBlock[] = [];
  for (const b of planned) {
    if (b.seconds < MIN_BLOCK_SEC && result.length > 0) {
      result[result.length - 1].seconds += b.seconds;
      continue;
    }
    result.push({ label: b.label, areas: b.areas, seconds: b.seconds });
  }
  if (result.length > 1 && result[0].seconds < MIN_BLOCK_SEC) {
    result[1].seconds += result[0].seconds;
    result.shift();
  }
  return result.map((b) => ({ ...b, seconds: Math.round(b.seconds) }));
}

function categoryOf(exercises: Map<string, Exercise>, item: RoutineItem): string {
  return exercises.get(item.exerciseId)?.category ?? '';
}

function fillRoutine(
  blocks: PlannedBlock[],
  candidates: Exercise[],
  scores: Map<string, number>,
  rng: Rng,
  ensureNeck: boolean,
): RoutineItem[] {
  const byId = new Map(candidates.map((e) => [e.id, e]));
  const used = new Set<string>();
  const catCount = new Map<string, number>();
  const areaCount = new Map<BodyArea, number>();
  const items: RoutineItem[] = [];

  let neckPending = ensureNeck;
  for (const block of blocks) {
    let remaining = block.seconds;
    let guard = 0;
    const blockHasNeck = block.areas.some((a) => NECK_AREAS.includes(a));
    while (remaining >= 25 && guard++ < 14) {
      const lastCat = items.length ? categoryOf(byId, items[items.length - 1]) : '';
      const eligible = (e: Exercise) =>
        !used.has(e.id) &&
        e.category !== lastCat &&
        (catCount.get(e.category) ?? 0) < MAX_PER_CATEGORY &&
        e.primary.every((a) => (areaCount.get(a) ?? 0) < MAX_PER_AREA) &&
        Math.round(e.durationSec * MIN_SCALE) + TRANSITION_SEC <= remaining + 12;

      let pool = candidates.filter((e) => eligible(e) && e.primary.some((a) => block.areas.includes(a)));
      if (neckPending && blockHasNeck) {
        // Neck priority: the first pick in the first neck-containing block is a neck exercise.
        const neckPool = pool.filter((e) => e.primary.some((a) => NECK_AREAS.includes(a)));
        if (neckPool.length > 0) pool = neckPool;
        neckPending = false;
      }
      if (pool.length === 0) {
        pool = candidates.filter((e) => eligible(e) && e.secondary.some((a) => block.areas.includes(a)));
      }
      if (pool.length === 0) break;

      const ranked = pool
        .map((e) => ({ e, s: (scores.get(e.id) ?? 0) + rng() * 0.4 }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 6);
      const idx = weightedIndex(
        ranked.map((r) => Math.exp(r.s * 1.6)),
        rng,
      );
      const chosen = ranked[idx].e;

      const base = chosen.durationSec;
      let sec = Math.min(base, Math.max(Math.round(base * MIN_SCALE), remaining - TRANSITION_SEC));
      // If what would be left over is too small for another exercise, absorb it (within limits).
      const leftover = remaining - sec - TRANSITION_SEC;
      if (leftover > 0 && leftover < 25) {
        sec = Math.min(Math.round(base * MAX_SCALE), sec + leftover);
      }
      sec = Math.max(20, sec);

      items.push({ exerciseId: chosen.id, seconds: sec, block: block.label });
      used.add(chosen.id);
      catCount.set(chosen.category, (catCount.get(chosen.category) ?? 0) + 1);
      for (const a of chosen.primary) areaCount.set(a, (areaCount.get(a) ?? 0) + 1);
      remaining -= sec + TRANSITION_SEC;
    }
  }
  return items;
}

/** Nudge item durations so the routine lands close to the requested length. */
function fitToTarget(items: RoutineItem[], exercises: Map<string, Exercise>, targetSec: number): void {
  if (items.length === 0) return;
  const total = items.reduce((s, i) => s + i.seconds, 0) + TRANSITION_SEC * (items.length - 1);
  let diff = targetSec - total;
  if (Math.abs(diff) < 5) return;
  // Distribute across items proportionally within their allowed scaling range.
  for (let pass = 0; pass < 3 && Math.abs(diff) >= 3; pass++) {
    const share = diff / items.length;
    for (const item of items) {
      const base = exercises.get(item.exerciseId)?.durationSec ?? item.seconds;
      const lo = Math.round(base * MIN_SCALE);
      const hi = Math.round(base * MAX_SCALE);
      const next = Math.max(lo, Math.min(hi, Math.round(item.seconds + share)));
      diff -= next - item.seconds;
      item.seconds = next;
    }
  }
}

function orderItems(items: RoutineItem[], exercises: Map<string, Exercise>, blocks: PlannedBlock[]): RoutineItem[] {
  if (items.length < 2) return items;

  // 1. Within the first block, gentler (lower cervical load, mobility) items lead.
  const firstLabel = blocks[0]?.label;
  const first = items.filter((i) => i.block === firstLabel);
  const rest = items.filter((i) => i.block !== firstLabel);
  first.sort((a, b) => {
    const ea = exercises.get(a.exerciseId)!;
    const eb = exercises.get(b.exerciseId)!;
    return ea.cervicalLoad - eb.cervicalLoad || (ea.kind === 'mobility' ? -1 : 0) - (eb.kind === 'mobility' ? -1 : 0);
  });
  let ordered = [...first, ...rest];

  // 2. Floor-only exercises move to the end so you only get down once.
  const floorOnly = (i: RoutineItem) => {
    const e = exercises.get(i.exerciseId)!;
    return e.positions.length === 1 && e.positions[0] === 'floor';
  };
  ordered = [...ordered.filter((i) => !floorOnly(i)), ...ordered.filter(floorOnly)];

  // 3. Never place two exercises of the same category next to each other.
  for (let i = 1; i < ordered.length; i++) {
    if (categoryOf(exercises, ordered[i]) !== categoryOf(exercises, ordered[i - 1])) continue;
    for (let j = i + 1; j < ordered.length; j++) {
      const cj = categoryOf(exercises, ordered[j]);
      const nextCat = i + 1 < ordered.length ? categoryOf(exercises, ordered[i + 1]) : '';
      if (cj !== categoryOf(exercises, ordered[i - 1]) && cj !== nextCat) {
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
        break;
      }
    }
  }
  return ordered;
}

export function jaccard(a: readonly string[], b: readonly string[]): number {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size === 0 && sb.size === 0) return 1;
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  return inter / (sa.size + sb.size - inter);
}

export function fingerprintOf(items: readonly RoutineItem[]): string {
  return items
    .map((i) => i.exerciseId)
    .sort()
    .join('|');
}

export function routineDurationSec(routine: Pick<Routine, 'items'>): number {
  if (routine.items.length === 0) return 0;
  return routine.items.reduce((s, i) => s + i.seconds, 0) + TRANSITION_SEC * (routine.items.length - 1);
}

function newId(prefix: string, rng: Rng): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(rng() * 1e9).toString(36)}`;
}

/**
 * Generate a routine for the request. Deterministic for a given seed and context.
 */
export function generateRoutine(request: RoutineRequest, ctx: EngineContext): Routine {
  const template = resolveTemplate(request);
  const constraints = deriveConstraints(request, template, ctx);
  const notes = [...constraints.notes];
  const blocks = planBlocks(template, request.minutes, constraints, ctx, notes);
  const candidates = ctx.exercises.filter((e) => passesConstraints(e, constraints, request));
  const byId = new Map(ctx.exercises.map((e) => [e.id, e]));

  const recentCats = recentCategoryUsage(ctx);
  const lastDone = lastDoneMap(ctx);
  const scoreInputs = {
    ctx,
    constraints,
    template,
    atDesk: request.atDesk,
    availableEquipment: request.equipment,
  };
  const scores = new Map(candidates.map((e) => [e.id, scoreExercise(e, scoreInputs, recentCats, lastDone)]));

  const seed = request.seed ?? randomSeed();
  const ensureNeck = template.neckPriority && ctx.profile.neckPriority && !constraints.neckOff;
  const recent = ctx.recentRoutines.slice(-8);
  const targetSec = Math.round(request.minutes * 60);

  let best: RoutineItem[] = [];
  let bestSim = Number.POSITIVE_INFINITY;
  for (let attempt = 0; attempt < 6; attempt++) {
    const rng = mulberry32(seed + attempt * 7919);
    const items = fillRoutine(blocks, candidates, scores, rng, ensureNeck);
    const ids = items.map((i) => i.exerciseId);
    let sim = 0;
    for (const r of recent) {
      const weight = r.templateId === template.id ? 1 : 0.6;
      sim = Math.max(sim, weight * jaccard(ids, r.items.map((i) => i.exerciseId)));
    }
    if (items.length > 0 && sim < bestSim) {
      best = items;
      bestSim = sim;
    }
    if (best.length > 0 && bestSim <= 0.45) break;
  }

  fitToTarget(best, byId, targetSec);
  const ordered = orderItems(best, byId, blocks);
  const rng = mulberry32(seed);

  if (ordered.length === 0) {
    notes.push('No exercises match the current filters. Try allowing more positions or equipment.');
  } else if (bestSim > 0.7) {
    notes.push('Few alternatives were available, so this routine is similar to a recent one.');
  }

  return {
    id: newId('rt', rng),
    templateId: template.id,
    family: template.family,
    name: template.name,
    createdAt: ctx.now,
    requestedMinutes: request.minutes,
    items: ordered,
    notes,
    fingerprint: fingerprintOf(ordered),
  };
}
