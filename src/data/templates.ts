import type { BodyArea, FocusOption, RoutineTemplate } from '../types';

const NECK: BodyArea[] = ['neck'];
const NECK_ALL: BodyArea[] = ['neck', 'upper_trap', 'levator'];
const TRAPS: BodyArea[] = ['upper_trap', 'levator'];
const SHOULDERS: BodyArea[] = ['shoulders', 'scapula'];
const THORACIC: BodyArea[] = ['thoracic'];
const CHEST: BodyArea[] = ['chest'];
const THORACIC_CHEST: BodyArea[] = ['thoracic', 'chest'];
const UPPER_BACK: BodyArea[] = ['thoracic', 'scapula'];
const WRISTS: BodyArea[] = ['wrists', 'forearms'];
const HIPS: BodyArea[] = ['hips', 'hip_flexors', 'glutes', 'adductors'];
const HIPS_CORE: BodyArea[] = ['hips', 'hip_flexors', 'glutes'];
const LOWER_BACK: BodyArea[] = ['lower_back'];
const LEGS: BodyArea[] = ['hamstrings', 'quads', 'calves', 'ankles'];
const CALVES_ANKLES: BodyArea[] = ['calves', 'ankles'];
const GENERAL: BodyArea[] = ['wrists', 'forearms', 'thoracic', 'hamstrings', 'ankles'];

export const TEMPLATES: RoutineTemplate[] = [
  // ------------------------------------------------------------------ Neck focus
  {
    id: 'neck_gentle',
    family: 'neck',
    name: 'Gentle Neck Mobility',
    description: 'The most conservative option: small-range neck work, shoulder unloading and light upper-back movement.',
    minMinutes: 5,
    maxMinutes: 15,
    defaultMinutes: 8,
    position: 'any',
    maxCervicalLoad: 1,
    neckPriority: true,
    intensity: 'gentle',
    blocks: [
      { label: 'Unload the shoulders', areas: ['shoulders', 'upper_trap'], weight: 2 },
      { label: 'Gentle neck', areas: NECK, weight: 5, minSec: 90 },
      { label: 'Upper back support', areas: UPPER_BACK, weight: 3 },
    ],
  },
  {
    id: 'neck_shoulders',
    family: 'neck',
    name: 'Neck + Shoulders',
    description: 'Neck work paired with the shoulder and shoulder-blade muscles that hold the head up all day.',
    minMinutes: 5,
    maxMinutes: 15,
    defaultMinutes: 10,
    position: 'any',
    maxCervicalLoad: 2,
    neckPriority: true,
    intensity: 'gentle',
    blocks: [
      { label: 'Shoulders and blades', areas: SHOULDERS, weight: 4 },
      { label: 'Neck', areas: NECK_ALL, weight: 4, minSec: 90 },
      { label: 'Chest opener', areas: CHEST, weight: 1.5 },
    ],
  },
  {
    id: 'neck_upper_back',
    family: 'neck',
    name: 'Neck + Upper Back',
    description: 'Neck mobility plus the thoracic and shoulder-blade work that takes strain off the neck.',
    minMinutes: 5,
    maxMinutes: 15,
    defaultMinutes: 10,
    position: 'any',
    maxCervicalLoad: 2,
    neckPriority: true,
    intensity: 'gentle',
    blocks: [
      { label: 'Neck', areas: NECK_ALL, weight: 4, minSec: 90 },
      { label: 'Upper back', areas: UPPER_BACK, weight: 4 },
      { label: 'Traps and levator', areas: TRAPS, weight: 2 },
    ],
  },
  {
    id: 'neck_thoracic',
    family: 'neck',
    name: 'Neck + Thoracic Mobility',
    description: 'A thoracic-heavy session with a little neck work: great when the mid-back feels stiff.',
    minMinutes: 5,
    maxMinutes: 15,
    defaultMinutes: 10,
    position: 'any',
    maxCervicalLoad: 2,
    neckPriority: true,
    intensity: 'gentle',
    blocks: [
      { label: 'Neck', areas: NECK_ALL, weight: 3, minSec: 60 },
      { label: 'Thoracic spine', areas: THORACIC, weight: 5 },
      { label: 'Chest', areas: CHEST, weight: 2 },
    ],
  },
  {
    id: 'desk_neck_reset',
    family: 'neck',
    name: 'Desk Neck Reset',
    description: 'Seated or standing neck and shoulder reset you can do without leaving your desk.',
    minMinutes: 5,
    maxMinutes: 15,
    defaultMinutes: 6,
    position: 'desk',
    maxCervicalLoad: 2,
    neckPriority: true,
    intensity: 'gentle',
    blocks: [
      { label: 'Neck', areas: NECK_ALL, weight: 4, minSec: 90 },
      { label: 'Shoulders', areas: ['shoulders', 'scapula', 'upper_trap'], weight: 3 },
      { label: 'Upper back', areas: THORACIC_CHEST, weight: 2 },
    ],
  },
  {
    id: 'neck_evening',
    family: 'neck',
    name: 'Evening Neck Mobility',
    description: 'Slow, calming floor-friendly neck and chest work to unwind before bed.',
    minMinutes: 5,
    maxMinutes: 15,
    defaultMinutes: 10,
    position: 'any',
    maxCervicalLoad: 1,
    neckPriority: true,
    intensity: 'gentle',
    tags: ['evening'],
    blocks: [
      { label: 'Gentle neck', areas: NECK_ALL, weight: 4, minSec: 90 },
      { label: 'Open the chest', areas: THORACIC_CHEST, weight: 3 },
      { label: 'Let go', areas: ['upper_trap', 'shoulders', 'lower_back'], weight: 3 },
    ],
  },

  // ------------------------------------------------------------------ Quick desk reset
  {
    id: 'desk_neck_shoulders',
    family: 'desk',
    name: 'Desk Reset: Neck + Shoulders',
    description: 'Two to five minutes of neck and shoulder relief at the desk.',
    minMinutes: 2,
    maxMinutes: 5,
    defaultMinutes: 3,
    position: 'desk',
    maxCervicalLoad: 2,
    neckPriority: true,
    intensity: 'gentle',
    blocks: [
      { label: 'Neck', areas: NECK_ALL, weight: 3, minSec: 45 },
      { label: 'Shoulders', areas: SHOULDERS, weight: 2 },
    ],
  },
  {
    id: 'desk_thoracic_chest',
    family: 'desk',
    name: 'Desk Reset: Thoracic + Chest',
    description: 'Open the mid-back and chest after a long stretch of typing.',
    minMinutes: 2,
    maxMinutes: 5,
    defaultMinutes: 3,
    position: 'desk',
    maxCervicalLoad: 1,
    neckPriority: true,
    intensity: 'gentle',
    blocks: [
      { label: 'Thoracic spine', areas: THORACIC, weight: 3 },
      { label: 'Chest', areas: CHEST, weight: 2 },
    ],
  },
  {
    id: 'desk_wrists_shoulders',
    family: 'desk',
    name: 'Desk Reset: Wrists + Shoulders',
    description: 'Hands, forearms and shoulders after keyboard and mouse work.',
    minMinutes: 2,
    maxMinutes: 5,
    defaultMinutes: 3,
    position: 'desk',
    maxCervicalLoad: 1,
    neckPriority: true,
    intensity: 'gentle',
    blocks: [
      { label: 'Wrists and forearms', areas: WRISTS, weight: 3 },
      { label: 'Shoulders', areas: SHOULDERS, weight: 2 },
    ],
  },
  {
    id: 'desk_hips_upper_back',
    family: 'desk',
    name: 'Desk Reset: Hips + Upper Back',
    description: 'Stand up, open the hips and move the upper back.',
    minMinutes: 2,
    maxMinutes: 5,
    defaultMinutes: 4,
    position: 'desk',
    maxCervicalLoad: 1,
    neckPriority: true,
    intensity: 'gentle',
    blocks: [
      { label: 'Hips', areas: HIPS, weight: 3 },
      { label: 'Upper back', areas: UPPER_BACK, weight: 2 },
    ],
  },
  {
    id: 'desk_mixed',
    family: 'desk',
    name: 'Desk Reset: Mixed Full Body',
    description: 'A little of everything without leaving the desk area.',
    minMinutes: 2,
    maxMinutes: 5,
    defaultMinutes: 5,
    position: 'desk',
    maxCervicalLoad: 2,
    neckPriority: true,
    intensity: 'gentle',
    blocks: [
      { label: 'Neck and shoulders', areas: [...NECK_ALL, ...SHOULDERS], weight: 3, minSec: 45 },
      { label: 'Upper back', areas: THORACIC_CHEST, weight: 2 },
      { label: 'Hips and legs', areas: [...HIPS, ...LEGS], weight: 2 },
      { label: 'Wrists', areas: WRISTS, weight: 1 },
    ],
  },

  // ------------------------------------------------------------------ Upper body
  {
    id: 'upper_body',
    family: 'upper',
    name: 'Upper Body Mobility',
    description: 'Neck, shoulders, shoulder blades, thoracic spine, chest and wrists.',
    minMinutes: 5,
    maxMinutes: 15,
    defaultMinutes: 10,
    position: 'any',
    maxCervicalLoad: 2,
    neckPriority: true,
    intensity: 'normal',
    blocks: [
      { label: 'Neck', areas: NECK_ALL, weight: 2.5, minSec: 60 },
      { label: 'Shoulders and blades', areas: SHOULDERS, weight: 3 },
      { label: 'Thoracic spine', areas: THORACIC, weight: 2.5 },
      { label: 'Chest', areas: CHEST, weight: 1.5 },
      { label: 'Wrists', areas: WRISTS, weight: 1 },
    ],
  },

  // ------------------------------------------------------------------ Lower body
  {
    id: 'lower_body',
    family: 'lower',
    name: 'Lower Body Mobility',
    description: 'Hips, hip flexors, glutes, hamstrings, quads, calves and ankles.',
    minMinutes: 5,
    maxMinutes: 20,
    defaultMinutes: 12,
    position: 'any',
    maxCervicalLoad: 0,
    neckPriority: false,
    intensity: 'normal',
    blocks: [
      { label: 'Hips and hip flexors', areas: ['hips', 'hip_flexors'], weight: 3 },
      { label: 'Glutes', areas: ['glutes'], weight: 2 },
      { label: 'Hamstrings', areas: ['hamstrings'], weight: 2 },
      { label: 'Quads', areas: ['quads'], weight: 1.5 },
      { label: 'Inner thighs', areas: ['adductors'], weight: 1.5 },
      { label: 'Calves and ankles', areas: CALVES_ANKLES, weight: 2 },
    ],
  },

  // ------------------------------------------------------------------ Full body
  {
    id: 'full_quick',
    family: 'full',
    name: 'Quick Full Body',
    description: 'About five minutes touching the neck, upper back, hips and legs.',
    minMinutes: 4,
    maxMinutes: 7,
    defaultMinutes: 5,
    position: 'any',
    maxCervicalLoad: 2,
    neckPriority: true,
    intensity: 'gentle',
    blocks: [
      { label: 'Neck and shoulders', areas: [...NECK_ALL, ...SHOULDERS], weight: 3, minSec: 60 },
      { label: 'Thoracic and chest', areas: THORACIC_CHEST, weight: 2 },
      { label: 'Hips', areas: HIPS, weight: 2 },
      { label: 'Legs', areas: LEGS, weight: 1.5 },
    ],
  },
  {
    id: 'full_standard',
    family: 'full',
    name: 'Standard Full Body',
    description: 'A balanced ten-minute session with neck and upper back first.',
    minMinutes: 8,
    maxMinutes: 12,
    defaultMinutes: 10,
    position: 'any',
    maxCervicalLoad: 2,
    neckPriority: true,
    intensity: 'normal',
    blocks: [
      { label: 'Neck, upper back and shoulders', areas: [...NECK_ALL, ...SHOULDERS], weight: 4.5, minSec: 90 },
      { label: 'Thoracic and chest', areas: THORACIC_CHEST, weight: 2.5 },
      { label: 'Hips', areas: HIPS, weight: 2.5 },
      { label: 'Legs', areas: LEGS, weight: 2 },
      { label: 'Wrists and general', areas: GENERAL, weight: 1.5 },
    ],
  },
  {
    id: 'full_extended',
    family: 'full',
    name: 'Extended Full Body',
    description: 'Fifteen to twenty minutes covering every area with extra neck and upper-back time.',
    minMinutes: 13,
    maxMinutes: 20,
    defaultMinutes: 15,
    position: 'any',
    maxCervicalLoad: 2,
    neckPriority: true,
    intensity: 'normal',
    blocks: [
      { label: 'Neck', areas: NECK_ALL, weight: 3, minSec: 120 },
      { label: 'Shoulders and blades', areas: SHOULDERS, weight: 2.5 },
      { label: 'Thoracic and chest', areas: THORACIC_CHEST, weight: 2.5 },
      { label: 'Hips', areas: HIPS, weight: 2.5 },
      { label: 'Lower back', areas: LOWER_BACK, weight: 1 },
      { label: 'Legs', areas: LEGS, weight: 2 },
      { label: 'Wrists and general', areas: WRISTS, weight: 1 },
    ],
  },
  {
    id: 'full_deep',
    family: 'full',
    name: 'Deep Mobility Session',
    description: 'Twenty to thirty minutes of thorough, unhurried full-body mobility with floor work.',
    minMinutes: 18,
    maxMinutes: 30,
    defaultMinutes: 25,
    position: 'any',
    maxCervicalLoad: 2,
    neckPriority: true,
    intensity: 'normal',
    blocks: [
      { label: 'Neck', areas: NECK_ALL, weight: 3, minSec: 150 },
      { label: 'Shoulders and blades', areas: SHOULDERS, weight: 3 },
      { label: 'Thoracic spine', areas: THORACIC, weight: 2.5 },
      { label: 'Chest', areas: CHEST, weight: 1.5 },
      { label: 'Lower back and core', areas: LOWER_BACK, weight: 2 },
      { label: 'Hips', areas: HIPS_CORE, weight: 3 },
      { label: 'Inner thighs', areas: ['adductors'], weight: 1.5 },
      { label: 'Legs', areas: LEGS, weight: 2.5 },
      { label: 'Wrists', areas: WRISTS, weight: 1 },
    ],
  },
];

const templateById = new Map(TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string): RoutineTemplate | undefined {
  return templateById.get(id);
}

export function templatesForFamily(family: RoutineTemplate['family']): RoutineTemplate[] {
  return TEMPLATES.filter((t) => t.family === family);
}

/** Order used for rotating Quick Desk Reset sub-focus. */
export const DESK_RESET_ROTATION = [
  'desk_neck_shoulders',
  'desk_thoracic_chest',
  'desk_wrists_shoulders',
  'desk_hips_upper_back',
  'desk_mixed',
];

/** Build an ad-hoc template from a focus filter and a duration. */
export function customTemplate(focus: FocusOption, minutes: number): RoutineTemplate {
  const base: Omit<RoutineTemplate, 'id' | 'name' | 'description' | 'blocks'> = {
    family: 'custom',
    minMinutes: 2,
    maxMinutes: 30,
    defaultMinutes: minutes,
    position: 'any',
    maxCervicalLoad: 2,
    neckPriority: true,
    intensity: 'normal',
  };
  switch (focus) {
    case 'neck':
      return {
        ...base,
        id: 'custom_neck',
        name: 'Neck Focus',
        description: 'Neck first, with supporting upper-back and shoulder work.',
        intensity: 'gentle',
        blocks: [
          { label: 'Neck', areas: NECK_ALL, weight: 5, minSec: 90 },
          { label: 'Upper back', areas: UPPER_BACK, weight: 3 },
          { label: 'Shoulders and chest', areas: ['shoulders', 'chest'], weight: 2 },
        ],
      };
    case 'upper_back':
      return {
        ...base,
        id: 'custom_upper_back',
        name: 'Upper Back Focus',
        description: 'Thoracic spine and shoulder blades, with a little neck work.',
        blocks: [
          { label: 'Thoracic spine', areas: THORACIC, weight: 5 },
          { label: 'Shoulder blades', areas: ['scapula'], weight: 3 },
          { label: 'Neck', areas: NECK_ALL, weight: 2, minSec: 45 },
        ],
      };
    case 'shoulders':
      return {
        ...base,
        id: 'custom_shoulders',
        name: 'Shoulder Focus',
        description: 'Shoulder mobility and control, chest opening and neck support.',
        blocks: [
          { label: 'Shoulders and blades', areas: SHOULDERS, weight: 5 },
          { label: 'Chest', areas: CHEST, weight: 2 },
          { label: 'Neck and traps', areas: NECK_ALL, weight: 2, minSec: 45 },
        ],
      };
    case 'upper_body':
      return { ...getTemplate('upper_body')!, id: 'custom_upper_body', family: 'custom' };
    case 'hips':
      return {
        ...base,
        id: 'custom_hips',
        name: 'Hip Focus',
        description: 'Hip flexors, glutes, inner thighs and hip rotation.',
        neckPriority: false,
        maxCervicalLoad: 0,
        blocks: [
          { label: 'Hips and hip flexors', areas: ['hips', 'hip_flexors'], weight: 4 },
          { label: 'Glutes', areas: ['glutes'], weight: 3 },
          { label: 'Inner thighs', areas: ['adductors'], weight: 2 },
          { label: 'Lower back', areas: LOWER_BACK, weight: 1 },
        ],
      };
    case 'lower_body':
      return { ...getTemplate('lower_body')!, id: 'custom_lower_body', family: 'custom' };
    case 'desk':
      return { ...getTemplate('desk_mixed')!, id: 'custom_desk', family: 'custom', minMinutes: 2, maxMinutes: 15 };
    case 'full_body':
    default: {
      const src =
        minutes <= 7 ? 'full_quick' : minutes <= 12 ? 'full_standard' : minutes <= 20 ? 'full_extended' : 'full_deep';
      return { ...getTemplate(src)!, id: 'custom_full_body', family: 'custom', minMinutes: 2, maxMinutes: 30 };
    }
  }
}

/** Pick the full-body template that best matches a duration. */
export function fullBodyTemplateFor(minutes: number): RoutineTemplate {
  if (minutes <= 7) return getTemplate('full_quick')!;
  if (minutes <= 12) return getTemplate('full_standard')!;
  if (minutes <= 20) return getTemplate('full_extended')!;
  return getTemplate('full_deep')!;
}
