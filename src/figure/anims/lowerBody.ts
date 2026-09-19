import type { FigureAnimation } from '../model';
import { floorSit, halfKneel, quad, sideLying, sit, stand, standFront, supine } from '../poses';

export const LOWER_BODY_ANIMS: Record<string, FigureAnimation> = {
  // -------------------------------------------------------- lower back / core
  pelvic_tilt_supine: {
    caption: 'Rock the pelvis, flatten and arch',
    step: 1.1,
    hold: 0.7,
    frames: [supine({ torso: 6, y: 167 }), supine({ torso: -6, y: 171 })],
  },
  pelvic_tilt_seated: {
    caption: 'Tuck and tip the pelvis on the chair',
    step: 1.1,
    hold: 0.7,
    frames: [sit({ torso: 16, neck: 8 }), sit({ torso: -10, neck: -4 })],
  },
  knee_to_chest_single: {
    caption: 'Hug one knee toward the chest',
    step: 1.4,
    hold: 1.3,
    frames: [
      supine({ l1: [20, 30], l2: [-6, 4], a1: [40, 70], a2: [30, 60] }),
      supine({ l1: [116, 120], l2: [-6, 4], a1: [76, 92], a2: [66, 86] }),
    ],
  },
  knee_to_chest_double: {
    caption: 'Hug both knees and rock gently',
    step: 1.2,
    hold: 1,
    frames: [
      supine({ l1: [110, 118], l2: [104, 118], a1: [74, 90], a2: [70, 90] }),
      supine({ l1: [124, 124], l2: [118, 124], a1: [82, 96], a2: [78, 96] }),
    ],
  },
  supine_lower_trunk_rotation: {
    caption: 'Knees drop slowly side to side',
    step: 1.4,
    hold: 0.9,
    frames: [
      supine({ view: 'front', body: -90, l1: [70, 100], l2: [70, 100], a1: [92, 4], a2: [92, 4] }),
      supine({ view: 'front', body: -90, l1: [20, 100], l2: [20, 100], a1: [92, 4], a2: [92, 4] }),
      supine({ view: 'front', body: -90, l1: [120, 100], l2: [120, 100], a1: [92, 4], a2: [92, 4] }),
    ],
  },
  childs_pose: {
    caption: 'Sit back on the heels, arms forward',
    step: 1.6,
    hold: 1.6,
    frames: [
      quad({ y: 124 }),
      quad({ x: 56, y: 140, torso: -6, neck: 12, a1: [100, 0], a2: [100, 0], l1: [120, 128], l2: [120, 128] }),
    ],
  },
  bird_dog: {
    caption: 'Opposite arm and leg extend',
    step: 1.2,
    hold: 1,
    frames: [
      quad({ a1: [92, 0], a2: [92, 0], l1: [86, 74], l2: [86, 74] }),
      quad({ a1: [92, 0], a2: [160, 4], l1: [16, 6], l2: [86, 74] }),
    ],
  },
  dead_bug: {
    caption: 'Opposite arm and leg lower',
    step: 1.2,
    hold: 0.8,
    frames: [
      supine({ a1: [92, 4], a2: [92, 4], l1: [92, 92], l2: [92, 92] }),
      supine({ a1: [150, 6], a2: [92, 4], l1: [92, 92], l2: [22, 16] }),
    ],
  },
  standing_hip_hinge: {
    caption: 'Push the hips back with a flat back',
    step: 1.2,
    hold: 0.8,
    frames: [
      stand({ a1: [6, 20], a2: [4, 20] }),
      stand({ x: 108, torso: 62, neck: -6, a1: [10, 30], a2: [8, 30], l1: [14, 16], l2: [14, 16] }),
    ],
  },

  // --------------------------------------------------------------------- hips
  half_kneeling_hip_flexor: {
    caption: 'Tuck the tailbone, shift forward',
    step: 1.4,
    hold: 1.3,
    frames: [halfKneel({ torso: 6 }), halfKneel({ x: 100, torso: -6, l1: [84, 92], l2: [-26, 88] })],
  },
  standing_hip_flexor_stretch: {
    caption: 'Split stance, squeeze the back glute',
    step: 1.4,
    hold: 1.3,
    frames: [
      stand({ l1: [16, 14], l2: [-16, 10] }),
      stand({ torso: -6, l1: [30, 32], l2: [-30, 16], y: 104 }),
    ],
  },
  couch_stretch: {
    caption: 'Back shin up the wall, torso rises tall',
    step: 1.5,
    hold: 1.4,
    frames: [
      halfKneel({ x: 84, torso: 26, l1: [70, 92], l2: [-10, 120], props: ['mat', 'wall-left'] }),
      halfKneel({ x: 84, torso: -4, l1: [78, 96], l2: [-16, 132], props: ['mat', 'wall-left'] }),
    ],
  },
  seated_figure_four: {
    caption: 'Ankle on the knee, hinge forward',
    step: 1.4,
    hold: 1.3,
    frames: [
      sit({ l1: [88, 86], l2: [76, 128], torso: 4 }),
      sit({ l1: [88, 86], l2: [76, 128], torso: 36, neck: -8, a1: [40, 26], a2: [38, 26] }),
    ],
  },
  supine_figure_four: {
    caption: 'Cross the ankle, draw the legs in',
    step: 1.4,
    hold: 1.3,
    frames: [
      supine({ l1: [60, 100], l2: [40, 130], a1: [30, 40], a2: [26, 40] }),
      supine({ l1: [104, 112], l2: [76, 140], a1: [74, 84], a2: [70, 84] }),
    ],
  },
  pigeon_pose: {
    caption: 'Front shin across, back leg long',
    step: 1.5,
    hold: 1.5,
    frames: [
      quad({ x: 78, y: 146, torso: -14, l1: [104, 120], l2: [4, 8] }),
      quad({ x: 74, y: 150, torso: 10, neck: 10, a1: [100, 0], a2: [100, 0], l1: [104, 120], l2: [4, 8] }),
    ],
  },
  ninety_ninety_switches: {
    caption: 'Rotate the knees side to side',
    step: 1.3,
    hold: 0.8,
    frames: [
      floorSit({ l1: [86, 96], l2: [64, 108], a1: [-30, 10], a2: [-32, 10] }),
      floorSit({ l1: [60, 104], l2: [88, 92], a1: [-30, 10], a2: [-32, 10] }),
    ],
  },
  hip_cars_standing: {
    caption: 'Knee draws a big, slow circle',
    step: 0.9,
    hold: 0.2,
    loop: 'cycle',
    frames: [
      stand({ l1: [0, 4], l2: [0, 4], a1: [80, 10], a2: [6, 8], props: ['floor', 'desk-right'] }),
      stand({ l1: [86, 88], l2: [0, 4], a1: [80, 10], a2: [6, 8], props: ['floor', 'desk-right'] }),
      stand({ view: 'front', l1: [70, 80], l2: [4, 4], a1: [80, 10], a2: [6, 8], props: ['floor'] }),
      stand({ l1: [-24, 80], l2: [0, 4], a1: [80, 10], a2: [6, 8], props: ['floor', 'desk-right'] }),
    ],
  },
  standing_hip_circles: {
    caption: 'Hands on hips, circle the pelvis',
    step: 0.6,
    hold: 0.1,
    loop: 'cycle',
    frames: [
      standFront({ x: 100, a1: [22, 84], a2: [22, 84] }),
      standFront({ x: 107, a1: [22, 84], a2: [22, 84], torso: -5 }),
      standFront({ x: 100, a1: [22, 84], a2: [22, 84], torso: 0, y: 103 }),
      standFront({ x: 93, a1: [22, 84], a2: [22, 84], torso: 5 }),
    ],
  },
  glute_bridge: {
    caption: 'Squeeze the glutes, lift the hips',
    step: 1,
    hold: 0.8,
    frames: [
      supine({ y: 169, l1: [56, 104], l2: [52, 104], a1: [10, 6], a2: [10, 6] }),
      supine({ y: 150, torso: -8, l1: [74, 104], l2: [70, 104], a1: [10, 6], a2: [10, 6] }),
    ],
  },
  clamshell: {
    caption: 'Feet together, open the top knee',
    step: 1,
    hold: 0.8,
    frames: [
      sideLying({ l1: [50, 96], l2: [50, 96] }),
      sideLying({ l1: [50, 96], l2: [12, 96] }),
    ],
  },
  butterfly_stretch: {
    caption: 'Soles together, knees fall open',
    step: 1.5,
    hold: 1.4,
    frames: [
      floorSit({ l1: [86, 120], l2: [86, 120], a1: [58, 40], a2: [56, 40] }),
      floorSit({ view: 'front', l1: [70, 130], l2: [70, 130], a1: [58, 46], a2: [58, 46], torso: 6 }),
    ],
  },
  standing_adductor_stretch: {
    caption: 'Wide stance, shift over one bent knee',
    step: 1.4,
    hold: 1.3,
    frames: [
      standFront({ x: 100, l1: [26, 10], l2: [26, 10] }),
      standFront({ x: 86, l1: [34, 74], l2: [30, 2], torso: -4, a1: [40, 60], a2: [40, 60] }),
    ],
  },
  frog_stretch: {
    caption: 'Knees wide, rock the hips back',
    step: 1.2,
    hold: 1,
    frames: [
      quad({ view: 'front', body: 86, x: 72, y: 128, l1: [70, 92], l2: [70, 92] }),
      quad({ view: 'front', body: 86, x: 58, y: 132, l1: [86, 96], l2: [86, 96] }),
    ],
  },
  seated_wide_leg_fold: {
    caption: 'Legs wide, hinge forward with a long spine',
    step: 1.5,
    hold: 1.4,
    frames: [
      floorSit({ l1: [92, 6], l2: [92, 6], torso: 4 }),
      floorSit({ l1: [92, 6], l2: [92, 6], torso: 40, neck: -6, a1: [86, 10], a2: [84, 10] }),
    ],
  },
  deep_squat_hold: {
    caption: 'Hold the support and sink into a deep squat',
    step: 1.4,
    hold: 1.4,
    frames: [
      stand({ x: 104, a1: [96, 10], a2: [92, 10], props: ['floor', 'desk-right'] }),
      stand({ x: 104, y: 148, torso: 22, l1: [116, 128], l2: [112, 128], a1: [130, 10], a2: [126, 10], props: ['floor', 'desk-right'] }),
    ],
  },

  // -------------------------------------------------------------------- legs
  standing_hamstring_stretch: {
    caption: 'Heel forward, hinge at the hips',
    step: 1.4,
    hold: 1.3,
    frames: [
      stand({ l1: [22, 4, 30], l2: [-6, 6] }),
      stand({ torso: 46, neck: -6, l1: [40, 2, 40], l2: [-6, 14], a1: [50, 24], a2: [48, 24] }),
    ],
  },
  seated_hamstring_stretch: {
    caption: 'One leg extended, hinge forward',
    step: 1.4,
    hold: 1.3,
    frames: [
      sit({ l1: [88, 10, 34], l2: [88, 86] }),
      sit({ torso: 34, neck: -6, l1: [88, 6, 40], l2: [88, 86], a1: [64, 20], a2: [62, 20] }),
    ],
  },
  supine_hamstring_strap: {
    caption: 'Strap around the foot, raise the leg',
    step: 1.4,
    hold: 1.3,
    frames: [
      supine({ l1: [46, 10], l2: [-4, 6], a1: [50, 30], a2: [44, 30], props: ['mat', 'strap'] }),
      supine({ l1: [96, 6], l2: [-4, 6], a1: [86, 24], a2: [80, 24], props: ['mat', 'strap'] }),
    ],
  },
  hamstring_sweeps: {
    caption: 'Step the heel forward and sweep down',
    step: 0.9,
    hold: 0.4,
    frames: [
      stand({ l1: [26, 4, 34], l2: [-6, 6], a1: [10, 10], a2: [8, 10] }),
      stand({ torso: 52, neck: -8, l1: [40, 2, 40], l2: [-6, 12], a1: [46, 6], a2: [44, 6] }),
    ],
  },
  standing_quad_stretch: {
    caption: 'Hold the foot behind, knees together',
    step: 1.3,
    hold: 1.3,
    frames: [
      stand({ l1: [2, 20], l2: [0, 4], a1: [8, 14], a2: [6, 14] }),
      stand({ torso: -4, l1: [-6, 132], l2: [0, 4], a1: [-28, 62], a2: [8, 12] }),
    ],
  },
  side_lying_quad_stretch: {
    caption: 'Draw the top heel toward the glute',
    step: 1.3,
    hold: 1.3,
    frames: [
      sideLying({ l1: [30, 70], l2: [10, 40], a1: [50, 40], a2: [30, 30] }),
      sideLying({ l1: [30, 70], l2: [-14, 128], a1: [-16, 70], a2: [30, 30] }),
    ],
  },
  kneeling_quad_stretch_chair: {
    caption: 'Back foot on the chair, rise tall',
    step: 1.4,
    hold: 1.4,
    frames: [
      halfKneel({ x: 88, torso: 22, l1: [72, 92], l2: [-12, 110], props: ['mat', 'chair'] }),
      halfKneel({ x: 88, torso: -4, l1: [78, 96], l2: [-18, 128], props: ['mat', 'chair'] }),
    ],
  },
  leg_swings_front_back: {
    caption: 'Swing one leg forward and back',
    step: 0.6,
    hold: 0.15,
    frames: [
      stand({ l1: [-30, 12], l2: [0, 4], a1: [86, 8], a2: [6, 8], props: ['floor', 'desk-right'] }),
      stand({ l1: [50, 6], l2: [0, 4], a1: [86, 8], a2: [6, 8], props: ['floor', 'desk-right'] }),
    ],
  },
  leg_swings_side: {
    caption: 'Swing the leg across and out',
    step: 0.6,
    hold: 0.15,
    frames: [
      standFront({ l1: [-26, 6], l2: [4, 4], a1: [96, 6], a2: [96, 6], props: ['floor', 'wall-left'] }),
      standFront({ l1: [46, 6], l2: [4, 4], a1: [96, 6], a2: [96, 6], props: ['floor', 'wall-left'] }),
    ],
  },
  wall_calf_stretch: {
    caption: 'Back leg straight, heel down, lean in',
    step: 1.4,
    hold: 1.3,
    frames: [
      stand({ x: 92, a1: [94, 8], a2: [90, 8], l1: [12, 6], l2: [-10, 4], props: ['floor', 'wall-right'] }),
      stand({ x: 84, torso: 14, a1: [104, 4], a2: [100, 4], l1: [26, 24], l2: [-22, 2], props: ['floor', 'wall-right'] }),
    ],
  },
  bent_knee_calf_stretch: {
    caption: 'Back knee bends, heel stays down',
    step: 1.3,
    hold: 1.3,
    frames: [
      stand({ x: 90, a1: [94, 8], a2: [90, 8], l1: [16, 10], l2: [-8, 8], props: ['floor', 'wall-right'] }),
      stand({ x: 86, y: 108, torso: 10, a1: [100, 6], a2: [96, 6], l1: [30, 34], l2: [-6, 40], props: ['floor', 'wall-right'] }),
    ],
  },
  downward_dog_calf_pedals: {
    caption: 'Hips high, pedal the heels',
    step: 0.9,
    hold: 0.5,
    frames: [
      quad({ body: 118, torso: -8, x: 64, y: 108, a1: [116, 0], a2: [116, 0], l1: [50, 6], l2: [50, 34] }),
      quad({ body: 118, torso: -8, x: 64, y: 108, a1: [116, 0], a2: [116, 0], l1: [50, 34], l2: [50, 6] }),
    ],
  },
  ankle_circles: {
    caption: 'Lift one foot and circle the ankle',
    step: 0.5,
    hold: 0.1,
    loop: 'cycle',
    frames: [
      sit({ l1: [88, 60, 30], l2: [88, 86] }),
      sit({ l1: [88, 60, 60], l2: [88, 86] }),
      sit({ l1: [88, 60, 90], l2: [88, 86] }),
      sit({ l1: [88, 60, 60], l2: [88, 86] }),
    ],
  },
  ankle_alphabet: {
    caption: 'Trace letters with the big toe',
    step: 0.7,
    hold: 0.1,
    loop: 'cycle',
    frames: [
      sit({ l1: [88, 52, 20], l2: [88, 86] }),
      sit({ l1: [88, 58, 80], l2: [88, 86] }),
      sit({ l1: [88, 48, 40], l2: [88, 86] }),
      sit({ l1: [88, 60, 100], l2: [88, 86] }),
    ],
  },
  knee_to_wall_dorsiflexion: {
    caption: 'Drive the knee to the wall, heel down',
    step: 0.9,
    hold: 0.7,
    frames: [
      stand({ x: 92, l1: [10, 8], l2: [-8, 6], a1: [80, 30], a2: [76, 30], props: ['floor', 'wall-right'] }),
      stand({ x: 92, y: 104, l1: [26, 44], l2: [-8, 6], a1: [88, 26], a2: [84, 26], props: ['floor', 'wall-right'] }),
    ],
  },
  seated_ankle_pumps: {
    caption: 'Point and flex the feet',
    step: 0.6,
    hold: 0.3,
    frames: [sit({ l1: [88, 86, 46], l2: [88, 86, 46] }), sit({ l1: [88, 86, -30], l2: [88, 86, -30] })],
  },
  heel_raises: {
    caption: 'Rise onto the balls of the feet',
    step: 0.9,
    hold: 0.6,
    frames: [
      stand({ y: 100, l1: [0, 2], l2: [0, 2], a1: [80, 10], a2: [6, 8], props: ['floor', 'desk-right'] }),
      stand({ y: 90, l1: [0, 2, 46], l2: [0, 2, 46], a1: [80, 10], a2: [6, 8], props: ['floor', 'desk-right'] }),
    ],
  },
  tibialis_raises: {
    caption: 'Back on the wall, lift the toes',
    step: 0.9,
    hold: 0.6,
    frames: [
      stand({ x: 108, l1: [-12, 4], l2: [-12, 4], a1: [8, 8], a2: [6, 8], props: ['floor', 'wall-left'] }),
      stand({ x: 108, l1: [-12, 4, -46], l2: [-12, 4, -46], a1: [8, 8], a2: [6, 8], props: ['floor', 'wall-left'] }),
    ],
  },

  // -------------------------------------------------------------- flows
  worlds_greatest_stretch: {
    caption: 'Lunge, elbow down, then rotate open',
    step: 1.3,
    hold: 1,
    frames: [
      halfKneel({ x: 92, torso: 40, l1: [86, 96], l2: [-24, 30], a1: [102, 0], a2: [98, 0], props: ['mat'] }),
      halfKneel({ x: 92, torso: 34, l1: [86, 96], l2: [-24, 30], a1: [118, 70], a2: [98, 0], props: ['mat'] }),
      halfKneel({ x: 92, torso: 10, neck: -12, l1: [86, 96], l2: [-24, 30], a1: [-40, 4], a2: [98, 0], props: ['mat'] }),
    ],
  },
  squat_to_stand: {
    caption: 'Hold the toes, sink and stand',
    step: 1.2,
    hold: 0.9,
    frames: [
      stand({ y: 100, torso: 70, neck: -10, l1: [18, 16], l2: [16, 16], a1: [120, 0], a2: [116, 0] }),
      stand({ y: 146, torso: 14, l1: [112, 126], l2: [108, 126], a1: [116, 10], a2: [112, 10] }),
    ],
  },
  standing_roll_down: {
    caption: 'Roll down one vertebra at a time',
    step: 1.4,
    hold: 0.7,
    frames: [
      stand({ torso: 0, a1: [4, 6], a2: [2, 6] }),
      stand({ torso: 34, neck: 30, head: 12, a1: [20, 8], a2: [18, 8] }),
      stand({ torso: 78, neck: 26, head: 10, a1: [72, 4], a2: [70, 4], l1: [10, 10], l2: [10, 10] }),
    ],
  },
  inchworm: {
    caption: 'Walk the hands out, then the feet in',
    step: 1.1,
    hold: 0.5,
    frames: [
      stand({ torso: 76, neck: 6, a1: [92, 0], a2: [90, 0], l1: [8, 10], l2: [8, 10] }),
      quad({ body: 100, torso: -10, x: 58, y: 116, a1: [100, 0], a2: [100, 0], l1: [6, 6], l2: [6, 6] }),
      quad({ body: 122, torso: -14, x: 66, y: 104, a1: [122, 0], a2: [122, 0], l1: [44, 8], l2: [44, 8] }),
    ],
  },
  standing_reach_and_fold: {
    caption: 'Reach up, then fold and let the arms hang',
    step: 1.3,
    hold: 0.8,
    frames: [
      stand({ a1: [172, 4], a2: [168, 4], torso: -4 }),
      stand({ torso: 70, neck: 10, a1: [86, 4], a2: [84, 4], l1: [12, 12], l2: [12, 12] }),
    ],
  },
};
