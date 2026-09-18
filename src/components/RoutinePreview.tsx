import { useState } from 'react';
import type { Exercise, Routine, RoutineRequest } from '../types';
import { INTENSITY_LABELS, POSITION_FILTER_LABELS } from '../types';
import { getExercise } from '../data/exercises';
import { generateRoutine, routineDurationSec } from '../engine/generator';
import { applySwap, removeItem } from '../engine/swap';
import type { OpenDetail } from '../App';
import { SwapSheet } from './SwapSheet';
import { ExerciseMeta, NoteList, fmtMin, useEngineContext } from './common';

interface Props {
  routine: Routine;
  request: RoutineRequest;
  openDetail: OpenDetail;
  onChange: (routine: Routine) => void;
  onRegenerate: (routine: Routine, request: RoutineRequest) => void;
  onStart: () => void;
}

export function RoutinePreview({ routine, request, openDetail, onChange, onRegenerate, onStart }: Props) {
  const ctx = useEngineContext();
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const total = routineDurationSec(routine);

  const regenerate = () => {
    const next = generateRoutine({ ...request, seed: (request.seed ?? 0) + Math.floor(Math.random() * 100000) + 1 }, { ...ctx, recentRoutines: [...ctx.recentRoutines, routine] });
    onRegenerate(next, request);
  };

  const swap = (index: number, e: Exercise) => {
    onChange(applySwap(routine, index, e));
    setSwapIndex(null);
  };

  return (
    <div className="screen">
      <div className="stack-sm">
        <h1>{routine.name}</h1>
        <div className="row wrap">
          <span className="badge accent">{fmtMin(total)}</span>
          <span className="badge">{routine.items.length} exercises</span>
          <span className="badge">{INTENSITY_LABELS[request.intensity]}</span>
          <span className="badge">{POSITION_FILTER_LABELS[request.position]}</span>
          {request.atDesk && <span className="badge ok">At desk</span>}
        </div>
        <NoteList notes={routine.notes} />
      </div>

      {routine.items.length === 0 ? (
        <div className="card empty">
          Nothing fits these filters. Try allowing more positions or equipment, or pick a different focus.
        </div>
      ) : (
        <div className="list">
          {routine.items.map((item, index) => {
            const e = getExercise(item.exerciseId);
            if (!e) return null;
            const showBlock = index === 0 || routine.items[index - 1].block !== item.block;
            return (
              <div key={`${item.exerciseId}-${index}`} className="stack-sm">
                {showBlock && (
                  <div className="label" style={{ marginTop: index === 0 ? 0 : 6 }}>
                    {item.block}
                  </div>
                )}
                <div className="list-item" style={{ alignItems: 'flex-start' }}>
                  <span className="num">{index + 1}</span>
                  <div className="grow stack-sm">
                    <button
                      className="title"
                      style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer' }}
                      onClick={() => openDetail(e.id, { request, onUseInstead: (alt) => swap(index, alt) })}
                    >
                      {e.name}
                    </button>
                    <div className="small muted">{e.summary}</div>
                    <ExerciseMeta exercise={e} compact />
                    <div className="row wrap">
                      <span className="badge">{fmtMin(item.seconds)}</span>
                      <span className="badge">{e.reps}</span>
                    </div>
                    <div className="row wrap">
                      <button className="btn btn-sm" onClick={() => setSwapIndex(index)}>
                        Swap
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => openDetail(e.id, { request, onUseInstead: (alt) => swap(index, alt) })}>
                        Details
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => onChange(removeItem(routine, index))} aria-label={`Remove ${e.name}`}>
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

      <div className="row">
        <button className="btn grow" onClick={regenerate}>
          🔀 Regenerate
        </button>
        <button className="btn btn-primary btn-lg grow" onClick={onStart} disabled={routine.items.length === 0}>
          ▶ Start
        </button>
      </div>

      <SwapSheet open={swapIndex !== null} routine={routine} index={swapIndex ?? 0} request={request} onClose={() => setSwapIndex(null)} onPick={(e) => swapIndex !== null && swap(swapIndex, e)} openDetail={openDetail} />
    </div>
  );
}
