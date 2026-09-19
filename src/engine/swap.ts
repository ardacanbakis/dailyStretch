import type { Exercise, Routine, RoutineRequest } from '../types';
import { deriveConstraints, passesConstraints } from './constraints';
import type { EngineContext } from './context';
import { fingerprintOf, resolveTemplate } from './generator';
import { lastDoneMap, recentCategoryUsage, scoreExercise } from './scoring';

const MIN_SCALE = 0.7;
const MAX_SCALE = 1.3;

/**
 * Suitable replacements for the exercise at `index`, ranked by how closely they
 * match the original's target areas and by the user's preferences.
 */
export function getAlternatives(
  routine: Routine,
  index: number,
  request: RoutineRequest,
  ctx: EngineContext,
  count = 4,
): Exercise[] {
  const item = routine.items[index];
  if (!item) return [];
  const byId = new Map(ctx.exercises.map((e) => [e.id, e]));
  const target = byId.get(item.exerciseId);
  if (!target) return [];

  const template = resolveTemplate(request);
  const constraints = deriveConstraints(request, template, ctx);
  const inRoutine = new Set(routine.items.map((i) => i.exerciseId));
  const prevCat = index > 0 ? byId.get(routine.items[index - 1].exerciseId)?.category : undefined;
  const nextCat = index < routine.items.length - 1 ? byId.get(routine.items[index + 1].exerciseId)?.category : undefined;
  const blockAreas = template.blocks.find((b) => b.label === item.block)?.areas ?? [];

  const recentCats = recentCategoryUsage(ctx);
  const lastDone = lastDoneMap(ctx);
  const scoreInputs = { ctx, constraints, template, atDesk: request.atDesk, availableEquipment: request.equipment };

  const ranked = ctx.exercises
    .filter(
      (e) =>
        e.id !== target.id &&
        !inRoutine.has(e.id) &&
        passesConstraints(e, constraints, request) &&
        e.category !== prevCat &&
        e.category !== nextCat,
    )
    .map((e) => {
      const primaryOverlap = e.primary.filter((a) => target.primary.includes(a)).length;
      const secondaryOverlap = e.secondary.filter((a) => target.primary.includes(a)).length + e.primary.filter((a) => target.secondary.includes(a)).length;
      const blockOverlap = e.primary.filter((a) => blockAreas.includes(a)).length;
      const relevance =
        primaryOverlap * 1.0 +
        (e.category === target.category ? 0.9 : 0) +
        secondaryOverlap * 0.3 +
        blockOverlap * 0.4;
      if (relevance === 0) return null;
      const positionMatch = e.positions.some((p) => target.positions.includes(p)) ? 0.3 : 0;
      const kindMatch = e.kind === target.kind ? 0.2 : 0;
      const durationCloseness = Math.max(0, 0.3 - Math.abs(e.durationSec - item.seconds) / 200);
      const pref = scoreExercise(e, scoreInputs, recentCats, lastDone) * 0.5;
      return { e, s: relevance + positionMatch + kindMatch + durationCloseness + pref };
    })
    .filter((x): x is { e: Exercise; s: number } => x !== null)
    .sort((a, b) => b.s - a.s);

  return ranked.slice(0, count).map((r) => r.e);
}

/** Replace the exercise at `index`, keeping the routine's length roughly the same. */
export function applySwap(routine: Routine, index: number, replacement: Exercise): Routine {
  const items = routine.items.map((it, i) => {
    if (i !== index) return it;
    const lo = Math.round(replacement.durationSec * MIN_SCALE);
    const hi = Math.round(replacement.durationSec * MAX_SCALE);
    return { ...it, exerciseId: replacement.id, seconds: Math.max(lo, Math.min(hi, it.seconds)) };
  });
  return { ...routine, items, fingerprint: fingerprintOf(items) };
}

/** Remove the exercise at `index` from the routine. */
export function removeItem(routine: Routine, index: number): Routine {
  const items = routine.items.filter((_, i) => i !== index);
  return { ...routine, items, fingerprint: fingerprintOf(items) };
}
