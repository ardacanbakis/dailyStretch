import { useMemo } from 'react';
import type { Exercise, Routine, RoutineRequest } from '../types';
import { getExercise } from '../data/exercises';
import { getAlternatives } from '../engine/swap';
import type { OpenDetail } from '../App';
import { ExerciseMeta, Sheet, fmtMin, useEngineContext } from './common';

interface Props {
  open: boolean;
  routine: Routine;
  index: number;
  request: RoutineRequest;
  onClose: () => void;
  onPick: (e: Exercise) => void;
  openDetail: OpenDetail;
}

export function SwapSheet({ open, routine, index, request, onClose, onPick, openDetail }: Props) {
  const ctx = useEngineContext();
  const item = routine.items[index];
  const current = item ? getExercise(item.exerciseId) : undefined;
  const alternatives = useMemo(() => (open && item ? getAlternatives(routine, index, request, ctx, 4) : []), [open, routine, index, request, ctx, item]);

  return (
    <Sheet open={open} onClose={onClose} title="Swap exercise">
      {current && (
        <div className="stack">
          <p className="small muted">
            Replacing <strong>{current.name}</strong>. Alternatives target the same area and respect today's check-in, your exclusions, equipment and position.
          </p>
          {alternatives.length === 0 ? (
            <div className="card empty">No suitable alternatives with the current filters.</div>
          ) : (
            <div className="list">
              {alternatives.map((e) => (
                <div key={e.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                  <div className="grow stack-sm">
                    <div className="title">{e.name}</div>
                    <div className="small muted">{e.summary}</div>
                    <ExerciseMeta exercise={e} compact />
                    <div className="row wrap">
                      <span className="badge">{fmtMin(e.durationSec)}</span>
                      <button className="btn btn-sm btn-ghost" onClick={() => openDetail(e.id, { request, onUseInstead: onPick })}>
                        Details
                      </button>
                      <button className="btn btn-sm btn-primary" onClick={() => onPick(e)}>
                        Use this
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
