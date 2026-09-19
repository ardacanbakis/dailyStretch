import { useMemo, useState } from 'react';
import type { WorkoutExercise } from '../../workout/types';
import { BODY_PART_LABELS } from '../../workout/types';
import { actions, useAppState } from '../../state/store';
import { DAY_MS, dateKey } from '../../engine/context';
import { fmtDate, fmtMin, fmtTime } from '../common';

export function WorkoutHistory({ byId, onOpen }: { byId: Map<string, WorkoutExercise>; onOpen: (e: WorkoutExercise) => void }) {
  const state = useAppState();
  const unit = state.workout.profile.unit;
  const [expanded, setExpanded] = useState<string | null>(null);
  const sessions = useMemo(() => [...state.workout.sessions].sort((a, b) => b.endedAt - a.endedAt), [state.workout.sessions]);

  const stats = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * DAY_MS;
    const week = sessions.filter((s) => s.endedAt >= weekAgo);
    const days = new Set(sessions.map((s) => dateKey(s.endedAt)));
    let streak = 0;
    let cursor = now;
    if (!days.has(dateKey(cursor))) cursor -= DAY_MS;
    while (days.has(dateKey(cursor))) {
      streak++;
      cursor -= DAY_MS;
    }
    const volumeByPart = new Map<string, number>();
    const bestSet = new Map<string, { weight: number; reps: number }>();
    for (const s of sessions) {
      for (const item of s.items) {
        const e = byId.get(item.exerciseId);
        for (const set of item.sets) {
          if (!set.done) continue;
          if (e) volumeByPart.set(e.bodyPart, (volumeByPart.get(e.bodyPart) ?? 0) + set.weight * (set.reps || 0));
          const prev = bestSet.get(item.exerciseId);
          if (!prev || set.weight > prev.weight || (set.weight === prev.weight && set.reps > prev.reps)) {
            bestSet.set(item.exerciseId, { weight: set.weight, reps: set.reps });
          }
        }
      }
    }
    const last14: { date: string; volume: number; sessions: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = dateKey(now - i * DAY_MS);
      const list = sessions.filter((s) => dateKey(s.endedAt) === d);
      last14.push({ date: d, volume: list.reduce((a, s) => a + s.volume, 0), sessions: list.length });
    }
    return {
      total: sessions.length,
      week: week.length,
      weekVolume: week.reduce((a, s) => a + s.volume, 0),
      streak,
      volumeByPart: [...volumeByPart.entries()].map(([part, v]) => ({ part, v: Math.round(v) })).sort((a, b) => b.v - a.v),
      bestSet,
      last14,
    };
  }, [sessions, byId]);

  const maxDay = Math.max(1, ...stats.last14.map((d) => d.volume));
  const maxPart = Math.max(1, ...stats.volumeByPart.map((p) => p.v));

  return (
    <div className="stack">
      <h2>Workout history</h2>
      <div className="stat-grid">
        <div className="stat">
          <div className="value">{stats.streak}</div>
          <div className="name">day streak</div>
        </div>
        <div className="stat">
          <div className="value">{stats.week}</div>
          <div className="name">this week</div>
        </div>
        <div className="stat">
          <div className="value">{Math.round(stats.weekVolume)}</div>
          <div className="name">volume ({unit})</div>
        </div>
      </div>

      <div className="card stack-sm">
        <h3>Last 14 days</h3>
        <div className="bars" aria-label="Training volume per day">
          {stats.last14.map((d) => (
            <div
              key={d.date}
              className={`bar ${d.volume === 0 ? 'empty' : ''}`}
              style={{ height: `${Math.max(3, (d.volume / maxDay) * 100)}%` }}
              title={`${d.date}: ${Math.round(d.volume)} ${unit}`}
            />
          ))}
        </div>
      </div>

      {stats.volumeByPart.length > 0 && (
        <div className="card stack-sm">
          <h3>Volume by area</h3>
          {stats.volumeByPart.slice(0, 8).map((p) => (
            <div key={p.part} className="hbar">
              <span style={{ width: 110 }}>{BODY_PART_LABELS[p.part] ?? p.part}</span>
              <div className="track">
                <div className="fill" style={{ width: `${(p.v / maxPart) * 100}%` }} />
              </div>
              <span className="muted" style={{ width: 60, textAlign: 'right' }}>
                {p.v} {unit}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="stack-sm">
        <h3>Sessions</h3>
        {sessions.length === 0 ? (
          <div className="card empty">No workouts logged yet.</div>
        ) : (
          <div className="list">
            {sessions.map((s) => {
              const open = expanded === s.id;
              const doneSets = s.items.reduce((a, i) => a + i.sets.filter((x) => x.done).length, 0);
              return (
                <div key={s.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <button
                    className="row between"
                    style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textAlign: 'left', width: '100%' }}
                    onClick={() => setExpanded(open ? null : s.id)}
                  >
                    <div className="grow">
                      <div className="title">{s.name}</div>
                      <div className="small muted">
                        {fmtDate(s.endedAt)} {fmtTime(s.endedAt)} · {fmtMin(s.durationSec)} · {doneSets} sets · {s.volume} {unit}
                      </div>
                    </div>
                    <span className={`badge ${s.completed ? 'ok' : ''}`}>{s.completed ? 'Complete' : 'Partial'}</span>
                  </button>
                  {open && (
                    <div className="stack-sm" style={{ marginTop: 8 }}>
                      {s.note && <div className="small">"{s.note}"</div>}
                      {s.items.map((item, i) => {
                        const e = byId.get(item.exerciseId);
                        const done = item.sets.filter((x) => x.done);
                        const best = stats.bestSet.get(item.exerciseId);
                        return (
                          <div key={i} className="row between small">
                            <button
                              className="grow"
                              style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textAlign: 'left', cursor: e ? 'pointer' : 'default' }}
                              onClick={() => e && onOpen(e)}
                            >
                              {e?.name ?? item.exerciseId}
                            </button>
                            <span className="muted">
                              {done.length ? done.map((x) => `${x.reps}×${x.weight || 'bw'}`).join(', ') : 'skipped'}
                              {best && best.weight > 0 ? ` · best ${best.weight}${unit}` : ''}
                            </span>
                          </div>
                        );
                      })}
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                          if (window.confirm('Delete this workout from history?')) actions.deleteWorkoutSession(s.id);
                        }}
                      >
                        Delete workout
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
