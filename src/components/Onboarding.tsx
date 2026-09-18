import { useState } from 'react';
import type { Equipment, Intensity, Profile } from '../types';
import { EQUIPMENT, EQUIPMENT_LABELS, INTENSITY_LABELS } from '../types';
import { Chip, Seg, Toggle } from './common';

export function Onboarding({ onDone }: { onDone: (patch: Partial<Profile>) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [neckPriority, setNeckPriority] = useState(true);
  const [avoidNeckAdvised, setAvoidNeckAdvised] = useState(false);
  const [acuteSymptoms, setAcuteSymptoms] = useState(false);
  const [intensity, setIntensity] = useState<Intensity>('gentle');
  const [minutes, setMinutes] = useState(10);
  const [equipment, setEquipment] = useState<Equipment[]>(['chair', 'wall', 'mat']);
  const [worksAtDesk, setWorksAtDesk] = useState(true);

  const finish = () =>
    onDone({
      name: name.trim(),
      neckPriority,
      neckExercisesEnabled: !avoidNeckAdvised,
      avoidNeckAdvised,
      acuteSymptoms,
      defaultIntensity: acuteSymptoms && intensity === 'normal' ? 'gentle' : intensity,
      defaultMinutes: minutes,
      ownedEquipment: equipment,
      worksAtDesk,
    });

  return (
    <div className="screen" style={{ paddingTop: 40 }}>
      <div className="stack-sm">
        <div className="brand">
          <span className="dot" /> DailyStretch
        </div>
        <h1>{step === 0 ? 'A mobility routine that adapts to you' : step === 1 ? 'A few safety questions' : 'Your defaults'}</h1>
        <p className="muted">
          {step === 0
            ? 'Neck and upper-back comfort first, full-body mobility always, and enough variety that it never gets boring.'
            : step === 1
              ? 'These keep every routine on the conservative side. You can change them later in Settings.'
              : 'Used to pre-fill routines. Every routine can still be adjusted before you start.'}
        </p>
      </div>

      {step === 0 && (
        <div className="card stack">
          <div className="field">
            <label htmlFor="name">What should we call you? (optional)</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <Toggle label="Neck and upper back are my main concern" hint="Most routines will include a little gentle neck and upper-back work." value={neckPriority} onChange={setNeckPriority} />
        </div>
      )}

      {step === 1 && (
        <div className="card stack">
          <Toggle
            label="I have been advised to avoid direct neck exercises"
            hint="If on, routines skip direct neck movement and work the surrounding areas instead."
            value={avoidNeckAdvised}
            onChange={setAvoidNeckAdvised}
          />
          <Toggle
            label="I have acute pain or a recent injury right now"
            hint="Caps every routine at gentle intensity and small ranges. Please follow your clinician's advice first."
            value={acuteSymptoms}
            onChange={setAcuteSymptoms}
          />
          <p className="small muted">
            This app offers general mobility guidance and is not medical advice. Stop any movement that causes sharp pain, dizziness, numbness or tingling.
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="card stack">
          <div className="field">
            <span className="label">Default intensity</span>
            <Seg
              options={(['very_gentle', 'gentle', 'normal'] as Intensity[]).map((v) => ({ value: v, label: INTENSITY_LABELS[v] }))}
              value={intensity}
              onChange={setIntensity}
            />
          </div>
          <div className="field">
            <span className="label">Typical session length</span>
            <div className="chip-row">
              {[5, 10, 15, 20].map((m) => (
                <Chip key={m} active={minutes === m} onClick={() => setMinutes(m)}>
                  {m} min
                </Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="label">Equipment you usually have</span>
            <div className="chip-row">
              {EQUIPMENT.map((eq) => (
                <Chip key={eq} active={equipment.includes(eq)} onClick={() => setEquipment((list) => (list.includes(eq) ? list.filter((x) => x !== eq) : [...list, eq]))}>
                  {EQUIPMENT_LABELS[eq]}
                </Chip>
              ))}
            </div>
          </div>
          <Toggle label="I mostly work at a desk" hint="Suggests desk-friendly routines by default." value={worksAtDesk} onChange={setWorksAtDesk} />
        </div>
      )}

      <div className="row between">
        <button className="btn btn-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </button>
        {step < 2 ? (
          <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
            Continue
          </button>
        ) : (
          <button className="btn btn-primary" onClick={finish}>
            Start stretching
          </button>
        )}
      </div>
    </div>
  );
}
