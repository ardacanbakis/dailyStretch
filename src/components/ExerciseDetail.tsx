import { useMemo } from 'react';
import type { Exercise, RoutineRequest } from '../types';
import { BODY_AREA_LABELS, INTENSITY_LABELS } from '../types';
import { EXERCISES, getExercise } from '../data/exercises';
import { actions, useAppState } from '../state/store';
import { emptyFeedback } from '../engine/context';
import { AreaTags, ExerciseMeta, Sheet, fmtMin } from './common';
import { ExerciseFigure, FigureThumb } from '../figure/Figure';

interface Props {
  exerciseId: string;
  request?: RoutineRequest;
  onClose: () => void;
  onOpen: (id: string) => void;
  /** Present when the sheet was opened from a routine item: lets the user swap it. */
  onUseInstead?: (e: Exercise) => void;
  /** True when viewing the item that was originally opened (no "use instead" for itself). */
  isOrigin?: boolean;
}

function libraryAlternatives(e: Exercise, excluded: Set<string>): Exercise[] {
  const scored = EXERCISES.filter((x) => x.id !== e.id && !excluded.has(x.id))
    .map((x) => {
      const cat = x.category === e.category ? 3 : 0;
      const primary = x.primary.filter((a) => e.primary.includes(a)).length * 1.5;
      const secondary = x.secondary.filter((a) => e.primary.includes(a)).length * 0.5 + x.primary.filter((a) => e.secondary.includes(a)).length * 0.5;
      const pos = x.positions.some((p) => e.positions.includes(p)) ? 0.5 : 0;
      return { x, s: cat + primary + secondary + pos };
    })
    .filter((r) => r.s >= 1.5)
    .sort((a, b) => b.s - a.s);
  return scored.slice(0, 6).map((r) => r.x);
}

export function ExerciseDetail({ exerciseId, onClose, onOpen, onUseInstead, isOrigin }: Props) {
  const state = useAppState();
  const e = getExercise(exerciseId);
  const fb = state.feedback[exerciseId] ?? emptyFeedback();
  const excluded = useMemo(() => new Set(Object.entries(state.feedback).filter(([, f]) => f.excluded).map(([id]) => id)), [state.feedback]);
  const alternatives = useMemo(() => (e ? libraryAlternatives(e, excluded) : []), [e, excluded]);

  if (!e) return null;
  const recentPain = fb.painful.length > 0 && Date.now() - fb.painful[fb.painful.length - 1] < state.profile.painAvoidDays * 86400000;

  return (
    <Sheet open onClose={onClose} title={e.name}>
      <div className="stack">
        <p className="muted">{e.summary}</p>
        <ExerciseMeta exercise={e} />
        {onUseInstead && !isOrigin && (
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              onUseInstead(e);
              onClose();
            }}
          >
            Use this instead
          </button>
        )}

        <div className="figure-stage full">
          <ExerciseFigure exerciseId={e.id} />
        </div>
        <div className="demo-steps">
          {e.demo.map((d, i) => (
            <div key={i} className="demo-step">
              <span className="n">{i + 1}</span>
              {d}
            </div>
          ))}
        </div>

        <Section title="Target areas">
          <div className="stack-sm">
            <AreaTags areas={e.primary} />
            {e.secondary.length > 0 && (
              <div className="small muted">Also: {e.secondary.map((a) => BODY_AREA_LABELS[a]).join(', ')}</div>
            )}
          </div>
        </Section>

        <Section title="Instructions">
          <ol className="steps">
            {e.instructions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </Section>

        <Section title="Duration / repetitions">
          <div className="row wrap">
            <span className="badge accent">{fmtMin(e.durationSec)} default</span>
            <span className="badge">{e.reps}</span>
            <span className="badge">{INTENSITY_LABELS[e.intensity]}</span>
          </div>
        </Section>

        <Section title="Breathing">
          <p>{e.breathing}</p>
        </Section>

        <Section title="Common mistakes">
          <ul className="steps">
            {e.mistakes.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Section>

        <Section title="Easier version">
          <p>{e.easier}</p>
        </Section>

        <Section title="Alternative variation">
          <p>{e.variation}</p>
        </Section>

        <Section title="Caution">
          <ul className="steps" style={{ color: 'var(--warn)' }}>
            {e.cautions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Section>

        <div className="card stack-sm">
          <h3>Your feedback</h3>
          <div className="flag-grid">
            <FlagButton on={fb.favorite} title="★ Favorite" desc="Shown a bit more often" onClick={() => actions.setFlag(e.id, 'favorite', !fb.favorite)} />
            <FlagButton on={fb.worksWell} title="Works well for me" desc="Gently prioritised" onClick={() => actions.setFlag(e.id, 'works_well', !fb.worksWell)} />
            <FlagButton on={fb.dontShowOften} title="Don't show often" desc="Rare, but still possible" onClick={() => actions.setFlag(e.id, 'dont_show_often', !fb.dontShowOften)} />
            <FlagButton on={fb.excluded} danger title="Exclude exercise" desc="Never appears in routines" onClick={() => actions.setFlag(e.id, 'excluded', !fb.excluded)} />
          </div>
          <div className="row wrap">
            {recentPain ? (
              <>
                <span className="badge danger">Marked painful · paused for {state.profile.painAvoidDays} days</span>
                <button className="btn btn-sm" onClick={() => actions.clearPain(e.id)}>
                  Clear
                </button>
              </>
            ) : (
              <button className="btn btn-sm btn-danger" onClick={() => actions.reportPain(e.id)}>
                Mark as painful today
              </button>
            )}
            <span className="small muted">
              Done {fb.completed}× {fb.helpful.length > 0 ? `· helpful ${fb.helpful.length}×` : ''}
            </span>
          </div>
        </div>

        {alternatives.length > 0 && (
          <div className="stack-sm">
            <h3>Try another variation</h3>
            <div className="list">
              {alternatives.map((a) => (
                <div key={a.id} className="list-item">
                  <FigureThumb exerciseId={a.id} large />
                  <div className="grow">
                    <div className="title">{a.name}</div>
                    <div className="small muted">{a.summary}</div>
                  </div>
                  <div className="stack-sm">
                    <button className="btn btn-sm" onClick={() => onOpen(a.id)}>
                      View
                    </button>
                    {onUseInstead && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          onUseInstead(a);
                          onClose();
                        }}
                      >
                        Use
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="stack-sm">
      <div className="label">{title}</div>
      {children}
    </div>
  );
}

function FlagButton({ on, title, desc, onClick, danger }: { on: boolean; title: string; desc: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" className={`flag-btn ${on ? 'on' : ''} ${danger ? 'danger' : ''}`} onClick={onClick} aria-pressed={on}>
      <span className="t">{title}</span>
      <span className="d">{desc}</span>
    </button>
  );
}
