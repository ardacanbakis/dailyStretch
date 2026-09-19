import { GROUND, SEG, STAND_Y, type Limb, type Pose, type Prop } from './model';

/**
 * Base body positions. Each returns a Pose that can be spread and overridden.
 * All angles follow the model convention: 0 = up, 90 = screen-right.
 */

const FLOOR: Prop[] = ['floor'];
const MAT: Prop[] = ['mat'];

/** Standing, side view, facing screen-right. */
export function stand(p: Pose = {}): Pose {
  return { view: 'side', x: 96, y: STAND_Y, facing: 1, a1: [4, 6], a2: [-2, 6], l1: [0, 2], l2: [0, 2], props: FLOOR, ...p };
}

/** Standing, front view. */
export function standFront(p: Pose = {}): Pose {
  return { view: 'front', x: 100, y: STAND_Y, a1: [6, 4], a2: [6, 4], l1: [5, 0], l2: [5, 0], props: FLOOR, ...p };
}

/** Seated on a chair, side view, facing screen-right. */
export function sit(p: Pose = {}): Pose {
  return {
    view: 'side',
    x: 84,
    y: 136,
    facing: 1,
    a1: [12, 30],
    a2: [8, 30],
    l1: [88, 86],
    l2: [88, 86],
    props: ['floor', 'chair'],
    ...p,
  };
}

/** Seated on a chair, front view. */
export function sitFront(p: Pose = {}): Pose {
  return { view: 'front', x: 100, y: 132, a1: [12, 22], a2: [12, 22], l1: [18, 84, 62], l2: [18, 84, 62], props: ['floor', 'chair'], ...p };
}

/** Lying on the back, head toward screen-left. */
export function supine(p: Pose = {}): Pose {
  return {
    view: 'side',
    body: -90,
    x: 128,
    y: GROUND - 9,
    facing: 1,
    a1: [4, 4],
    a2: [4, 4],
    l1: [46, 92],
    l2: [46, 92],
    props: MAT,
    ...p,
  };
}

/** Lying face down, head toward screen-left. */
export function prone(p: Pose = {}): Pose {
  return {
    view: 'side',
    body: -90,
    x: 130,
    y: GROUND - 7,
    facing: -1,
    a1: [80, 10],
    a2: [80, 10],
    l1: [-4, 0],
    l2: [-4, 0],
    props: MAT,
    ...p,
  };
}

/** Hands and knees, head toward screen-right. */
export function quad(p: Pose = {}): Pose {
  return {
    view: 'side',
    body: 86,
    torso: -6,
    x: 70,
    y: 122,
    facing: 1,
    neck: 6,
    a1: [92, 0],
    a2: [92, 0],
    l1: [86, 74],
    l2: [86, 74],
    props: MAT,
    ...p,
  };
}

/** Kneeling upright on both knees. */
export function kneel(p: Pose = {}): Pose {
  return {
    view: 'side',
    x: 96,
    y: GROUND - SEG.thigh,
    facing: 1,
    a1: [6, 10],
    a2: [4, 10],
    l1: [0, 92],
    l2: [0, 92],
    props: MAT,
    ...p,
  };
}

/** Half-kneeling lunge: back knee down (screen-left), front foot forward. */
export function halfKneel(p: Pose = {}): Pose {
  return {
    view: 'side',
    x: 92,
    y: GROUND - SEG.thigh,
    facing: 1,
    a1: [10, 14],
    a2: [8, 14],
    l1: [70, 92],
    l2: [-14, 92],
    props: MAT,
    ...p,
  };
}

/** Sitting on the floor with legs out in front (screen-right). */
export function floorSit(p: Pose = {}): Pose {
  return {
    view: 'side',
    x: 64,
    y: GROUND - 10,
    facing: 1,
    a1: [66, 20],
    a2: [64, 20],
    l1: [92, 6],
    l2: [92, 6],
    props: MAT,
    ...p,
  };
}

/** Lying on one side, head toward screen-left. */
export function sideLying(p: Pose = {}): Pose {
  return {
    view: 'front',
    body: -90,
    x: 126,
    y: GROUND - 10,
    a1: [70, 60],
    a2: [30, 40],
    l1: [40, 80],
    l2: [40, 80],
    props: MAT,
    ...p,
  };
}

/** Standing facing a wall on screen-right. */
export function standWallRight(p: Pose = {}): Pose {
  return stand({ x: 92, props: ['floor', 'wall-right'], ...p });
}

/** Standing with back to a wall on screen-left. */
export function standWallLeft(p: Pose = {}): Pose {
  return stand({ x: 104, props: ['floor', 'wall-left'], ...p });
}

/** Helper: mirror a limb pair (swap near/far). */
export function swap(a: Limb, b: Limb): [Limb, Limb] {
  return [b, a];
}
