import type { BodyArea, Exercise } from '../../types';
import { NECK_EXERCISES } from './neck';
import { SHOULDER_EXERCISES } from './shoulders';
import { CHEST_THORACIC_EXERCISES } from './chestThoracic';
import { WRIST_EXERCISES } from './wrists';
import { LOWER_BACK_HIP_EXERCISES } from './lowerBackHips';
import { LEG_EXERCISES } from './legs';

export const EXERCISES: Exercise[] = [
  ...NECK_EXERCISES,
  ...SHOULDER_EXERCISES,
  ...CHEST_THORACIC_EXERCISES,
  ...WRIST_EXERCISES,
  ...LOWER_BACK_HIP_EXERCISES,
  ...LEG_EXERCISES,
];

const byId = new Map<string, Exercise>(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return byId.get(id);
}

export function exercisesForArea(area: BodyArea): Exercise[] {
  return EXERCISES.filter((e) => e.primary.includes(area));
}

/** Areas that count as "neck-related" for prioritisation and safety. */
export const NECK_AREAS: BodyArea[] = ['neck', 'upper_trap', 'levator'];

export function isNeckFocused(e: Exercise): boolean {
  return e.primary.some((a) => NECK_AREAS.includes(a));
}

/** Suitable when the neck is sensitive: no direct cervical loading. */
export function isNeckFriendly(e: Exercise): boolean {
  return e.cervicalLoad === 0;
}
