import type { FigureAnimation } from '../model';
import { NECK_SHOULDER_ANIMS } from './neckShoulder';
import { TORSO_WRIST_ANIMS } from './torsoWrist';
import { LOWER_BODY_ANIMS } from './lowerBody';

export const ANIMATIONS: Record<string, FigureAnimation> = {
  ...NECK_SHOULDER_ANIMS,
  ...TORSO_WRIST_ANIMS,
  ...LOWER_BODY_ANIMS,
};
