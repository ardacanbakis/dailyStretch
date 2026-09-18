import type { Exercise, RoutineTemplate } from '../types';
import type { Constraints } from './constraints';
import type { EngineContext } from './context';
import { DAY_MS, emptyFeedback } from './context';

export interface ScoreInputs {
  ctx: EngineContext;
  constraints: Constraints;
  template: RoutineTemplate;
  atDesk: boolean;
  availableEquipment: readonly string[];
}

/** Categories used in the last routine and the one before, for variety penalties. */
export function recentCategoryUsage(ctx: EngineContext): { last: Set<string>; prev: Set<string> } {
  const byId = new Map(ctx.exercises.map((e) => [e.id, e]));
  const routines = ctx.recentRoutines.slice(-2).reverse();
  const toCats = (r?: { items: { exerciseId: string }[] }): Set<string> => {
    const set = new Set<string>();
    for (const i of r?.items ?? []) {
      const cat = byId.get(i.exerciseId)?.category;
      if (cat) set.add(cat);
    }
    return set;
  };
  return { last: toCats(routines[0]), prev: toCats(routines[1]) };
}

export function lastDoneMap(ctx: EngineContext): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of ctx.sessions) {
    for (const item of s.items) {
      if (item.outcome !== 'done') continue;
      const prev = map.get(item.exerciseId) ?? 0;
      if (s.endedAt > prev) map.set(item.exerciseId, s.endedAt);
    }
  }
  // Also count generated-but-not-necessarily-completed routines as "seen recently".
  for (const r of ctx.recentRoutines) {
    for (const item of r.items) {
      const prev = map.get(item.exerciseId) ?? 0;
      if (r.createdAt > prev) map.set(item.exerciseId, r.createdAt - 6 * 60 * 60 * 1000);
    }
  }
  return map;
}

/**
 * Deterministic preference score for an exercise. Higher is more likely to be
 * picked. Randomness is added separately by the generator.
 */
export function scoreExercise(
  e: Exercise,
  inputs: ScoreInputs,
  recentCats: { last: Set<string>; prev: Set<string> },
  lastDone: Map<string, number>,
): number {
  const { ctx, constraints, template, atDesk, availableEquipment } = inputs;
  const fb = ctx.feedback[e.id] ?? emptyFeedback();
  let score = 1;

  // Explicit user preferences.
  if (fb.favorite) score += 0.5;
  if (fb.worksWell) score += 0.7;
  if (fb.dontShowOften) score -= 0.9;

  // Helpful reports in the last 30 days: modest, capped boost.
  const monthAgo = ctx.now - 30 * DAY_MS;
  const recentHelpful = fb.helpful.filter((t) => t > monthAgo).length;
  score += Math.min(0.6, recentHelpful * 0.15);

  // Old pain reports (outside the exclusion window) still make us cautious.
  if (fb.painful.length > 0) score -= 0.4;

  // Recency: strongly avoid what was done in the last day or two.
  const last = lastDone.get(e.id);
  if (last) {
    const days = (ctx.now - last) / DAY_MS;
    if (days < 1) score -= 1.3;
    else if (days < 2) score -= 0.8;
    else if (days < 3) score -= 0.45;
    else if (days < 7) score -= 0.15;
  }

  // Category variety across consecutive routines.
  if (recentCats.last.has(e.category)) score -= 0.45;
  else if (recentCats.prev.has(e.category)) score -= 0.2;

  // Adapt to today's body status.
  const hitsSore = e.primary.some((a) => constraints.soreAreas.has(a));
  const hitsTight = e.primary.some((a) => constraints.tightAreas.has(a));
  if (hitsSore) {
    if (e.kind === 'release' || e.kind === 'stretch') score += 0.25;
    if (e.intensity === 'very_gentle') score += 0.25;
    if (e.cervicalLoad === 2) score -= 0.5;
  }
  if (hitsTight && (e.kind === 'mobility' || e.kind === 'stretch')) score += 0.25;

  // Template flavour.
  if (template.tags?.includes('evening')) {
    if (e.kind === 'release' || e.kind === 'stretch') score += 0.3;
    if (e.kind === 'activation') score -= 0.3;
  }
  if (template.family === 'desk' && e.deskFriendly) score += 0.15;
  if (atDesk && e.deskFriendly) score += 0.15;

  // Small nudge toward exercises that use equipment you have available (variety).
  if (e.optionalEquipment?.some((eq) => availableEquipment.includes(eq))) score += 0.1;
  if (e.equipment.length > 0) score += 0.05;

  // Slight anti-monotony: heavily used, non-favourite exercises fade a little.
  if (fb.completed > 15 && !fb.favorite && !fb.worksWell) score -= 0.15;

  // Neck-priority preference: gently favour neck-friendly, conservative options.
  if (ctx.profile.neckPriority && e.cervicalLoad === 1) score += 0.1;

  return score;
}
