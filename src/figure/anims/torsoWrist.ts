import type { FigureAnimation } from '../model';
import { prone, quad, sideLying, sit, sitFront, stand, standFront, supine } from '../poses';

export const TORSO_WRIST_ANIMS: Record<string, FigureAnimation> = {
  // ------------------------------------------------------------------- chest
  doorway_chest_stretch: {
    caption: 'Forearms on the frame, step through',
    step: 1.4,
    hold: 1.2,
    frames: [
      stand({ x: 96, a1: [92, 84], a2: [88, 84], props: ['floor', 'wall-right'] }),
      stand({ x: 108, torso: -6, a1: [78, 94], a2: [74, 94], l1: [26, 18], l2: [-14, 6], props: ['floor', 'wall-right'] }),
    ],
  },
  corner_chest_stretch: {
    caption: 'A forearm on each wall, lean in',
    step: 1.4,
    hold: 1.2,
    frames: [
      standFront({ a1: [92, 84], a2: [92, 84], props: ['floor', 'wall-left', 'wall-right'] }),
      standFront({ a1: [108, 92], a2: [108, 92], y: 97, props: ['floor', 'wall-left', 'wall-right'] }),
    ],
  },
  wall_pec_stretch_single: {
    caption: 'Palm on the wall, turn the body away',
    step: 1.4,
    hold: 1.2,
    frames: [
      standFront({ a1: [96, 10], a2: [10, 8], props: ['floor', 'wall-left'] }),
      standFront({ a1: [112, 6], a2: [14, 10], torso: 10, turn: 0.8, props: ['floor', 'wall-left'] }),
    ],
  },
  floor_chest_opener: {
    caption: 'Cactus arms, let the chest open',
    step: 1.6,
    hold: 1.6,
    frames: [supine({ a1: [80, 76], a2: [80, 76] }), supine({ a1: [92, 88], a2: [92, 88] })],
  },
  foam_roller_chest_opener: {
    caption: 'Lie along the roller, arms open',
    step: 1.6,
    hold: 1.4,
    frames: [
      supine({ y: 158, a1: [70, 60], a2: [70, 60], props: ['mat', 'roller'] }),
      supine({ y: 158, a1: [120, 30], a2: [120, 30], props: ['mat', 'roller'] }),
    ],
  },
  chest_opener_clasp: {
    caption: 'Hands clasped behind, lift the chest',
    step: 1.2,
    hold: 1.1,
    frames: [
      stand({ a1: [-10, 12], a2: [-12, 12], torso: 4 }),
      stand({ a1: [-34, 4], a2: [-36, 4], torso: -6, neck: -3 }),
    ],
  },
  seated_chest_opener_hands_back: {
    caption: 'Hands on the lower back, elbows squeeze',
    step: 1.1,
    hold: 0.9,
    frames: [sit({ a1: [-14, 76], a2: [-16, 76], torso: 6 }), sit({ a1: [-30, 88], a2: [-32, 88], torso: -4, neck: -2 })],
  },

  // ---------------------------------------------------------------- thoracic
  thoracic_extension_chair: {
    caption: 'Arch the upper back over the chair',
    step: 1.2,
    hold: 0.9,
    frames: [
      sit({ a1: [150, 120], a2: [148, 120], torso: 8 }),
      sit({ a1: [150, 120], a2: [148, 120], torso: -22, neck: -6 }),
    ],
  },
  foam_roller_thoracic_extension: {
    caption: 'Extend over the roller, hands supporting the head',
    step: 1.2,
    hold: 0.9,
    frames: [
      supine({ y: 160, a1: [120, 110], a2: [120, 110], torso: 6, props: ['mat', 'roller'] }),
      supine({ y: 160, a1: [120, 110], a2: [120, 110], torso: -16, neck: -8, props: ['mat', 'roller'] }),
    ],
  },
  seated_thoracic_rotation: {
    caption: 'Rotate the ribcage, hips stay square',
    step: 1.4,
    hold: 0.9,
    frames: [
      sitFront({ a1: [100, 118], a2: [100, 118], torso: -12, turn: -0.9 }),
      sitFront({ a1: [100, 118], a2: [100, 118], torso: 0, turn: 0 }),
      sitFront({ a1: [100, 118], a2: [100, 118], torso: 12, turn: 0.9 }),
    ],
  },
  open_book_rotation: {
    caption: 'Top arm opens like a book',
    step: 1.5,
    hold: 1.1,
    frames: [
      sideLying({ a1: [92, 4], a2: [92, 4], l1: [86, 92], l2: [86, 92] }),
      sideLying({ a1: [92, 4], a2: [-40, 10], l1: [86, 92], l2: [86, 92], turn: 0.6 }),
    ],
  },
  thread_the_needle: {
    caption: 'Thread the arm under, then open up',
    step: 1.4,
    hold: 1,
    frames: [
      quad({ a1: [92, 0], a2: [92, 0] }),
      quad({ a1: [124, 70], a2: [92, 0], torso: -16, neck: 16, y: 128 }),
      quad({ a1: [24, 6], a2: [92, 0], torso: -22, neck: -10, y: 126 }),
    ],
  },
  quadruped_thoracic_rotation: {
    caption: 'Hand behind the head, elbow rotates up',
    step: 1.3,
    hold: 0.9,
    frames: [
      quad({ a1: [130, 118], a2: [92, 0], torso: -2 }),
      quad({ a1: [46, 110], a2: [92, 0], torso: -18, neck: -12 }),
    ],
  },
  standing_thoracic_rotation: {
    caption: 'Arms crossed, rotate over fixed hips',
    step: 1.3,
    hold: 0.8,
    frames: [
      standFront({ a1: [96, 116], a2: [96, 116], torso: -12, turn: -0.9 }),
      standFront({ a1: [96, 116], a2: [96, 116], torso: 0, turn: 0 }),
      standFront({ a1: [96, 116], a2: [96, 116], torso: 12, turn: 0.9 }),
    ],
  },
  wall_thoracic_rotation: {
    caption: 'Rotate to place both palms on the wall',
    step: 1.3,
    hold: 1,
    frames: [
      standFront({ a1: [94, 12], a2: [94, 12], turn: 0, props: ['floor', 'wall-left'] }),
      standFront({ a1: [108, 20], a2: [86, 40], torso: -12, turn: -0.9, props: ['floor', 'wall-left'] }),
    ],
  },
  cat_cow: {
    caption: 'Round the spine, then lift the chest',
    step: 1.3,
    hold: 0.7,
    frames: [
      quad({ torso: 14, neck: 24, head: 10, y: 118 }),
      quad({ torso: -12, neck: -14, head: -6, y: 126 }),
    ],
  },
  seated_cat_cow: {
    caption: 'Round, then open the chest',
    step: 1.3,
    hold: 0.7,
    frames: [
      sit({ torso: 24, neck: 18, head: 8, a1: [64, 40], a2: [62, 40] }),
      sit({ torso: -8, neck: -8, head: -4, a1: [48, 34], a2: [46, 34] }),
    ],
  },
  standing_side_bend: {
    caption: 'Reach overhead and bend to the side',
    step: 1.4,
    hold: 1.2,
    frames: [
      standFront({ a1: [176, 6], a2: [8, 6], torso: 16 }),
      standFront({ a1: [8, 6], a2: [176, 6], torso: -16 }),
    ],
  },
  sphinx_pose: {
    caption: 'Prop on the forearms, chest lifts',
    step: 1.5,
    hold: 1.5,
    frames: [
      prone({ a1: [86, 6], a2: [86, 6], torso: 0, y: 172 }),
      prone({ body: -66, a1: [96, 108], a2: [94, 108], torso: -4, neck: -8, x: 136, y: 170 }),
    ],
  },
  upper_back_release_ball_wall: {
    caption: 'Ball beside the spine, move the arm',
    step: 1.3,
    hold: 1,
    frames: [
      standFront({ x: 104, a1: [14, 10], a2: [14, 10], props: ['floor', 'wall-left', 'ball-shoulder'] }),
      standFront({ x: 104, a1: [128, 40], a2: [14, 10], props: ['floor', 'wall-left', 'ball-shoulder'] }),
    ],
  },

  // ------------------------------------------------------------------ wrists
  wrist_circles: {
    caption: 'Slow circles with the wrists',
    step: 0.5,
    hold: 0.1,
    loop: 'cycle',
    frames: [
      sitFront({ a1: [18, 96], a2: [18, 96] }),
      sitFront({ a1: [34, 104], a2: [34, 104] }),
      sitFront({ a1: [18, 118], a2: [18, 118] }),
      sitFront({ a1: [4, 104], a2: [4, 104] }),
    ],
  },
  wrist_flexor_stretch: {
    caption: 'Palm up, draw the fingers back',
    step: 1.3,
    hold: 1.2,
    frames: [
      sitFront({ a1: [96, 6], a2: [84, 62] }),
      sitFront({ a1: [84, 62], a2: [96, 6] }),
    ],
  },
  wrist_extensor_stretch: {
    caption: 'Palm down, press the back of the hand',
    step: 1.3,
    hold: 1.2,
    frames: [
      sitFront({ a1: [96, 14], a2: [86, 58] }),
      sitFront({ a1: [86, 58], a2: [96, 14] }),
    ],
  },
  prayer_stretch: {
    caption: 'Palms together, lower the hands',
    step: 1.2,
    hold: 1.1,
    frames: [sitFront({ a1: [46, 126], a2: [46, 126] }), sitFront({ a1: [20, 108], a2: [20, 108] })],
  },
  reverse_prayer_stretch: {
    caption: 'Backs of the hands together, raise up',
    step: 1.2,
    hold: 1.1,
    frames: [sitFront({ a1: [14, 92], a2: [14, 92] }), sitFront({ a1: [40, 122], a2: [40, 122] })],
  },
  tabletop_wrist_rocks: {
    caption: 'Palms flat, rock the weight through the wrists',
    step: 1,
    hold: 0.5,
    frames: [
      quad({ torso: -4, y: 122, a1: [92, 0], a2: [92, 0] }),
      quad({ torso: 4, y: 120, a1: [76, 0], a2: [76, 0] }),
    ],
  },
  finger_fans: {
    caption: 'Spread the fingers, then curl to a soft fist',
    step: 0.8,
    hold: 0.6,
    frames: [sitFront({ a1: [82, 46], a2: [82, 46] }), sitFront({ a1: [88, 70], a2: [88, 70] })],
  },
  forearm_rotation: {
    caption: 'Elbow at your side, turn the palm up and down',
    step: 0.9,
    hold: 0.7,
    frames: [sitFront({ a1: [16, 94], a2: [16, 94] }), sitFront({ a1: [16, 76], a2: [16, 76] })],
  },
  forearm_release_ball: {
    caption: 'Roll the forearm over the ball on the desk',
    step: 1.2,
    hold: 0.5,
    frames: [
      sit({ a1: [66, 56], a2: [16, 24], props: ['floor', 'chair', 'desk-right'] }),
      sit({ a1: [84, 40], a2: [16, 24], props: ['floor', 'chair', 'desk-right'] }),
    ],
  },
};
