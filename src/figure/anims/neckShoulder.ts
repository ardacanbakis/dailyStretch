import type { FigureAnimation } from '../model';
import { prone, sideLying, sit, sitFront, stand, standFront, standWallLeft, standWallRight, supine } from '../poses';

const FWD = { neck: 14, head: 16 };
const TUCK = { neck: -2, head: -5 };

export const NECK_SHOULDER_ANIMS: Record<string, FigureAnimation> = {
  chin_tuck_seated: {
    caption: 'Seated chin tuck',
    step: 1.3,
    hold: 0.9,
    frames: [sit({ ...FWD }), sit({ ...TUCK })],
  },
  chin_tuck_wall: {
    caption: 'Chin tuck against a wall',
    step: 1.3,
    hold: 0.9,
    frames: [standWallLeft({ x: 108, ...FWD }), standWallLeft({ x: 108, ...TUCK })],
  },
  chin_tuck_supine: {
    caption: 'Lying chin tuck',
    step: 1.3,
    hold: 1,
    frames: [supine({ neck: 6, head: 8 }), supine({ neck: -4, head: -8 })],
  },
  deep_neck_flexor_nod: {
    caption: 'Small nod from the top of the neck',
    step: 1,
    hold: 0.8,
    frames: [sit({ neck: 2, head: 0 }), sit({ neck: 2, head: 12 })],
  },
  cervical_rotation_seated: {
    caption: 'Slow head turns',
    step: 1.4,
    hold: 0.9,
    frames: [sitFront({ turn: -1, head: -4 }), sitFront({ turn: 0 }), sitFront({ turn: 1, head: 4 })],
  },
  cervical_rotation_eyes_lead: {
    caption: 'Eyes lead, head follows',
    step: 1.6,
    hold: 1,
    frames: [sitFront({ turn: 0 }), sitFront({ turn: 0.9, head: 3 })],
  },
  chin_tuck_rotation: {
    caption: 'Chin tuck, then rotate',
    step: 1.2,
    hold: 0.8,
    frames: [sitFront({ turn: 0, neck: 0 }), sitFront({ turn: -0.8, head: -3 }), sitFront({ turn: 0.8, head: 3 })],
  },
  cervical_lateral_flexion: {
    caption: 'Ear toward the shoulder',
    step: 1.4,
    hold: 1,
    frames: [sitFront({ head: -22, neck: -6 }), sitFront({ head: 0 }), sitFront({ head: 22, neck: 6 })],
  },
  neck_half_circles: {
    caption: 'Chin traces an arc across the chest',
    step: 1.1,
    hold: 0.4,
    frames: [
      sitFront({ head: -20, neck: -6 }),
      sitFront({ head: -10, neck: 0, turn: -0.3 }),
      sitFront({ head: 0, neck: 14, turn: 0 }),
      sitFront({ head: 10, neck: 0, turn: 0.3 }),
      sitFront({ head: 20, neck: 6 }),
    ],
  },
  neck_isometrics: {
    caption: 'Light resisted holds',
    step: 1,
    hold: 1.1,
    frames: [
      sitFront({ a1: [150, 60], a2: [14, 22] }),
      sitFront({ a1: [14, 22], a2: [150, 60] }),
      sitFront({ a1: [120, 92], a2: [120, 92], head: -2 }),
    ],
  },
  upper_trap_stretch_seated: {
    caption: 'Anchor the shoulder, tip the head away',
    step: 1.5,
    hold: 1.2,
    frames: [
      sitFront({ a1: [10, 8], a2: [10, 8] }),
      sitFront({ a1: [4, 4], a2: [158, 74], head: -24, neck: -6 }),
      sitFront({ a1: [158, 74], a2: [4, 4], head: 24, neck: 6 }),
    ],
  },
  upper_trap_stretch_standing: {
    caption: 'Hand behind the back, head tips away',
    step: 1.5,
    hold: 1.2,
    frames: [
      standFront({ a1: [-12, 42], a2: [8, 6], head: -22, neck: -6 }),
      standFront({ a1: [8, 6], a2: [-12, 42], head: 22, neck: 6 }),
    ],
  },
  levator_stretch_seated: {
    caption: 'Look toward the armpit',
    step: 1.5,
    hold: 1.2,
    frames: [
      sitFront({ a1: [4, 4], a2: [150, 86], head: -20, neck: 12, turn: -0.7 }),
      sitFront({ a1: [150, 86], a2: [4, 4], head: 20, neck: 12, turn: 0.7 }),
    ],
  },
  levator_stretch_wall: {
    caption: 'Elbow on the wall, look down and away',
    step: 1.4,
    hold: 1.2,
    frames: [
      standFront({ a1: [96, 96], a2: [10, 8], head: -14, neck: 10, turn: -0.6, props: ['floor', 'wall-left'] }),
      standFront({ a1: [96, 96], a2: [10, 8], head: -20, neck: 16, turn: -0.85, props: ['floor', 'wall-left'] }),
    ],
  },
  levator_stretch_supine: {
    caption: 'Lying, turn and nod gently',
    step: 1.4,
    hold: 1.2,
    frames: [supine({ neck: 0, head: 0, a1: [8, 4], a2: [8, 4] }), supine({ neck: 10, head: 14, a1: [4, 2], a2: [4, 2] })],
  },
  scalene_stretch: {
    caption: 'Hand on the collarbone, tip and look up slightly',
    step: 1.4,
    hold: 1.2,
    frames: [
      standFront({ a1: [26, 96], a2: [8, 6], head: -18, neck: -8 }),
      standFront({ a1: [8, 6], a2: [26, 96], head: 18, neck: 8 }),
    ],
  },
  suboccipital_release_ball: {
    caption: 'Ball under the base of the skull',
    step: 1.6,
    hold: 1.4,
    frames: [
      supine({ neck: 2, head: 4, props: ['mat', 'ball-head'] }),
      supine({ neck: 2, head: -6, props: ['mat', 'ball-head'] }),
    ],
  },
  suboccipital_release_towel: {
    caption: 'Rest with a rolled towel under the head',
    step: 2,
    hold: 2,
    frames: [supine({ neck: 0, head: 0 }), supine({ neck: 0, head: -3 })],
  },
  upper_trap_release_wall_ball: {
    caption: 'Ball between the shoulder and the wall',
    step: 1.4,
    hold: 1,
    frames: [
      standFront({ x: 104, a1: [10, 8], a2: [10, 8], props: ['floor', 'wall-left', 'ball-shoulder'] }),
      standFront({ x: 104, a1: [80, 20], a2: [10, 8], props: ['floor', 'wall-left', 'ball-shoulder'] }),
    ],
  },

  shoulder_rolls_back: {
    caption: 'Shoulders up, back and down',
    step: 0.7,
    hold: 0.2,
    loop: 'cycle',
    frames: [
      standFront({ a1: [10, 6], a2: [10, 6], y: 100 }),
      standFront({ a1: [16, 10], a2: [16, 10], y: 96 }),
      standFront({ a1: [-10, 8], a2: [-10, 8], y: 97 }),
      standFront({ a1: [4, 4], a2: [4, 4], y: 101 }),
    ],
  },
  shoulder_shrug_release: {
    caption: 'Shrug up, then let go',
    step: 0.8,
    hold: 0.9,
    frames: [standFront({ y: 101, a1: [6, 4], a2: [6, 4] }), standFront({ y: 94, a1: [12, 10], a2: [12, 10] })],
  },
  scapular_retraction_seated: {
    caption: 'Draw the shoulder blades together',
    step: 1.1,
    hold: 0.9,
    frames: [sit({ a1: [10, 20], a2: [8, 20], torso: 6 }), sit({ a1: [-16, 34], a2: [-18, 34], torso: -2 })],
  },
  band_pull_apart: {
    caption: 'Pull the band apart',
    step: 0.9,
    hold: 0.6,
    frames: [
      standFront({ a1: [78, 10], a2: [78, 10], props: ['floor', 'band'] }),
      standFront({ a1: [116, 6], a2: [116, 6], props: ['floor', 'band'] }),
    ],
  },
  wall_slides: {
    caption: 'Forearms slide up the wall',
    step: 1.2,
    hold: 0.6,
    frames: [standWallRight({ x: 86, a1: [96, 88], a2: [92, 88] }), standWallRight({ x: 86, a1: [140, 52], a2: [136, 52] })],
  },
  wall_angels: {
    caption: 'Arms sweep up and down on the wall',
    step: 1.2,
    hold: 0.6,
    frames: [
      standFront({ x: 104, a1: [96, 88], a2: [96, 88], props: ['floor', 'wall-left'] }),
      standFront({ x: 104, a1: [150, 30], a2: [150, 30], props: ['floor', 'wall-left'] }),
    ],
  },
  floor_angels: {
    caption: 'Arms sweep along the floor',
    step: 1.3,
    hold: 0.7,
    frames: [
      supine({ view: 'front', a1: [64, 84], a2: [64, 84], l1: [30, 90], l2: [30, 90], y: 104, x: 132 }),
      supine({ view: 'front', a1: [140, 24], a2: [140, 24], l1: [30, 90], l2: [30, 90], y: 104, x: 132 }),
    ],
  },
  shoulder_cars_standing: {
    caption: 'One slow, controlled shoulder circle',
    step: 0.9,
    hold: 0.15,
    loop: 'cycle',
    frames: [
      stand({ a1: [0, 0], a2: [2, 6] }),
      stand({ a1: [90, 0], a2: [2, 6] }),
      stand({ a1: [178, 0], a2: [2, 6] }),
      stand({ a1: [-60, 0], a2: [2, 6] }),
    ],
  },
  shoulder_cars_seated: {
    caption: 'Fingertips on the shoulder, draw big elbow circles',
    step: 0.7,
    hold: 0.1,
    loop: 'cycle',
    frames: [
      sitFront({ a1: [40, 130], a2: [10, 14] }),
      sitFront({ a1: [110, 130], a2: [10, 14] }),
      sitFront({ a1: [160, 120], a2: [10, 14] }),
      sitFront({ a1: [90, 140], a2: [10, 14] }),
    ],
  },
  arm_circles_small: {
    caption: 'Small circles with the arms out',
    step: 0.55,
    hold: 0.1,
    loop: 'cycle',
    frames: [
      standFront({ a1: [88, 0], a2: [88, 0] }),
      standFront({ a1: [102, 0], a2: [102, 0] }),
      standFront({ a1: [88, 0], a2: [88, 0], y: 97 }),
      standFront({ a1: [74, 0], a2: [74, 0] }),
    ],
  },
  cross_body_shoulder_stretch: {
    caption: 'Draw one arm across the chest',
    step: 1.4,
    hold: 1.2,
    frames: [standFront({ a1: [128, 44], a2: [96, 70] }), standFront({ a1: [96, 70], a2: [128, 44] })],
  },
  sleeper_stretch: {
    caption: 'Side-lying, press the forearm down',
    step: 1.4,
    hold: 1.2,
    frames: [sideLying({ a1: [96, 40], a2: [40, 30] }), sideLying({ a1: [96, 86], a2: [40, 30] })],
  },
  wall_external_rotation: {
    caption: 'Back of the hand presses into the wall',
    step: 1,
    hold: 1,
    frames: [
      standFront({ a1: [18, 96], a2: [10, 8], props: ['floor', 'wall-left'] }),
      standFront({ a1: [18, 120], a2: [10, 8], props: ['floor', 'wall-left'] }),
    ],
  },
  band_external_rotation: {
    caption: 'Rotate the forearms outward',
    step: 0.9,
    hold: 0.6,
    frames: [
      standFront({ a1: [14, 92], a2: [14, 92], props: ['floor', 'band'] }),
      standFront({ a1: [14, 126], a2: [14, 126], props: ['floor', 'band'] }),
    ],
  },
  scapular_wall_pushup: {
    caption: 'Only the shoulder blades move',
    step: 0.9,
    hold: 0.6,
    frames: [
      standWallRight({ x: 92, a1: [96, 2], a2: [92, 2], torso: 4 }),
      standWallRight({ x: 86, a1: [100, 2], a2: [96, 2], torso: 10 }),
    ],
  },
  prone_y_raise: {
    caption: 'Lift the arms in a Y',
    step: 1,
    hold: 0.7,
    frames: [
      prone({ view: 'front', a1: [138, 6], a2: [138, 6], l1: [6, 0], l2: [6, 0], y: 100, x: 132 }),
      prone({ view: 'front', a1: [150, 4], a2: [150, 4], l1: [6, 0], l2: [6, 0], y: 100, x: 132 }),
    ],
  },
  prone_t_raise: {
    caption: 'Squeeze the blades, lift the arms',
    step: 1,
    hold: 0.7,
    frames: [
      prone({ view: 'front', a1: [84, 4], a2: [84, 4], l1: [6, 0], l2: [6, 0], y: 100, x: 132 }),
      prone({ view: 'front', a1: [96, 2], a2: [96, 2], l1: [6, 0], l2: [6, 0], y: 100, x: 132 }),
    ],
  },
  lat_stretch_desk: {
    caption: 'Hands on the desk, hips travel back',
    step: 1.4,
    hold: 1.2,
    frames: [
      stand({ x: 112, torso: 20, a1: [130, 0], a2: [126, 0], props: ['floor', 'desk-right'] }),
      stand({ x: 92, torso: 74, neck: 8, a1: [150, 0], a2: [146, 0], l1: [16, 10], l2: [16, 10], props: ['floor', 'desk-right'] }),
    ],
  },
  doorway_lat_stretch: {
    caption: 'Hold the frame, sit the hips back and away',
    step: 1.4,
    hold: 1.2,
    frames: [
      stand({ x: 104, a1: [150, 20], a2: [10, 10], props: ['floor', 'wall-right'] }),
      stand({ x: 88, torso: 34, a1: [168, 4], a2: [12, 10], l1: [22, 16], l2: [22, 16], props: ['floor', 'wall-right'] }),
    ],
  },
  overhead_triceps_stretch: {
    caption: 'Guide the elbow gently back',
    step: 1.4,
    hold: 1.2,
    frames: [standFront({ a1: [172, 120], a2: [150, 96] }), standFront({ a1: [150, 96], a2: [172, 120] })],
  },
};
