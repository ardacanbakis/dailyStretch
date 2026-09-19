import { useCallback, useEffect, useRef, useState } from 'react';
import type { SetLog, WorkoutExercise, WorkoutItemRecord, WorkoutPlan, WorkoutSession } from '../../workout/types';
import { getExercise } from '../../data/exercises';
import { ExerciseFigure } from '../../figure/Figure';
import { datasetAttribution } from '../../workout/data';
import { useAppState } from '../../state/store';
import { Chip, fmtClock, fmtMin } from '../common';
import { WorkoutGif, WorkoutGifThumb } from './WorkoutGif';

type Phase = 'warmup' | 'main' | 'cooldown' | 'summary';

interface Props {
  plan: WorkoutPlan;
  byId: Map<string, WorkoutExercise>;
  onDone: (record: WorkoutSession | null) => void;
  onSwap: (index: number) => void;
}

const MOBILITY_SEC = 45;

export function WorkoutPlayer({ plan, byId, onDone, onSwap }: Props) {
  const state = useAppState();
  const unit = state.workout.profile.unit;
  const [phase, setPhase] = useState<Phase>(plan.warmup.length ? 'warmup' : 'main');
  const [mobIndex, setMobIndex] = useState(0);
  const [mobLeft, setMobLeft] = useState(MOBILITY_SEC);
  const [index, setIndex] = useState(0);
  const [logs, setLogs] = useState<Record<string, SetLog[]>>(() => {
    const init: Record<string, SetLog[]> = {};
    for (const item of plan.items) {
      init[item.exerciseId] = Array.from({ length: item.sets }, () => ({
        reps: item.mode === 'time' ? 0 : item.target,
        weight: item.weight ?? 0,
        seconds: item.mode === 'time' ? item.target : undefined,
        done: false,
      }));
    }
    return init;
  });
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [rest, setRest] = useState<number | null>(null);
  const [effort, setEffort] = useState<number | undefined>(undefined);
  const [note, setNote] = useState('');
  const startedAt = useRef(Date.now());

  const item = plan.items[index];
  const exercise = item ? byId.get(item.exerciseId) : undefined;

  // Rest countdown.
  useEffect(() => {
    if (rest === null) return;
    if (rest <= 0) {
      setRest(null);
      return;
    }
    const id = window.setTimeout(() => setRest((r) => (r === null ? null : r - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [rest]);

  // Warm-up / cool-down countdown.
  const mobList = phase === 'warmup' ? plan.warmup : phase === 'cooldown' ? plan.cooldown : [];
  const advanceMobility = useCallback(() => {
    if (mobIndex + 1 < mobList.length) {
      setMobIndex(mobIndex + 1);
      setMobLeft(MOBILITY_SEC);
    } else {
      setMobIndex(0);
      setMobLeft(MOBILITY_SEC);
      setPhase(phase === 'warmup' ? 'main' : 'summary');
    }
  }, [mobIndex, mobList.length, phase]);

  useEffect(() => {
    if (phase !== 'warmup' && phase !== 'cooldown') return;
    if (mobLeft <= 0) {
      advanceMobility();
      return;
    }
    const id = window.setTimeout(() => setMobLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, mobLeft, advanceMobility]);

  const setLog = (exId: string, i: number, patch: Partial<SetLog>) => {
    setLogs((l) => ({ ...l, [exId]: l[exId].map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  };

  const toggleDone = (i: number) => {
    if (!item || !exercise) return;
    const current = logs[item.exerciseId][i];
    setLog(item.exerciseId, i, { done: !current.done });
    if (!current.done && i + 1 < item.sets) setRest(item.restSec);
  };

  const buildRecord = (completed: boolean): WorkoutSession => {
    const endedAt = Date.now();
    const items: WorkoutItemRecord[] = plan.items.map((it) => ({
      exerciseId: it.exerciseId,
      mode: it.mode,
      sets: logs[it.exerciseId] ?? [],
      skipped: skipped.has(it.exerciseId),
    }));
    const volume = items.reduce(
      (s, it) => s + it.sets.filter((x) => x.done).reduce((a, x) => a + x.weight * (x.reps || 0), 0),
      0,
    );
    return {
      id: `ws_${endedAt.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`,
      planId: plan.id,
      templateId: plan.templateId,
      name: plan.name,
      startedAt: startedAt.current,
      endedAt,
      durationSec: Math.round((endedAt - startedAt.current) / 1000),
      items,
      completed,
      volume: Math.round(volume),
      note: note.trim() || undefined,
      effort,
    };
  };

  const finish = () => {
    if (plan.cooldown.length && phase === 'main') {
      setPhase('cooldown');
      setMobIndex(0);
      setMobLeft(MOBILITY_SEC);
      return;
    }
    setPhase('summary');
  };

  const endEarly = () => {
    const anyDone = Object.values(logs).some((sets) => sets.some((s) => s.done));
    if (!anyDone) {
      if (window.confirm('Leave this workout? Nothing has been logged yet.')) onDone(null);
      return;
    }
    if (window.confirm('Finish here and log the sets you completed?')) setPhase('summary');
  };

  // ------------------------------------------------------------- mobility phase
  if (phase === 'warmup' || phase === 'cooldown') {
    const id = mobList[mobIndex];
    const ex = id ? getExercise(id) : undefined;
    if (!ex) {
      return (
        <div className="screen">
          <button className="btn" onClick={() => setPhase(phase === 'warmup' ? 'main' : 'summary')}>
            Continue
          </button>
        </div>
      );
    }
    return (
      <div className="session">
        <div className="row between">
          <button className="btn btn-ghost btn-sm" onClick={endEarly}>
            ✕ End
          </button>
          <div className="small muted">
            {phase === 'warmup' ? 'Warm-up' : 'Cool-down'} {mobIndex + 1}/{mobList.length}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setPhase(phase === 'warmup' ? 'main' : 'summary')}>
            Skip all
          </button>
        </div>
        <div className="stack-sm" style={{ textAlign: 'center' }}>
          <h1>{ex.name}</h1>
          <div className="muted small">{ex.summary}</div>
        </div>
        <div className="session-visual">
          <div className="side-by-side">
            <div className="figure-stage">
              <ExerciseFigure exerciseId={ex.id} />
            </div>
            <div className="timer">
              <div className="digits">{fmtClock(mobLeft)}</div>
            </div>
          </div>
          <div className="cue">{ex.demo[Math.min(ex.demo.length - 1, Math.floor(((MOBILITY_SEC - mobLeft) / MOBILITY_SEC) * ex.demo.length))]}</div>
        </div>
        <div className="controls">
          <button className="btn" onClick={() => setMobLeft((s) => s + 20)}>
            +20 s
          </button>
          <button className="btn btn-primary btn-lg" onClick={advanceMobility}>
            ✓ Next
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------- summary phase
  if (phase === 'summary') {
    const doneSets = Object.values(logs).reduce((s, sets) => s + sets.filter((x) => x.done).length, 0);
    const totalSets = plan.items.reduce((s, i) => s + i.sets, 0);
    const volume = Object.entries(logs).reduce(
      (s, [, sets]) => s + sets.filter((x) => x.done).reduce((a, x) => a + x.weight * (x.reps || 0), 0),
      0,
    );
    return (
      <div className="screen" style={{ paddingTop: 24 }}>
        <div className="stack-sm">
          <h1>Workout logged</h1>
          <p className="muted">
            {plan.name} · {doneSets} of {totalSets} sets · {fmtMin(Math.round((Date.now() - startedAt.current) / 1000))}
          </p>
        </div>
        <div className="stat-grid">
          <div className="stat">
            <div className="value">{doneSets}</div>
            <div className="name">sets done</div>
          </div>
          <div className="stat">
            <div className="value">{Math.round(volume)}</div>
            <div className="name">volume ({unit})</div>
          </div>
          <div className="stat">
            <div className="value">{plan.items.length}</div>
            <div className="name">exercises</div>
          </div>
        </div>
        <div className="card stack-sm">
          <div className="field">
            <span className="label">How hard was that?</span>
            <div className="chip-row">
              {[1, 2, 3, 4, 5].map((n) => (
                <Chip key={n} active={effort === n} onClick={() => setEffort(effort === n ? undefined : n)}>
                  {['Easy', 'Light', 'Moderate', 'Hard', 'All out'][n - 1]}
                </Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="wnote">Note (optional)</label>
            <textarea id="wnote" className="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <div className="row">
          <button className="btn grow" onClick={() => onDone(null)}>
            Discard
          </button>
          <button className="btn btn-primary btn-lg grow" onClick={() => onDone(buildRecord(doneSets === totalSets))}>
            Save workout
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------- main phase
  if (!item || !exercise) {
    return (
      <div className="screen">
        <div className="card empty">This workout has no exercises.</div>
        <button className="btn" onClick={() => onDone(null)}>
          Back
        </button>
      </div>
    );
  }

  const sets = logs[item.exerciseId] ?? [];
  const allDone = sets.every((s) => s.done);
  const next = plan.items[index + 1] ? byId.get(plan.items[index + 1].exerciseId) : undefined;

  return (
    <div className="session">
      <div className="row between">
        <button className="btn btn-ghost btn-sm" onClick={endEarly}>
          ✕ End
        </button>
        <div className="small muted">
          {index + 1} / {plan.items.length} · {item.block}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => onSwap(index)}>
          Swap
        </button>
      </div>
      <div className="progress" aria-hidden>
        <div className="fill" style={{ width: `${((index + (allDone ? 1 : 0)) / plan.items.length) * 100}%` }} />
      </div>

      <div className="stack-sm" style={{ textAlign: 'center' }}>
        <h1>{exercise.name}</h1>
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          <span className="badge accent">
            {item.sets} × {item.mode === 'time' ? `${item.target} s` : `${item.target} reps`}
          </span>
          <span className="badge">{exercise.equipment}</span>
          <span className="badge">{exercise.target}</span>
        </div>
      </div>

      <WorkoutGif exercise={exercise} />
      <div className="attribution">{datasetAttribution()}</div>

      {rest !== null && (
        <div className="rest-banner">
          <div className="small muted">Rest</div>
          <div className="big">{fmtClock(rest)}</div>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn btn-sm" onClick={() => setRest((r) => (r ?? 0) + 20)}>
              +20 s
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => setRest(null)}>
              Skip rest
            </button>
          </div>
        </div>
      )}

      <div className="card stack-sm">
        <div className="set-head">
          <span>Set</span>
          <span>{item.mode === 'time' ? 'Seconds' : 'Reps'}</span>
          <span>Weight ({unit})</span>
          <span>Done</span>
        </div>
        {sets.map((s, i) => (
          <div key={i} className="set-row">
            <span className="idx">{i + 1}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={item.mode === 'time' ? (s.seconds ?? 0) : s.reps}
              onChange={(e) => {
                const v = Math.max(0, Number(e.target.value) || 0);
                setLog(item.exerciseId, i, item.mode === 'time' ? { seconds: v, reps: 1 } : { reps: v });
              }}
              aria-label={`Set ${i + 1} ${item.mode === 'time' ? 'seconds' : 'reps'}`}
            />
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.5"
              value={s.weight}
              onChange={(e) => setLog(item.exerciseId, i, { weight: Math.max(0, Number(e.target.value) || 0) })}
              aria-label={`Set ${i + 1} weight`}
            />
            <button className={`tick ${s.done ? 'on' : ''}`} onClick={() => toggleDone(i)} aria-label={`Mark set ${i + 1} done`} aria-pressed={s.done}>
              ✓
            </button>
          </div>
        ))}
        <div className="row wrap">
          <button
            className="btn btn-sm btn-ghost"
            onClick={() =>
              setLogs((l) => ({
                ...l,
                [item.exerciseId]: [...l[item.exerciseId], { ...l[item.exerciseId][l[item.exerciseId].length - 1], done: false }],
              }))
            }
          >
            + Add set
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              setSkipped((s) => new Set([...s, item.exerciseId]));
              if (index + 1 < plan.items.length) setIndex(index + 1);
              else finish();
            }}
          >
            Skip exercise
          </button>
        </div>
      </div>

      <div className="controls">
        <button className="btn" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>
          ⏮
        </button>
        {index + 1 < plan.items.length ? (
          <button className="btn btn-primary btn-lg" onClick={() => { setIndex(index + 1); setRest(null); }} style={{ minWidth: 150 }}>
            Next exercise →
          </button>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={finish} style={{ minWidth: 150 }}>
            Finish workout
          </button>
        )}
      </div>

      {next && (
        <div className="row" style={{ justifyContent: 'center' }}>
          <WorkoutGifThumb exercise={next} />
          <div className="small muted">Up next: {next.name}</div>
        </div>
      )}
    </div>
  );
}
