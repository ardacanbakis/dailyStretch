import { useCallback, useEffect, useMemo, useState } from 'react';
import { WORKOUT_TEMPLATES, getWorkoutTemplate, type WorkoutTemplate } from '../../workout/templates';
import { generateWorkout, prescriptionFor, workoutAlternatives, type WorkoutRequest } from '../../workout/generator';
import { buildCooldown, buildWarmup } from '../../workout/warmup';
import { loadWorkoutExercises } from '../../workout/data';
import { GEAR_GROUPS, type WorkoutExercise, type WorkoutPlan, type WorkoutSession } from '../../workout/types';
import { actions, useAppState } from '../../state/store';
import { Chip, Sheet, Toggle, useEngineContext } from '../common';
import { WorkoutBrowser } from './WorkoutBrowser';
import { WorkoutExerciseDetail } from './WorkoutExerciseDetail';
import { WorkoutHistory } from './WorkoutHistory';
import { WorkoutPlanPreview } from './WorkoutPlanPreview';
import { WorkoutPlayer } from './WorkoutPlayer';

type Tab = 'start' | 'browse' | 'history' | 'settings';
type Flow = { kind: 'none' } | { kind: 'preview'; plan: WorkoutPlan } | { kind: 'session'; plan: WorkoutPlan };

const TIME_CHOICES = [15, 20, 30, 45, 60];

export function WorkoutApp() {
  const state = useAppState();
  const engineCtx = useEngineContext();
  const wp = state.workout.profile;

  const [exercises, setExercises] = useState<WorkoutExercise[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('start');
  const [flow, setFlow] = useState<Flow>({ kind: 'none' });
  const [minutes, setMinutes] = useState(wp.defaultMinutes);
  const [detail, setDetail] = useState<WorkoutExercise | null>(null);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    let alive = true;
    loadWorkoutExercises()
      .then((list) => alive && setExercises(list))
      .catch((e: Error) => alive && setLoadError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const byId = useMemo(() => new Map((exercises ?? []).map((e) => [e.id, e])), [exercises]);

  const request = useCallback(
    (templateId: string, mins: number, seed?: number): WorkoutRequest => ({
      templateId,
      minutes: mins,
      gear: wp.gear,
      seed,
    }),
    [wp.gear],
  );

  const build = useCallback(
    (template: WorkoutTemplate, mins: number, seed?: number) => {
      if (!exercises) return;
      const ctx = { exercises, state: state.workout, now: Date.now() };
      const plan = generateWorkout(request(template.id, mins, seed), ctx);
      plan.warmup = wp.includeWarmup ? buildWarmup(template, engineCtx, 3, seed) : [];
      plan.cooldown = wp.includeCooldown ? buildCooldown(template, engineCtx, 2, seed) : [];
      setFlow({ kind: 'preview', plan });
    },
    [exercises, state.workout, request, wp.includeWarmup, wp.includeCooldown, engineCtx],
  );

  if (loadError) {
    return (
      <div className="screen">
        <div className="card empty">
          <p>{loadError}</p>
          <p className="small muted">The exercise list could not be loaded. Check your connection and reload.</p>
        </div>
      </div>
    );
  }

  if (!exercises) {
    return (
      <div className="screen">
        <div className="card empty">Loading exercises…</div>
      </div>
    );
  }

  // ------------------------------------------------------------------ session
  if (flow.kind === 'session') {
    return (
      <>
        <WorkoutPlayer
          plan={flow.plan}
          byId={byId}
          onSwap={(i) => setSwapIndex(i)}
          onDone={(record) => {
            if (record) {
              actions.recordWorkoutSession(record);
              setLastSession(record);
            }
            setFlow({ kind: 'none' });
            setTab('start');
          }}
        />
        {swapIndex !== null && (
          <SwapPicker
            plan={flow.plan}
            index={swapIndex}
            exercises={exercises}
            workoutState={state.workout}
            request={request(flow.plan.templateId, minutes)}
            onClose={() => setSwapIndex(null)}
            onPick={(e) => {
              const p = prescriptionFor(e, wp.restSec);
              setFlow({
                kind: 'session',
                plan: {
                  ...flow.plan,
                  items: flow.plan.items.map((it, i) => (i === swapIndex ? { ...it, exerciseId: e.id, ...p } : it)),
                },
              });
              setSwapIndex(null);
            }}
          />
        )}
      </>
    );
  }

  // ------------------------------------------------------------------ preview
  if (flow.kind === 'preview') {
    const plan = flow.plan;
    return (
      <>
        <div className="topbar">
          <div className="brand">
            <span className="dot" /> Workout
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setFlow({ kind: 'none' })}>
            ← Back
          </button>
        </div>
        <WorkoutPlanPreview
          plan={plan}
          byId={byId}
          unit={wp.unit}
          onChange={(p) => setFlow({ kind: 'preview', plan: p })}
          onOpen={setDetail}
          onSwap={setSwapIndex}
          onAddExercise={() => setAdding(true)}
          onRegenerate={() => {
            const t = getWorkoutTemplate(plan.templateId);
            if (t) build(t, minutes, Math.floor(Math.random() * 1e9));
          }}
          onStart={() => {
            actions.rememberWorkoutPlan(plan);
            setFlow({ kind: 'session', plan });
          }}
        />
        {detail && (
          <WorkoutExerciseDetail
            exercise={detail}
            onClose={() => setDetail(null)}
            onOpen={setDetail}
            alternatives={exercises.filter((e) => e.target === detail.target && e.id !== detail.id).slice(0, 4)}
          />
        )}
        {swapIndex !== null && (
          <SwapPicker
            plan={plan}
            index={swapIndex}
            exercises={exercises}
            workoutState={state.workout}
            request={request(plan.templateId, minutes)}
            onClose={() => setSwapIndex(null)}
            onPick={(e) => {
              const p = prescriptionFor(e, wp.restSec);
              setFlow({
                kind: 'preview',
                plan: { ...plan, items: plan.items.map((it, i) => (i === swapIndex ? { ...it, exerciseId: e.id, ...p } : it)) },
              });
              setSwapIndex(null);
            }}
          />
        )}
        <Sheet open={adding} onClose={() => setAdding(false)} title="Add an exercise">
          <WorkoutBrowser
            exercises={exercises}
            onOpen={setDetail}
            onUse={(e) => {
              const p = prescriptionFor(e, wp.restSec);
              setFlow({ kind: 'preview', plan: { ...plan, items: [...plan.items, { exerciseId: e.id, block: 'Added', ...p }] } });
              setAdding(false);
            }}
          />
        </Sheet>
      </>
    );
  }

  // --------------------------------------------------------------------- tabs
  return (
    <>
      {tab === 'start' && (
        <div className="screen">
          <div className="stack-sm">
            <h1>Train</h1>
            <p className="muted">
              {state.workout.sessions.length} workout{state.workout.sessions.length === 1 ? '' : 's'} logged · {exercises.length} exercises available
            </p>
          </div>

          {lastSession && (
            <div className="card accent row between">
              <div className="grow">
                <div style={{ fontWeight: 600 }}>Logged: {lastSession.name}</div>
                <div className="small muted">
                  {lastSession.items.reduce((a, i) => a + i.sets.filter((s) => s.done).length, 0)} sets · {lastSession.volume} {wp.unit}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setLastSession(null)} aria-label="Dismiss">
                ✕
              </button>
            </div>
          )}

          <div className="card stack-sm">
            <span className="label">Time available</span>
            <div className="chip-row">
              {TIME_CHOICES.map((m) => (
                <Chip key={m} active={minutes === m} onClick={() => setMinutes(m)}>
                  {m} min
                </Chip>
              ))}
            </div>
          </div>

          <div className="stack-sm">
            <h2>Workouts</h2>
            {WORKOUT_TEMPLATES.filter((t) => minutes >= t.minMinutes - 5).map((t) => (
              <div key={t.id} className="card row between">
                <div className="grow">
                  <div className="row" style={{ gap: 6 }}>
                    <h3>{t.name}</h3>
                    {t.tags?.includes('neck') && <span className="badge accent">Neck priority</span>}
                  </div>
                  <div className="small muted">{t.description}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => build(t, Math.min(Math.max(minutes, t.minMinutes), t.maxMinutes))}>
                  Build
                </button>
              </div>
            ))}
          </div>

          {state.workout.recentPlans.length > 0 && (
            <div className="stack-sm">
              <h3>Repeat a recent workout</h3>
              <div className="list">
                {[...state.workout.recentPlans]
                  .reverse()
                  .slice(0, 3)
                  .map((p) => (
                    <button
                      key={p.id}
                      className="list-item"
                      style={{ cursor: 'pointer', textAlign: 'left' }}
                      onClick={() => setFlow({ kind: 'preview', plan: { ...p, id: `${p.id}_again`, createdAt: Date.now() } })}
                    >
                      <div className="grow">
                        <div className="title">{p.name}</div>
                        <div className="small muted">
                          {p.items.length} exercises · ~{p.minutes} min
                        </div>
                      </div>
                      <span className="badge">Repeat</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'browse' && (
        <div className="screen">
          <WorkoutBrowser exercises={exercises} onOpen={setDetail} />
        </div>
      )}

      {tab === 'history' && (
        <div className="screen">
          <WorkoutHistory byId={byId} onOpen={setDetail} />
        </div>
      )}

      {tab === 'settings' && (
        <div className="screen">
          <h1>Workout settings</h1>
          <div className="card stack">
            <div className="field">
              <span className="label">Units</span>
              <div className="chip-row">
                {(['kg', 'lb'] as const).map((u) => (
                  <Chip key={u} active={wp.unit === u} onClick={() => actions.updateWorkoutProfile({ unit: u })}>
                    {u}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="label">Equipment available</span>
              <div className="chip-row">
                {GEAR_GROUPS.map((g) => (
                  <Chip
                    key={g.id}
                    active={wp.gear.includes(g.id)}
                    onClick={() =>
                      actions.updateWorkoutProfile({
                        gear: wp.gear.includes(g.id) ? wp.gear.filter((x) => x !== g.id) : [...wp.gear, g.id],
                      })
                    }
                  >
                    {g.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="label">Default rest between sets</span>
              <div className="chip-row">
                {[45, 60, 90, 120].map((r) => (
                  <Chip key={r} active={wp.restSec === r} onClick={() => actions.updateWorkoutProfile({ restSec: r })}>
                    {r}s
                  </Chip>
                ))}
              </div>
            </div>
            <Toggle
              label="Neck-friendly programming"
              hint="Leaves out behind-the-neck presses, upright rows and similar movements."
              value={wp.neckFriendly}
              onChange={(v) => actions.updateWorkoutProfile({ neckFriendly: v })}
            />
            <Toggle
              label="Mobility warm-up"
              hint="Three minutes from your stretch library before the main work."
              value={wp.includeWarmup}
              onChange={(v) => actions.updateWorkoutProfile({ includeWarmup: v })}
            />
            <Toggle
              label="Stretch cool-down"
              hint="Two minutes of stretching afterwards."
              value={wp.includeCooldown}
              onChange={(v) => actions.updateWorkoutProfile({ includeCooldown: v })}
            />
          </div>
          <p className="tiny muted">
            Exercise data from the open exercises-dataset project. Exercise animations © Gym visual (gymvisual.com), shown from their
            original source at their original size.
          </p>
        </div>
      )}

      <nav className="bottom-nav" aria-label="Workout sections">
        <div className="inner">
          {([
            { id: 'start', label: 'Train', icon: '🏋' },
            { id: 'browse', label: 'Exercises', icon: '📚' },
            { id: 'history', label: 'History', icon: '📈' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ] as const).map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              <span className="ico" aria-hidden>
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {detail && (
        <WorkoutExerciseDetail
          exercise={detail}
          onClose={() => setDetail(null)}
          onOpen={setDetail}
          alternatives={exercises.filter((e) => e.target === detail.target && e.id !== detail.id).slice(0, 4)}
        />
      )}
    </>
  );
}

function SwapPicker({
  plan,
  index,
  exercises,
  workoutState,
  request,
  onClose,
  onPick,
}: {
  plan: WorkoutPlan;
  index: number;
  exercises: WorkoutExercise[];
  workoutState: ReturnType<typeof useAppState>['workout'];
  request: WorkoutRequest;
  onClose: () => void;
  onPick: (e: WorkoutExercise) => void;
}) {
  const alts = useMemo(
    () => workoutAlternatives(plan, index, request, { exercises, state: workoutState, now: Date.now() }, 5),
    [plan, index, request, exercises, workoutState],
  );
  const current = exercises.find((e) => e.id === plan.items[index]?.exerciseId);
  return (
    <Sheet open onClose={onClose} title="Swap exercise">
      <div className="stack">
        {current && (
          <p className="small muted">
            Replacing <strong>{current.name}</strong>. These work the same area with the equipment you have.
          </p>
        )}
        {alts.length === 0 ? (
          <div className="card empty">No alternatives with your current equipment.</div>
        ) : (
          <div className="list">
            {alts.map((e) => (
              <div key={e.id} className="list-item">
                <div className="grow">
                  <div className="title">{e.name}</div>
                  <div className="small muted">
                    {e.target} · {e.equipment}
                  </div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => onPick(e)}>
                  Use
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
