import { useCallback, useState } from 'react';
import type { Exercise, Routine, RoutineRequest, SessionRecord } from './types';
import { useAppState, actions } from './state/store';
import { Onboarding } from './components/Onboarding';
import { Home } from './components/Home';
import { RoutinePreview } from './components/RoutinePreview';
import { SessionPlayer } from './components/SessionPlayer';
import { Library } from './components/Library';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { ExerciseDetail } from './components/ExerciseDetail';

type Tab = 'home' | 'library' | 'history' | 'settings';
type Flow = { kind: 'none' } | { kind: 'preview'; routine: Routine; request: RoutineRequest } | { kind: 'session'; routine: Routine; request: RoutineRequest };

export type OpenDetail = (id: string, opts?: { onUseInstead?: (e: Exercise) => void; request?: RoutineRequest }) => void;

interface DetailState {
  id: string;
  /** The exercise the sheet was first opened for (swap target). */
  originId: string;
  onUseInstead?: (e: Exercise) => void;
  request?: RoutineRequest;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Today', icon: '☀️' },
  { id: 'library', label: 'Library', icon: '📚' },
  { id: 'history', label: 'History', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function App() {
  const state = useAppState();
  const [tab, setTab] = useState<Tab>('home');
  const [flow, setFlow] = useState<Flow>({ kind: 'none' });
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [lastSession, setLastSession] = useState<SessionRecord | null>(null);

  const openDetail: OpenDetail = useCallback((id, opts) => setDetail({ id, originId: id, ...opts }), []);
  const closeDetail = useCallback(() => setDetail(null), []);

  if (!state.profile.onboarded) {
    return (
      <div className="app">
        <Onboarding onDone={(patch) => actions.completeOnboarding(patch)} />
      </div>
    );
  }

  if (flow.kind === 'session') {
    return (
      <div className="app session-mode">
        <SessionPlayer
          routine={flow.routine}
          request={flow.request}
          openDetail={openDetail}
          onDone={(record) => {
            if (record) {
              actions.recordSession(record);
              setLastSession(record);
            }
            setFlow({ kind: 'none' });
            setTab('home');
          }}
        />
        {detail && (
          <ExerciseDetail
            exerciseId={detail.id}
            request={detail.request}
            onClose={closeDetail}
            onOpen={(id) => setDetail({ ...detail, id })}
            onUseInstead={detail.onUseInstead}
            isOrigin={detail.id === detail.originId}
          />
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="dot" /> DailyStretch
        </div>
        {flow.kind === 'preview' && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFlow({ kind: 'none' })}>
            ← Back
          </button>
        )}
      </header>

      {flow.kind === 'preview' ? (
        <RoutinePreview
          routine={flow.routine}
          request={flow.request}
          openDetail={openDetail}
          onChange={(routine) => setFlow({ kind: 'preview', routine, request: flow.request })}
          onRegenerate={(routine, request) => setFlow({ kind: 'preview', routine, request })}
          onStart={() => {
            actions.rememberRoutine(flow.routine);
            setFlow({ kind: 'session', routine: flow.routine, request: flow.request });
          }}
        />
      ) : tab === 'home' ? (
        <Home
          lastSession={lastSession}
          dismissLastSession={() => setLastSession(null)}
          onPreview={(routine, request) => setFlow({ kind: 'preview', routine, request })}
          openDetail={openDetail}
        />
      ) : tab === 'library' ? (
        <Library openDetail={openDetail} />
      ) : tab === 'history' ? (
        <History openDetail={openDetail} />
      ) : (
        <Settings />
      )}

      {flow.kind === 'none' && (
        <nav className="bottom-nav" aria-label="Main">
          <div className="inner">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
                <span className="ico" aria-hidden>
                  {t.icon}
                </span>
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      )}

      {detail && (
          <ExerciseDetail
            exerciseId={detail.id}
            request={detail.request}
            onClose={closeDetail}
            onOpen={(id) => setDetail({ ...detail, id })}
            onUseInstead={detail.onUseInstead}
            isOrigin={detail.id === detail.originId}
          />
        )}
    </div>
  );
}
