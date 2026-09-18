import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../../data/exercises';
import { TEMPLATES } from '../../data/templates';
import { BODY_AREAS, EQUIPMENT, INTENSITY_RANK, POSITIONS } from '../../types';

describe('exercise library', () => {
  it('has unique ids and a large library', () => {
    const ids = new Set(EXERCISES.map((e) => e.id));
    expect(ids.size).toBe(EXERCISES.length);
    expect(EXERCISES.length).toBeGreaterThanOrEqual(100);
  });

  it('covers every body area with several primary exercises', () => {
    for (const area of BODY_AREAS) {
      const count = EXERCISES.filter((e) => e.primary.includes(area)).length;
      expect(count, area).toBeGreaterThanOrEqual(3);
    }
  });

  it('provides multiple variants for key movement categories', () => {
    const required: Record<string, number> = {
      chin_tuck: 3,
      cervical_rotation: 3,
      cervical_lateral: 2,
      upper_trap_stretch: 3,
      levator_stretch: 2,
      scapular_retraction: 2,
      shoulder_rolls: 2,
      shoulder_car: 3,
      pec_stretch: 4,
      thoracic_extension: 2,
      thoracic_rotation: 5,
      hip_flexor_stretch: 3,
      glute_stretch: 3,
      hamstring_stretch: 3,
      quad_stretch: 3,
      calf_stretch: 3,
      ankle_mobility: 3,
      adductor_stretch: 4,
    };
    for (const [cat, min] of Object.entries(required)) {
      const count = EXERCISES.filter((e) => e.category === cat).length;
      expect(count, cat).toBeGreaterThanOrEqual(min);
    }
  });

  it('keeps cervical work conservative', () => {
    for (const e of EXERCISES) {
      if (e.cervicalLoad > 0) {
        expect(INTENSITY_RANK[e.intensity], e.id).toBeLessThanOrEqual(INTENSITY_RANK.gentle);
      }
    }
  });

  it('has complete content for every exercise', () => {
    for (const e of EXERCISES) {
      expect(e.instructions.length, e.id).toBeGreaterThanOrEqual(3);
      expect(e.mistakes.length, e.id).toBeGreaterThanOrEqual(2);
      expect(e.cautions.length, e.id).toBeGreaterThanOrEqual(1);
      expect(e.demo.length, e.id).toBeGreaterThanOrEqual(2);
      expect(e.breathing.length, e.id).toBeGreaterThan(10);
      expect(e.easier.length, e.id).toBeGreaterThan(5);
      expect(e.variation.length, e.id).toBeGreaterThan(5);
      expect(e.positions.length, e.id).toBeGreaterThanOrEqual(1);
      expect(e.primary.length, e.id).toBeGreaterThanOrEqual(1);
      expect(e.durationSec, e.id).toBeGreaterThanOrEqual(30);
      for (const p of e.positions) expect(POSITIONS).toContain(p);
      for (const eq of e.equipment) expect(EQUIPMENT).toContain(eq);
      if (e.deskFriendly) {
        expect(e.positions.some((p) => p === 'seated' || p === 'standing'), e.id).toBe(true);
      }
    }
  });

  it('has plenty of desk-friendly and equipment-free options', () => {
    expect(EXERCISES.filter((e) => e.deskFriendly).length).toBeGreaterThanOrEqual(50);
    expect(EXERCISES.filter((e) => e.equipment.length === 0).length).toBeGreaterThanOrEqual(35);
  });
});

describe('templates', () => {
  it('have unique ids, valid ranges and non-empty blocks', () => {
    const ids = new Set(TEMPLATES.map((t) => t.id));
    expect(ids.size).toBe(TEMPLATES.length);
    for (const t of TEMPLATES) {
      expect(t.minMinutes).toBeLessThanOrEqual(t.defaultMinutes);
      expect(t.defaultMinutes).toBeLessThanOrEqual(t.maxMinutes);
      expect(t.blocks.length).toBeGreaterThan(0);
      for (const b of t.blocks) {
        expect(b.areas.length).toBeGreaterThan(0);
        for (const a of b.areas) expect(BODY_AREAS).toContain(a);
        // every block must have at least one equipment-free candidate
        const cands = EXERCISES.filter((e) => e.primary.some((a) => b.areas.includes(a)));
        expect(cands.length, `${t.id}/${b.label}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('offers the required routine families', () => {
    const fam = (f: string) => TEMPLATES.filter((t) => t.family === f).length;
    expect(fam('neck')).toBeGreaterThanOrEqual(6);
    expect(fam('desk')).toBeGreaterThanOrEqual(5);
    expect(fam('full')).toBe(4);
    expect(fam('upper')).toBe(1);
    expect(fam('lower')).toBe(1);
  });
});
