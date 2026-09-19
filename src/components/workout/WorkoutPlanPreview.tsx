import { useState } from 'react';
import type { WorkoutExercise, WorkoutPlan } from '../../workout/types';
import { getExercise } from '../../data/exercises';
import { FigureThumb } from '../../figure/Figure';
import { datasetAttribution } from '../../workout/data';
import { NoteList } from '../common';
import { WorkoutGifThumb } from './WorkoutGif';

interface Props {
  plan: WorkoutPlan;
  byId: Map<string, WorkoutExercise>;
  unit: string;
  onChange: (plan: WorkoutPlan) => void;
  onStart: () => void;
  onRegenerate: () => void;
  onSwap: (index: number) => void;
  onOpen: (e: WorkoutExercise) => void;
  onAddExercise: () => void;
}

export function WorkoutPlanPreview({ plan, byId, unit, onChange, onStart, onRegenerate, onSwap, onOpen, onAddExercise }: Props) {
  const [showMobility, setShowMobility] = useState(false);
  const totalSets = plan.items.reduce((s, i) => s + i.sets, 0);

  const update = (index: number, patch: Partial<WorkoutPlan['items'][number]>) =>
    onChange({ ...plan, items: plan.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) });

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= plan.items.length) return;
    const items = [...plan.items];
    [items[index], items[j]] = [items[j], items[index]];
    onChange({ ...plan, items });
  };

  return (
    <div className="screen">
      <div className="stack-sm">
        <h1>{plan.name}</h1>
        <div className="row wrap">
          <span className="badge accent">~{plan.minutes} min</span>
          <span className="badge">{plan.items.length} exercises</span>
          <span className="badge">{totalSets} sets</span>
          {plan.warmup.length > 0 && <span className="badge ok">Warm-up</span>}
          {plan.cooldown.length > 0 && <span className="badge ok">Cool-down</span>}
        </div>
        <NoteList notes={plan.notes} />
      </div>

      {(plan.warmup.length > 0 || plan.cooldown.length > 0) && (
        <div className="card stack-sm">
          <button
            className="row between"
            style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', width: '100%', textAlign: 'left' }}
            onClick={() => setShowMobility((v) => !v)}
          >
            <div>
              <h3>Mobility</h3>
              <div className="small muted">
                {plan.warmup.length} warm-up · {plan.cooldown.length} cool-down, drawn from your stretch library
              </div>
            </div>
            <span className="badge">{showMobility ? 'Hide' : 'Show'}</span>
          </button>
          {showMobility && (
            <div className="list">
              {[...plan.warmup.map((id) => ({ id, kind: 'Warm-up' })), ...plan.cooldown.map((id) => ({ id, kind: 'Cool-down' }))].map(
                ({ id, kind }, i) => {
                  const ex = getExercise(id);
                  if (!ex) return null;
                  return (
                    <div key={`${id}-${i}`} className="list-item">
                      <FigureThumb exerciseId={id} />
                      <div className="grow">
                        <div className="title">{ex.name}</div>
                        <div className="small muted">{kind}</div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      )}

      {plan.items.length === 0 ? (
        <div className="card empty">No exercises yet. Add some from the browser.</div>
      ) : (
        <div className="list">
          {plan.items.map((item, index) => {
            const e = byId.get(item.exerciseId);
            if (!e) return null;
            const showBlock = index === 0 || plan.items[index - 1].block !== item.block;
            return (
              <div key={`${item.exerciseId}-${index}`} className="stack-sm">
                {showBlock && <div className="label">{item.block}</div>}
                <div className="list-item" style={{ alignItems: 'flex-start' }}>
                  <WorkoutGifThumb exercise={e} />
                  <div className="grow stack-sm">
                    <button
                      className="title"
                      style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer' }}
                      onClick={() => onOpen(e)}
                    >
                      {e.name}
                    </button>
                    <div className="small muted">
                      {e.target} · {e.equipment}
                    </div>
                    <div className="row wrap">
                      <span className="pill-num">
                        <button onClick={() => update(index, { sets: Math.max(1, item.sets - 1) })} aria-label="Fewer sets">
                          −
                        </button>
                        <span className="val">{item.sets} sets</span>
                        <button onClick={() => update(index, { sets: Math.min(8, item.sets + 1) })} aria-label="More sets">
                          +
                        </button>
                      </span>
                      <span className="pill-num">
                        <button
                          onClick={() => update(index, { target: Math.max(1, item.target - (item.mode === 'time' ? 10 : 1)) })}
                          aria-label="Lower target"
                        >
                          −
                        </button>
                        <span className="val">
                          {item.target} {item.mode === 'time' ? 's' : 'reps'}
                        </span>
                        <button
                          onClick={() => update(index, { target: item.target + (item.mode === 'time' ? 10 : 1) })}
                          aria-label="Raise target"
                        >
                          +
                        </button>
                      </span>
                    </div>
                    <div className="row wrap">
                      <span className="badge">Rest {item.restSec}s</span>
                      {item.weight !== undefined && item.weight > 0 && (
                        <span className="badge warn">
                          Last {item.weight} {unit}
                        </span>
                      )}
                    </div>
                    <div className="row wrap">
                      <button className="btn btn-sm" onClick={() => onSwap(index)}>
                        Swap
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => move(index, -1)} aria-label="Move up">
                        ↑
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => move(index, 1)} aria-label="Move down">
                        ↓
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => onChange({ ...plan, items: plan.items.filter((_, i) => i !== index) })}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="row wrap">
        <button className="btn grow" onClick={onAddExercise}>
          + Add exercise
        </button>
        <button className="btn grow" onClick={onRegenerate}>
          🔀 Regenerate
        </button>
      </div>
      <button className="btn btn-primary btn-lg btn-block" onClick={onStart} disabled={plan.items.length === 0}>
        ▶ Start workout
      </button>
      <div className="attribution">Exercise animations {datasetAttribution()}</div>
    </div>
  );
}
