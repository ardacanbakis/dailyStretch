import { useRef, useState } from 'react';
import type { Equipment, Intensity } from '../types';
import { EQUIPMENT, EQUIPMENT_LABELS, INTENSITY_LABELS } from '../types';
import { EXERCISES } from '../data/exercises';
import { actions, useAppState } from '../state/store';
import { Chip, Seg, Toggle } from './common';

export function Settings() {
  const state = useAppState();
  const p = state.profile;
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const excludedCount = Object.values(state.feedback).filter((f) => f.excluded).length;
  const painCount = Object.values(state.feedback).filter((f) => f.painful.length > 0 && Date.now() - f.painful[f.painful.length - 1] < p.painAvoidDays * 86400000).length;

  const exportData = () => {
    const blob = new Blob([actions.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dailystretch-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File | undefined) => {
    if (!file) return;
    const ok = actions.importJson(await file.text());
    setMessage(ok ? 'Data imported.' : 'That file could not be imported.');
  };

  return (
    <div className="screen">
      <h1>Settings</h1>

      <div className="card stack-sm">
        <h3>Profile</h3>
        <div className="field">
          <label htmlFor="pname">Name</label>
          <input id="pname" className="input" value={p.name} onChange={(e) => actions.updateProfile({ name: e.target.value })} />
        </div>
        <Toggle label="Neck and upper back are my priority" hint="Most routines include a little gentle neck and upper-back work." value={p.neckPriority} onChange={(v) => actions.updateProfile({ neckPriority: v })} />
        <Toggle label="Neck exercises enabled" hint="Turn off to remove direct neck movement from every routine." value={p.neckExercisesEnabled} onChange={(v) => actions.updateProfile({ neckExercisesEnabled: v })} />
        <Toggle label="Advised to avoid neck exercises" hint="From onboarding. Also removes direct neck work." value={p.avoidNeckAdvised} onChange={(v) => actions.updateProfile({ avoidNeckAdvised: v })} />
        <Toggle label="Acute pain or recent injury" hint="Caps intensity at gentle and cervical range at small." value={p.acuteSymptoms} onChange={(v) => actions.updateProfile({ acuteSymptoms: v })} />
        <Toggle label="Ask the daily check-in" hint="Show the quick body check-in on the Today screen." value={p.askCheckIn} onChange={(v) => actions.updateProfile({ askCheckIn: v })} />
        <Toggle label="I mostly work at a desk" hint="Defaults routines to desk-friendly positions." value={p.worksAtDesk} onChange={(v) => actions.updateProfile({ worksAtDesk: v })} />
      </div>

      <div className="card stack">
        <h3>Defaults</h3>
        <div className="field">
          <span className="label">Intensity</span>
          <Seg options={(['very_gentle', 'gentle', 'normal'] as Intensity[]).map((v) => ({ value: v, label: INTENSITY_LABELS[v] }))} value={p.defaultIntensity} onChange={(v) => actions.updateProfile({ defaultIntensity: v })} />
        </div>
        <div className="field">
          <span className="label">Session length</span>
          <div className="chip-row">
            {[2, 5, 10, 15, 20, 30].map((m) => (
              <Chip key={m} active={p.defaultMinutes === m} onClick={() => actions.updateProfile({ defaultMinutes: m })}>
                {m} min
              </Chip>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="label">Equipment I own</span>
          <div className="chip-row">
            {EQUIPMENT.map((eq) => (
              <Chip
                key={eq}
                active={p.ownedEquipment.includes(eq)}
                onClick={() => {
                  const next: Equipment[] = p.ownedEquipment.includes(eq) ? p.ownedEquipment.filter((x) => x !== eq) : [...p.ownedEquipment, eq];
                  actions.updateProfile({ ownedEquipment: next });
                }}
              >
                {EQUIPMENT_LABELS[eq]}
              </Chip>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="label">Avoid painful exercises for</span>
          <div className="chip-row">
            {[7, 14, 30].map((d) => (
              <Chip key={d} active={p.painAvoidDays === d} onClick={() => actions.updateProfile({ painAvoidDays: d })}>
                {d} days
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="card stack-sm">
        <h3>Personalisation</h3>
        <div className="small muted">
          {EXERCISES.length} exercises in the library · {excludedCount} excluded · {painCount} currently paused after pain reports
        </div>
        <div className="small muted">Manage flags per exercise from the Library.</div>
      </div>

      <div className="card stack-sm">
        <h3>Data</h3>
        <div className="small muted">Everything is stored on this device only.</div>
        <div className="row wrap">
          <button className="btn btn-sm" onClick={exportData}>
            Export JSON
          </button>
          <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={(e) => importData(e.target.files?.[0])} />
          <button
            className="btn btn-sm btn-danger"
            onClick={() => {
              if (window.confirm('Reset all data, history and preferences? This cannot be undone.')) {
                actions.resetAll();
                setMessage('All data reset.');
              }
            }}
          >
            Reset everything
          </button>
        </div>
        {message && <div className="small">{message}</div>}
      </div>

      <p className="tiny muted">
        DailyStretch offers general mobility guidance and is not a substitute for medical advice. Stop any movement that causes sharp pain, dizziness, numbness or tingling, and consult a clinician about persistent symptoms.
      </p>
    </div>
  );
}
