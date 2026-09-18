import { useCallback, useEffect, useRef, useState } from 'react';
import type { Exercise, Routine, RoutineRequest, SessionItemRecord, SessionRecord } from '../types';
import { POSITION_LABELS } from '../types';
import { getExercise, isNeckFocused } from '../data/exercises';
import { applySwap, removeItem } from '../engine/swap';
import { routineDurationSec } from '../engine/generator';
import type { OpenDetail } from '../App';
import { SwapSheet } from './SwapSheet';
import { Chip, Toggle, fmtClock, fmtMin } from './common';

type Feedback = NonNullable<SessionItemRecord['feedback']>;

interface Props {
  routine: Routine;
  request: RoutineRequest;
  openDetail: OpenDetail;
  onDone: (record: SessionRecord | null) => void;
}

function beep(times = 1) {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ac = new Ctor();
    for (let i = 0; i < times; i++) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.08;
      osc.connect(gain).connect(ac.destination);
      const t = ac.currentTime + i * 0.25;
      osc.start(t);
      osc.stop(t + 0.15);
    }
    setTimeout(() => ac.close().catch(() => undefined), 1000);
  } catch {
    // Audio is a nicety; ignore failures.
  }
}

const RING_R = 70;
const RING_C = 2 * Math.PI * RING_R;

export function SessionPlayer({ routine: initial, request, openDetail, onDone }: Props) {
  const [routine, setRoutine] = useState(initial);
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [records, setRecords] = useState<SessionItemRecord[]>([]);
  const [pending, setPending] = useState<Feedback | undefined>(undefined);
  const [swapOpen, setSwapOpen] = useState(false);
  const [phase, setPhase] = useState<'active' | 'summary'>('active');
  const [neckWorse, setNeckWorse] = useState(false);
  const [feel, setFeel] = useState<number | undefined>(undefined);
  const [note, setNote] = useState('');
  const startedAt = useRef(Date.now());

  const item = routine.items[index];
  const exercise: Exercise | undefined = item ? getExercise(item.exerciseId) : undefined;

  // Keep the screen awake during a session where supported.
  useEffect(() => {
    if (phase !== 'active') return;
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => undefined);
    return () => {
      lock?.release().catch(() => undefined);
    };
  }, [phase]);

  useEffect(() => {
    if (!running || phase !== 'active') return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [running, phase, index]);

  const finishItem = useCallback(
    (outcome: 'done' | 'skipped') => {
      if (!item) return;
      const actual = outcome === 'done' ? Math.max(1, Math.min(elapsed || item.seconds, Math.round(item.seconds * 1.5))) : elapsed;
      const rec: SessionItemRecord = { exerciseId: item.exerciseId, plannedSec: item.seconds, actualSec: actual, outcome, feedback: pending };
      setRecords((rs) => [...rs.slice(0, index), rec]);
      setPending(undefined);
      setElapsed(0);
      if (index + 1 >= routine.items.length) {
        setPhase('summary');
        setRunning(false);
        beep(2);
      } else {
        setIndex(index + 1);
        beep(1);
      }
    },
    [item, elapsed, pending, index, routine.items.length],
  );

  useEffect(() => {
    if (phase === 'active' && item && running && elapsed >= item.seconds) finishItem('done');
  }, [elapsed, item, phase, running, finishItem]);

  const goBack = () => {
    if (index === 0) return;
    setRecords((rs) => rs.slice(0, index - 1));
    setIndex(index - 1);
    setElapsed(0);
    setPending(undefined);
  };

  const buildRecord = (completed: boolean, items: SessionItemRecord[]): SessionRecord => {
    const endedAt = Date.now();
    return {
      id: `ss_${endedAt.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`,
      routineId: routine.id,
      templateId: routine.templateId,
      family: routine.family,
      name: routine.name,
      startedAt: startedAt.current,
      endedAt,
      durationSec: items.reduce((s, i) => s + (i.outcome === 'done' ? i.actualSec : 0), 0),
      items,
      completed,
      checkIn: request.checkIn,
      neckSymptomsIncreased: neckWorse || undefined,
      feelRating: feel,
      note: note.trim() || undefined,
    };
  };

  const exitEarly = () => {
    const done = records.filter((r) => r.outcome === 'done');
    if (done.length === 0) {
      if (window.confirm('Leave this session? Nothing has been logged yet.')) onDone(null);
      return;
    }
    if (window.confirm(`Finish early and log the ${done.length} exercise${done.length === 1 ? '' : 's'} you completed?`)) {
      setRunning(false);
      setPhase('summary');
    }
  };

  const swapCurrent = (e: Exercise) => {
    setRoutine((r) => applySwap(r, index, e));
    setElapsed(0);
    setPending(undefined);
    setSwapOpen(false);
  };

  const removeCurrent = () => {
    if (routine.items.length <= 1) {
      exitEarly();
      return;
    }
    const next = removeItem(routine, index);
    setRoutine(next);
    setElapsed(0);
    setPending(undefined);
    if (index >= next.items.length) {
      setPhase('summary');
      setRunning(false);
    }
  };

  // ------------------------------------------------------------- Summary screen
  if (phase === 'summary') {
    const done = records.filter((r) => r.outcome === 'done');
    const totalSec = done.reduce((s, r) => s + r.actualSec, 0);
    const hadNeck = records.some((r) => {
      const e = getExercise(r.exerciseId);
      return e && (isNeckFocused(e) || e.cervicalLoad > 0);
    });
    const setFeedback = (i: number, fb: Feedback) => setRecords((rs) => rs.map((r, j) => (j === i ? { ...r, feedback: r.feedback === fb ? undefined : fb } : r)));
    return (
      <div className="screen" style={{ paddingTop: 24 }}>
        <div className="stack-sm">
          <h1>{done.length === routine.items.length ? 'Session complete' : 'Session logged'}</h1>
          <p className="muted">
            {routine.name} · {done.length} of {routine.items.length} exercises · {fmtMin(totalSec)}
          </p>
        </div>

        <div className="card stack-sm">
          <h3>How did each one feel?</h3>
          <div className="list">
            {records.map((r, i) => {
              const e = getExercise(r.exerciseId);
              return (
                <div key={`${r.exerciseId}-${i}`} className={`list-item ${r.outcome === 'skipped' ? 'done' : ''}`} style={{ alignItems: 'flex-start' }}>
                  <div className="grow stack-sm">
                    <div className="row between">
                      <span className="title">{e?.name ?? r.exerciseId}</span>
                      <span className="badge">{r.outcome === 'done' ? fmtClock(r.actualSec) : 'Skipped'}</span>
                    </div>
                    <div className="feedback-row">
                      <Chip size="sm" tone="ok" active={r.feedback === 'helpful'} onClick={() => setFeedback(i, 'helpful')}>
                        Helpful
                      </Chip>
                      <Chip size="sm" active={r.feedback === 'neutral'} onClick={() => setFeedback(i, 'neutral')}>
                        Neutral
                      </Chip>
                      <Chip size="sm" tone="danger" active={r.feedback === 'painful'} onClick={() => setFeedback(i, 'painful')}>
                        Painful
                      </Chip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="tiny muted">"Helpful" nudges an exercise to appear a little more often. "Painful" keeps it out of routines for a couple of weeks.</p>
        </div>

        <div className="card stack-sm">
          {hadNeck && (
            <Toggle label="Neck exercises increased my symptoms" hint="Turns off direct neck work for the rest of today." value={neckWorse} onChange={setNeckWorse} />
          )}
          <div className="field">
            <span className="label">How does your body feel now?</span>
            <div className="chip-row">
              {[1, 2, 3, 4, 5].map((n) => (
                <Chip key={n} active={feel === n} onClick={() => setFeel(feel === n ? undefined : n)}>
                  {['Worse', 'Meh', 'Okay', 'Better', 'Great'][n - 1]}
                </Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="note">Note (optional)</label>
            <textarea id="note" className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything worth remembering?" />
          </div>
        </div>

        <div className="row">
          <button className="btn grow" onClick={() => onDone(null)}>
            Discard
          </button>
          <button className="btn btn-primary btn-lg grow" onClick={() => onDone(buildRecord(done.length === routine.items.length, records))}>
            Save session
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------- Active screen
  if (!item || !exercise) {
    return (
      <div className="screen">
        <div className="card empty">This routine has no exercises.</div>
        <button className="btn" onClick={() => onDone(null)}>
          Back
        </button>
      </div>
    );
  }

  const remaining = Math.max(0, item.seconds - elapsed);
  const progress = Math.min(1, elapsed / item.seconds);
  const doneSec = records.reduce((s, r) => s + r.plannedSec, 0);
  const totalPlanned = routineDurationSec(routine);
  const overall = Math.min(1, (doneSec + elapsed) / Math.max(1, totalPlanned));
  const stepIdx = Math.min(exercise.demo.length - 1, Math.floor(progress * exercise.demo.length));
  const next = routine.items[index + 1] ? getExercise(routine.items[index + 1].exerciseId) : undefined;

  return (
    <div className="session">
      <div className="row between">
        <button className="btn btn-ghost btn-sm" onClick={exitEarly}>
          ✕ End
        </button>
        <div className="small muted">
          {index + 1} / {routine.items.length} · {routine.name}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => openDetail(exercise.id, { request, onUseInstead: swapCurrent })}>
          Details
        </button>
      </div>
      <div className="progress" aria-hidden>
        <div className="fill" style={{ width: `${overall * 100}%` }} />
      </div>

      <div className="stack-sm" style={{ textAlign: 'center' }}>
        <div className="label">{item.block}</div>
        <h1>{exercise.name}</h1>
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          <span className="badge">{exercise.positions.map((p) => POSITION_LABELS[p]).join(' / ')}</span>
          <span className="badge accent">{exercise.reps}</span>
          {exercise.perSide && <span className="badge warn">Switch sides halfway</span>}
        </div>
      </div>

      <div className="timer">
        <svg className="ring" viewBox="0 0 160 160" aria-hidden>
          <circle className="track" cx="80" cy="80" r={RING_R} fill="none" strokeWidth="10" />
          <circle className="arc" cx="80" cy="80" r={RING_R} fill="none" strokeWidth="10" strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - progress)} transform="rotate(-90 80 80)" />
          <text x="80" y="88" textAnchor="middle" fontSize="34" fontWeight="700" fill="currentColor" className={`digits ${running ? '' : 'paused'}`}>
            {fmtClock(remaining)}
          </text>
        </svg>
        <div className="small muted">{running ? (exercise.perSide && progress >= 0.5 ? 'Second side' : 'Keep breathing') : 'Paused'}</div>
      </div>

      <div className="controls">
        <button className="btn" onClick={goBack} disabled={index === 0} aria-label="Previous exercise">
          ⏮
        </button>
        <button className="btn btn-primary btn-lg" onClick={() => setRunning((r) => !r)} style={{ minWidth: 120 }}>
          {running ? '⏸ Pause' : '▶ Resume'}
        </button>
        <button className="btn" onClick={() => finishItem('done')} aria-label="Mark done and go to next">
          ✓ Next
        </button>
      </div>
      <div className="controls">
        <button className="btn btn-sm" onClick={() => setSwapOpen(true)}>
          Swap
        </button>
        <button className="btn btn-sm btn-ghost" onClick={() => finishItem('skipped')}>
          Skip
        </button>
        <button className="btn btn-sm btn-ghost" onClick={removeCurrent}>
          Remove
        </button>
      </div>

      <div className="card stack-sm">
        <div className="demo-steps" aria-label="Demonstration">
          {exercise.demo.map((d, i) => (
            <div key={i} className={`demo-step ${i === stepIdx ? 'current' : ''}`}>
              <span className="n">{i + 1}</span>
              {d}
            </div>
          ))}
        </div>
        <ol className="steps">
          {exercise.instructions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <div className="small">
          <strong>Breathing:</strong> {exercise.breathing}
        </div>
        {exercise.cautions.length > 0 && (
          <div className="small" style={{ color: 'var(--warn)' }}>
            <strong>Care:</strong> {exercise.cautions.join(' ')}
          </div>
        )}
      </div>

      <div className="card soft stack-sm">
        <div className="small muted">How is this one feeling?</div>
        <div className="feedback-row">
          <Chip size="sm" tone="ok" active={pending === 'helpful'} onClick={() => setPending(pending === 'helpful' ? undefined : 'helpful')}>
            Helpful
          </Chip>
          <Chip size="sm" tone="danger" active={pending === 'painful'} onClick={() => setPending(pending === 'painful' ? undefined : 'painful')}>
            Painful
          </Chip>
          {pending === 'painful' && (
            <button className="btn btn-sm btn-danger" onClick={() => finishItem('skipped')}>
              Stop and skip
            </button>
          )}
        </div>
      </div>

      {next && (
        <div className="small muted" style={{ textAlign: 'center' }}>
          Up next: {next.name}
        </div>
      )}

      <SwapSheet open={swapOpen} routine={routine} index={index} request={request} onClose={() => setSwapOpen(false)} onPick={swapCurrent} openDetail={openDetail} />
    </div>
  );
}
