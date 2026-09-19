/**
 * A tiny 2D kinematic stick-figure model used to animate exercises that have
 * no photographic demonstration. Angles are in degrees.
 *
 * Direction convention: 0 = up, 90 = screen-right, 180 = down, 270 = screen-left.
 */

export type View = 'side' | 'front';

/**
 * [primary angle, secondary angle, extra].
 * Arms: shoulder, elbow. Legs: hip, knee.
 * The third value is a foot rotation offset in the side view, and a
 * 0-100 thigh foreshortening amount in the front view (100 = pointing at the viewer).
 */
export type Limb = [number, number] | [number, number, number];

export interface Pose {
  view?: View;
  /** Rotation of the whole body about the hip. 0 = upright, 90 = torso pointing right (quadruped), -90 = lying with head to the left. */
  body?: number;
  /** Torso lean relative to the body axis. Side view: + = forward. Front view: + = toward screen-right. */
  torso?: number;
  /** Neck angle relative to the torso. */
  neck?: number;
  /** Head tilt relative to the neck. Side view: + = chin down. Front view: + = toward screen-right. */
  head?: number;
  /** Front view only: head turn, -1 (screen-left) .. 1 (screen-right). */
  turn?: number;
  /** Side view: near arm; front view: figure's right arm (screen-left). */
  a1?: Limb;
  /** Side view: far arm; front view: figure's left arm (screen-right). */
  a2?: Limb;
  l1?: Limb;
  l2?: Limb;
  /** Hip position in the 200x200 box. */
  x?: number;
  y?: number;
  /** Side view: which way the front of the body faces relative to the torso direction. 1 = right of the torso vector (default), -1 = left. */
  facing?: 1 | -1;
  /** Optional scene props. */
  props?: Prop[];
}

export type Prop =
  | 'floor'
  | 'mat'
  | 'chair'
  | 'desk-right'
  | 'desk-left'
  | 'wall-left'
  | 'wall-right'
  | 'ball-head'
  | 'ball-shoulder'
  | 'roller'
  | 'band'
  | 'strap';

export interface FigureAnimation {
  /** Keyframes; the last eases back to the first when `loop` is 'cycle'. */
  frames: Pose[];
  /** Seconds per transition. */
  step?: number;
  /** Seconds to hold each keyframe. */
  hold?: number;
  loop?: 'pingpong' | 'cycle';
  caption?: string;
}

export const SEG = {
  head: 11,
  neck: 9,
  torso: 44,
  upper: 28,
  fore: 26,
  thigh: 40,
  shin: 38,
  foot: 12,
};

export const GROUND = 178;
export const STAND_Y = GROUND - SEG.thigh - SEG.shin;

export interface Pt {
  x: number;
  y: number;
}

export function dir(angle: number): Pt {
  const r = (angle * Math.PI) / 180;
  return { x: Math.sin(r), y: -Math.cos(r) };
}

export function add(p: Pt, angle: number, len: number): Pt {
  const d = dir(angle);
  return { x: p.x + d.x * len, y: p.y + d.y * len };
}

export interface Resolved {
  view: View;
  hip: Pt;
  shoulder: Pt;
  neckEnd: Pt;
  headCenter: Pt;
  headAngle: number;
  turn: number;
  facing: 1 | -1;
  arms: { shoulder: Pt; elbow: Pt; hand: Pt }[];
  legs: { hip: Pt; knee: Pt; ankle: Pt; toe: Pt }[];
  props: Prop[];
}

export type FullPose = Required<Omit<Pose, 'props'>> & { props: Prop[] };

const DEFAULT: FullPose = {
  view: 'side',
  body: 0,
  torso: 0,
  neck: 0,
  head: 0,
  turn: 0,
  a1: [0, 0],
  a2: [0, 0],
  l1: [0, 0],
  l2: [0, 0],
  x: 100,
  y: STAND_Y,
  facing: 1,
  props: ['floor'],
};

export function fill(p: Pose): FullPose {
  return { ...DEFAULT, ...p, props: p.props ?? DEFAULT.props };
}

/** Linear interpolation between two poses (view/facing/props snap to the target at t >= 0.5). */
export function lerpPose(a: Pose, b: Pose, t: number): FullPose {
  const A = fill(a);
  const B = fill(b);
  const l = (x: number, y: number) => x + (y - x) * t;
  const limb = (x: Limb, y: Limb): Limb => [l(x[0], y[0]), l(x[1], y[1]), l(x[2] ?? 0, y[2] ?? 0)];
  const snap = t >= 0.5 ? B : A;
  return {
    view: snap.view,
    facing: snap.facing,
    props: snap.props,
    body: l(A.body, B.body),
    torso: l(A.torso, B.torso),
    neck: l(A.neck, B.neck),
    head: l(A.head, B.head),
    turn: l(A.turn, B.turn),
    a1: limb(A.a1, B.a1),
    a2: limb(A.a2, B.a2),
    l1: limb(A.l1, B.l1),
    l2: limb(A.l2, B.l2),
    x: l(A.x, B.x),
    y: l(A.y, B.y),
  };
}

/** Compute joint positions for a pose. */
export function resolve(pose: Pose): Resolved {
  const p = fill(pose);
  const hip: Pt = { x: p.x, y: p.y };
  const torsoDir = p.body + p.torso;
  const shoulder = add(hip, torsoDir, SEG.torso);
  const neckDir = torsoDir + p.neck;
  const neckEnd = add(shoulder, neckDir, SEG.neck);
  const headDir = neckDir + p.head;
  const headCenter = add(neckEnd, headDir, SEG.head);

  const arms: Resolved['arms'] = [];
  const legs: Resolved['legs'] = [];

  if (p.view === 'side') {
    const f = p.facing;
    const armBase = torsoDir + 180;
    for (const limb of [p.a2, p.a1]) {
      const upperDir = armBase - f * limb[0];
      const elbow = add(shoulder, upperDir, SEG.upper);
      const foreDir = upperDir - f * limb[1];
      const hand = add(elbow, foreDir, SEG.fore);
      arms.push({ shoulder, elbow, hand });
    }
    const legBase = p.body + 180;
    for (const limb of [p.l2, p.l1]) {
      const thighDir = legBase - f * limb[0];
      const knee = add(hip, thighDir, SEG.thigh);
      const shinDir = thighDir + f * limb[1];
      const ankle = add(knee, shinDir, SEG.shin);
      const toe = add(ankle, shinDir - f * 90 + f * (limb[2] ?? 0), SEG.foot);
      legs.push({ hip, knee, ankle, toe });
    }
  } else {
    const armBase = torsoDir + 180;
    // a1 = figure's right arm, drawn on screen-left; abduction rotates toward 270.
    {
      const upperDir = armBase + p.a1[0];
      const elbow = add(shoulder, upperDir, SEG.upper);
      const hand = add(elbow, upperDir + p.a1[1], SEG.fore);
      arms.push({ shoulder, elbow, hand });
    }
    {
      const upperDir = armBase - p.a2[0];
      const elbow = add(shoulder, upperDir, SEG.upper);
      const hand = add(elbow, upperDir - p.a2[1], SEG.fore);
      arms.push({ shoulder, elbow, hand });
    }
    const legBase = p.body + 180;
    const shorten = (limb: Limb) => 1 - Math.min(0.72, (limb[2] ?? 0) / 100);
    {
      const thighDir = legBase + p.l1[0];
      const knee = add(hip, thighDir, SEG.thigh * shorten(p.l1));
      const ankle = add(knee, thighDir + p.l1[1], SEG.shin * (1 - Math.min(0.5, Math.abs(p.l1[1]) / 180)));
      legs.push({ hip, knee, ankle, toe: add(ankle, 270, SEG.foot * 0.6) });
    }
    {
      const thighDir = legBase - p.l2[0];
      const knee = add(hip, thighDir, SEG.thigh * shorten(p.l2));
      const ankle = add(knee, thighDir - p.l2[1], SEG.shin * (1 - Math.min(0.5, Math.abs(p.l2[1]) / 180)));
      legs.push({ hip, knee, ankle, toe: add(ankle, 90, SEG.foot * 0.6) });
    }
  }

  return {
    view: p.view,
    hip,
    shoulder,
    neckEnd,
    headCenter,
    headAngle: headDir,
    turn: p.turn,
    facing: p.facing,
    arms,
    legs,
    props: p.props,
  };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/** Pose at a given time (seconds) for an animation. */
export function poseAt(anim: FigureAnimation, time: number): FullPose {
  const frames = anim.frames;
  if (frames.length === 0) return fill({});
  if (frames.length === 1) return fill(frames[0]);
  const step = anim.step ?? 1.2;
  const hold = anim.hold ?? 0.6;
  const loop = anim.loop ?? 'pingpong';
  const seq = loop === 'pingpong' ? [...frames, ...frames.slice(1, -1).reverse()] : frames;
  const segLen = step + hold;
  const total = seq.length * segLen;
  const t = ((time % total) + total) % total;
  const idx = Math.floor(t / segLen);
  const local = t - idx * segLen;
  const from = seq[idx];
  const to = seq[(idx + 1) % seq.length];
  if (local < hold) return fill(from);
  const u = easeInOut((local - hold) / step);
  return lerpPose(from, to, u);
}

/**
 * A square viewBox that tightly frames the whole animation, so small
 * thumbnails still show a readable figure. Computed across every keyframe
 * so the frame never jitters mid-animation.
 */
export function animViewBox(anim: FigureAnimation, pad = 14): string {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const see = (p: Pt, r = 0) => {
    minX = Math.min(minX, p.x - r);
    minY = Math.min(minY, p.y - r);
    maxX = Math.max(maxX, p.x + r);
    maxY = Math.max(maxY, p.y + r);
  };
  for (const frame of anim.frames) {
    const r = resolve(frame);
    see(r.hip);
    see(r.shoulder);
    see(r.headCenter, SEG.head + 2);
    for (const a of r.arms) {
      see(a.elbow);
      see(a.hand);
    }
    for (const l of r.legs) {
      see(l.knee);
      see(l.ankle);
      see(l.toe);
    }
    for (const prop of r.props) {
      if (prop === 'floor' || prop === 'mat') see({ x: r.hip.x, y: GROUND + 4 });
      if (prop === 'wall-left') see({ x: 8, y: r.shoulder.y });
      if (prop === 'wall-right') see({ x: 192, y: r.shoulder.y });
      if (prop === 'chair') {
        see({ x: 58, y: 92 });
        see({ x: 134, y: GROUND });
      }
      if (prop === 'desk-right') see({ x: 194, y: 112 });
      if (prop === 'desk-left') see({ x: 6, y: 112 });
    }
  }
  if (!Number.isFinite(minX)) return '0 0 200 200';
  minX -= pad;
  minY -= pad;
  maxX += pad;
  maxY += pad;
  const size = Math.max(maxX - minX, maxY - minY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return `${cx - size / 2} ${cy - size / 2} ${size} ${size}`;
}
