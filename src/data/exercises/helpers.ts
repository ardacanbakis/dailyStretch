import type { Exercise } from '../../types';

type ExerciseInput = Omit<Exercise, 'secondary' | 'perSide' | 'optionalEquipment'> &
  Partial<Pick<Exercise, 'secondary' | 'perSide' | 'optionalEquipment'>>;

/** Small helper that fills optional fields with defaults. */
export function ex(input: ExerciseInput): Exercise {
  return {
    secondary: [],
    perSide: false,
    optionalEquipment: [],
    ...input,
  };
}
