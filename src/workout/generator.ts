import { mulberry32, randomSeed, weightedIndex } from '../engine/rng';
import { equipmentForGear, isAdvancedSkill, isNeckRisky, isStretchEntry, isTimeBased } from './data';
import { getWorkoutTemplate, isCompound, type WorkoutTemplate } from './templates';
import type { PlanItem, SetMode, WorkoutExercise, WorkoutPlan, WorkoutState } from './types';

/** Seconds one prescribed exercise consumes, including its rest between sets. */
function itemSeconds(p: { sets: number; target: number; mode: SetMode; restSec: number }): number {
  const work = p.sets * (p.mode === 'time' ? p.target : 35);
  return work + (p.sets - 1) * p.restSec;
}

export interface WorkoutRequest {
  templateId: string;
  minutes: number;
  gear: string[];
  seed?: number;
  /** Override the state's neck-friendly setting. */
  neckFriendly?: boolean;
}

export interface WorkoutContext {
  exercises: WorkoutExercise[];
  state: WorkoutState;
  now: number;
}

/** Default sets, reps and rest for an exercise. */
export function prescriptionFor(e: WorkoutExercise, restSec: number): { sets: number; target: number; mode: SetMode; restSec: number } {
  if (e.bodyPart === 'cardio') return { sets: 3, target: 60, mode: 'time', restSec: 30 };
  if (isTimeBased(e)) return { sets: 3, target: 40, mode: 'time', restSec: Math.max(30, restSec - 15) };
  if (e.target === 'abs' || e.target === 'calves') return { sets: 3, target: 15, mode: 'reps', restSec: Math.max(30, restSec - 20) };
  if (isCompound(e)) return { sets: 4, target: 8, mode: 'reps', restSec: restSec + 15 };
  return { sets: 3, target: 12, mode: 'reps', restSec };
}

function matchesBlock(e: WorkoutExercise, block: { bodyParts?: string[]; targets?: string[] }): boolean {
  if (block.targets && block.targets.includes(e.target)) return true;
  if (block.bodyParts && block.bodyParts.includes(e.bodyPart)) return true;
  return false;
}

/** Score an exercise for selection. Higher is more likely. */
function score(e: WorkoutExercise, ctx: WorkoutContext, lastUsed: Map<string, number>, compoundWanted: boolean): number {
  let s = 1;
  if (ctx.state.favorites.includes(e.id)) s += 0.8;
  const last = lastUsed.get(e.id);
  if (last) {
    const days = (ctx.now - last) / 86400000;
    if (days < 2) s -= 1.2;
    else if (days < 5) s -= 0.6;
    else if (days < 10) s -= 0.2;
  }
  if (compoundWanted && isCompound(e)) s += 0.7;
  if (!compoundWanted && isCompound(e)) s -= 0.2;
  // Prefer exercises the user has a weight history for: they are familiar.
  if (ctx.state.lastWeight[e.id] !== undefined) s += 0.25;
  return s;
}

function lastUsedMap(state: WorkoutState): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of state.sessions) {
    for (const item of s.items) {
      if (item.skipped) continue;
      const prev = m.get(item.exerciseId) ?? 0;
      if (s.endedAt > prev) m.set(item.exerciseId, s.endedAt);
    }
  }
  for (const p of state.recentPlans) {
    for (const item of p.items) {
      const prev = m.get(item.exerciseId) ?? 0;
      if (p.createdAt > prev) m.set(item.exerciseId, p.createdAt - 6 * 3600 * 1000);
    }
  }
  return m;
}

export function generateWorkout(req: WorkoutRequest, ctx: WorkoutContext): WorkoutPlan {
  const template = getWorkoutTemplate(req.templateId) ?? getWorkoutTemplate('full_body')!;
  const notes: string[] = [];
  const { profile } = ctx.state;
  const neckFriendly = req.neckFriendly ?? profile.neckFriendly;
  const allowed = equipmentForGear(req.gear);
  const excluded = new Set(ctx.state.excluded);

  let pool = ctx.exercises.filter((e) => {
    if (excluded.has(e.id)) return false;
    if (template.bodyweightOnly && e.equipment !== 'body weight') return false;
    if (!allowed.has(e.equipment)) return false;
    if (neckFriendly && isNeckRisky(e)) return false;
    if (isAdvancedSkill(e)) return false;
    if (isStretchEntry(e)) return false;
    return true;
  });

  if (pool.length < 8) {
    // Not enough with the chosen gear: fall back to bodyweight so a session is still possible.
    pool = ctx.exercises.filter(
      (e) =>
        !excluded.has(e.id) &&
        e.equipment === 'body weight' &&
        !isAdvancedSkill(e) &&
        !isStretchEntry(e) &&
        !(neckFriendly && isNeckRisky(e)),
    );
    notes.push('Not many exercises match the selected equipment, so bodyweight options were added.');
  }
  if (neckFriendly) notes.push('Neck-friendly mode is on: behind-the-neck and upright-row style movements are left out.');

  const mobilitySec = (profile.includeWarmup ? 180 : 0) + (profile.includeCooldown ? 120 : 0);
  const budgetSec = Math.max(300, req.minutes * 60 - mobilitySec);
  const MAX_EXERCISES = 12;
  const MIN_EXERCISES = 3;

  // Per-block quota, proportional to its weight, used as an upper bound.
  const sumW = template.blocks.reduce((s, b) => s + b.weight, 0);
  const quota = template.blocks.map((b) => Math.max(1, Math.round((b.weight / sumW) * MAX_EXERCISES)));

  const rng = mulberry32(req.seed ?? randomSeed());
  const lastUsed = lastUsedMap(ctx.state);
  const used = new Set<string>();
  const picked: { item: PlanItem; order: number; seconds: number }[] = [];
  const takenPerBlock = template.blocks.map(() => 0);
  let spent = 0;

  // Round-robin across blocks so the session stays balanced however long it is,
  // adding exercises until the time budget is used up.
  for (let round = 0; round < MAX_EXERCISES; round++) {
    let addedThisRound = false;
    for (let bi = 0; bi < template.blocks.length; bi++) {
      if (picked.length >= MAX_EXERCISES) break;
      if (takenPerBlock[bi] >= quota[bi]) continue;
      const block = template.blocks[bi];
      const compoundWanted = Boolean(block.compound) && takenPerBlock[bi] === 0;
      const candidates = pool.filter((e) => !used.has(e.id) && matchesBlock(e, block));
      if (candidates.length === 0) continue;

      const ranked = candidates
        .map((e) => ({ e, s: score(e, ctx, lastUsed, compoundWanted) + rng() * 0.5 }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 8);
      const chosen = ranked[weightedIndex(ranked.map((r) => Math.exp(r.s * 1.5)), rng)].e;
      const p = prescriptionFor(chosen, profile.restSec);
      const seconds = itemSeconds(p);
      // Stop once the budget is spent, unless the session is still too short to be worth doing.
      if (spent + seconds > budgetSec && picked.length >= MIN_EXERCISES) continue;

      used.add(chosen.id);
      takenPerBlock[bi]++;
      spent += seconds;
      addedThisRound = true;
      picked.push({
        item: {
          exerciseId: chosen.id,
          block: block.label,
          sets: p.sets,
          target: p.target,
          mode: p.mode,
          restSec: p.restSec,
          weight: ctx.state.lastWeight[chosen.id],
        },
        order: bi,
        seconds,
      });
    }
    if (!addedThisRound) break;
    if (spent >= budgetSec && picked.length >= MIN_EXERCISES) break;
  }

  // Group by block for display while keeping selection order inside each block.
  const items: PlanItem[] = picked
    .map((p, i) => ({ ...p, i }))
    .sort((a, b) => a.order - b.order || a.i - b.i)
    .map((p) => p.item);

  if (items.length === 0) notes.push('No exercises matched. Try adding equipment in Settings.');

  const estMinutes = (items.reduce((s, i) => s + itemSeconds(i), 0) + mobilitySec) / 60;

  return {
    id: `wp_${Date.now().toString(36)}_${Math.floor(rng() * 1e9).toString(36)}`,
    templateId: template.id,
    name: template.name,
    createdAt: ctx.now,
    minutes: Math.round(estMinutes),
    items,
    notes,
    warmup: [],
    cooldown: [],
  };
}

/** Suitable swaps for one item: same block, similar target, respecting gear. */
export function workoutAlternatives(
  plan: WorkoutPlan,
  index: number,
  req: WorkoutRequest,
  ctx: WorkoutContext,
  count = 5,
): WorkoutExercise[] {
  const item = plan.items[index];
  if (!item) return [];
  const byId = new Map(ctx.exercises.map((e) => [e.id, e]));
  const target = byId.get(item.exerciseId);
  if (!target) return [];
  const allowed = equipmentForGear(req.gear);
  const excluded = new Set(ctx.state.excluded);
  const inPlan = new Set(plan.items.map((i) => i.exerciseId));
  const neckFriendly = req.neckFriendly ?? ctx.state.profile.neckFriendly;

  return ctx.exercises
    .filter(
      (e) =>
        e.id !== target.id &&
        !inPlan.has(e.id) &&
        !excluded.has(e.id) &&
        allowed.has(e.equipment) &&
        !isAdvancedSkill(e) &&
        !isStretchEntry(e) &&
        !(neckFriendly && isNeckRisky(e)) &&
        (e.target === target.target || e.bodyPart === target.bodyPart),
    )
    .map((e) => {
      let s = e.target === target.target ? 2 : 1;
      if (isCompound(e) === isCompound(target)) s += 0.6;
      if (e.equipment === target.equipment) s += 0.4;
      if (ctx.state.favorites.includes(e.id)) s += 0.5;
      if (ctx.state.lastWeight[e.id] !== undefined) s += 0.2;
      return { e, s };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .map((r) => r.e);
}

export function planVolumeEstimate(plan: WorkoutPlan): number {
  return plan.items.reduce((s, i) => s + i.sets, 0);
}

export function templateForTime(minutes: number, templates: WorkoutTemplate[]): WorkoutTemplate[] {
  return templates.filter((t) => minutes >= t.minMinutes - 2 && minutes <= t.maxMinutes + 5);
}
