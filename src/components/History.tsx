import { useMemo, useState } from 'react';
import { BODY_AREA_LABELS, SESSION_TYPE_LABELS, classifySession, type SessionType } from '../types';
import { getExercise } from '../data/exercises';
import { actions, useAppState } from '../state/store';
import { computeStats } from '../state/stats';
import type { OpenDetail } from '../App';
import { fmtClock, fmtDate, fmtMin, fmtTime } from './common';

const TYPE_ORDER: SessionType[] = ['micro', 'short', 'full', 'deep'];
const TYPE_HINT: Record<SessionType, string> = { micro: '< 5 min', short: '5-10 min', full: '10-20 min', deep: '20+ min' };

export function History({ openDetail }: { openDetail: OpenDetail }) {
  const state = useAppState();
  const stats = useMemo(() => computeStats(state), [state]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const sessions = useMemo(() => [...state.sessions].sort((a, b) => b.endedAt - a.endedAt), [state.sessions]);
  const maxDay = Math.max(1, ...stats.last14.map((d) => d.minutes));
  const maxArea = Math.max(1, ...stats.areaMinutes.map((a) => a.minutes));

  return (
    <div className="screen">
      <h1>History</h1>

      <div className="stat-grid">
        <div className="stat">
          <div className="value">{stats.streakDays}</div>
          <div className="name">day streak</div>
        </div>
        <div className="stat">
          <div className="value">{stats.sessionsThisWeek}</div>
          <div className="name">sessions this week</div>
        </div>
        <div className="stat">
          <div className="value">{stats.minutesThisWeek}</div>
          <div className="name">minutes this week</div>
        </div>
      </div>

      <div className="card stack-sm">
        <div className="row between">
          <h3>Last 14 days</h3>
          <span className="small muted">
            {stats.totalSessions} sessions · {stats.totalMinutes} min total
          </span>
        </div>
        <div className="bars" aria-label="Minutes per day, last 14 days">
          {stats.last14.map((d) => (
            <div key={d.date} className={`bar ${d.minutes === 0 ? 'empty' : ''}`} style={{ height: `${Math.max(3, (d.minutes / maxDay) * 100)}%` }} title={`${d.date}: ${d.minutes} min`} />
          ))}
        </div>
        <div className="row between tiny muted">
          <span>2 weeks ago</span>
          <span>Today</span>
        </div>
      </div>

      <div className="card stack-sm">
        <h3>Session types</h3>
        <div className="grid-2">
          {TYPE_ORDER.map((t) => (
            <div key={t} className="row between" style={{ padding: '4px 0' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{SESSION_TYPE_LABELS[t]}</div>
                <div className="tiny muted">{TYPE_HINT[t]}</div>
              </div>
              <span className="badge accent">{stats.byType[t]}</span>
            </div>
          ))}
        </div>
      </div>

      {stats.areaMinutes.length > 0 && (
        <div className="card stack-sm">
          <h3>Minutes by area</h3>
          {stats.areaMinutes.slice(0, 10).map((a) => (
            <div key={a.area} className="hbar">
              <span style={{ width: 130 }}>{BODY_AREA_LABELS[a.area]}</span>
              <div className="track">
                <div className="fill" style={{ width: `${(a.minutes / maxArea) * 100}%` }} />
              </div>
              <span className="muted" style={{ width: 44, textAlign: 'right' }}>
                {a.minutes} min
              </span>
            </div>
          ))}
        </div>
      )}

      {stats.topExercises.length > 0 && (
        <div className="card stack-sm">
          <h3>Most practised</h3>
          <div className="chip-row">
            {stats.topExercises.map((t) => (
              <button key={t.id} className="chip sm" onClick={() => openDetail(t.id)}>
                {t.name} · {t.count}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="stack-sm">
        <h2>Sessions</h2>
        {sessions.length === 0 ? (
          <div className="card empty">No sessions yet. Even a two-minute desk reset counts.</div>
        ) : (
          <div className="list">
            {sessions.map((s) => {
              const done = s.items.filter((i) => i.outcome === 'done').length;
              const open = expanded === s.id;
              return (
                <div key={s.id} className="list-item" style={{ alignItems: 'flex-start', flexDirection: 'column' }}>
                  <button className="row between" style={{ width: '100%', background: 'none', border: 'none', padding: 0, color: 'inherit', textAlign: 'left' }} onClick={() => setExpanded(open ? null : s.id)}>
                    <div className="grow">
                      <div className="title">{s.name}</div>
                      <div className="small muted">
                        {fmtDate(s.endedAt)} {fmtTime(s.endedAt)} · {fmtMin(s.durationSec)} · {done}/{s.items.length} exercises
                        {s.feelRating ? ` · felt ${['worse', 'meh', 'okay', 'better', 'great'][s.feelRating - 1]}` : ''}
                      </div>
                    </div>
                    <span className={`badge ${s.completed ? 'ok' : ''}`}>{SESSION_TYPE_LABELS[classifySession(s.durationSec)]}</span>
                  </button>
                  {open && (
                    <div className="stack-sm" style={{ width: '100%', marginTop: 8 }}>
                      {s.neckSymptomsIncreased && <span className="badge danger">Neck symptoms increased</span>}
                      {s.note && <div className="small">"{s.note}"</div>}
                      {s.items.map((i, idx) => (
                        <div key={idx} className="row between small">
                          <button className="grow" style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textAlign: 'left', cursor: 'pointer', textDecoration: i.outcome === 'skipped' ? 'line-through' : 'none' }} onClick={() => openDetail(i.exerciseId)}>
                            {getExercise(i.exerciseId)?.name ?? i.exerciseId}
                          </button>
                          <span className="muted">
                            {i.outcome === 'done' ? fmtClock(i.actualSec) : 'skipped'}
                            {i.feedback === 'helpful' ? ' · helpful' : i.feedback === 'painful' ? ' · painful' : ''}
                          </span>
                        </div>
                      ))}
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                          if (window.confirm('Delete this session from history?')) actions.deleteSession(s.id);
                        }}
                      >
                        Delete session
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
