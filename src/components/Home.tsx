import { useMemo, useState } from 'react';
import type { Equipment, FocusOption, Intensity, PositionFilter, Routine, RoutineRequest, SessionRecord } from '../types';
import { EQUIPMENT, EQUIPMENT_LABELS, FOCUS_LABELS, INTENSITY_LABELS, POSITION_FILTER_LABELS, TIME_OPTIONS, SESSION_TYPE_LABELS, classifySession } from '../types';
import { TEMPLATES, getTemplate, templatesForFamily } from '../data/templates';
import { generateRoutine } from '../engine/generator';
import { generateSurprise, nextDeskReset } from '../engine/surprise';
import { actions, useAppState } from '../state/store';
import { computeStats } from '../state/stats';
import type { OpenDetail } from '../App';
import { CheckInCard } from './CheckInCard';
import { Chip, Seg, Toggle, fmtMin, useEngineContext } from './common';

const FOCUS_OPTIONS: FocusOption[] = ['neck', 'upper_back', 'shoulders', 'upper_body', 'hips', 'lower_body', 'full_body', 'desk'];
const POSITION_OPTIONS: PositionFilter[] = ['any', 'seated', 'standing', 'floor', 'mixed', 'desk'];

interface Props {
  lastSession: SessionRecord | null;
  dismissLastSession: () => void;
  onPreview: (routine: Routine, request: RoutineRequest) => void;
  openDetail: OpenDetail;
}

export function Home({ lastSession, dismissLastSession, onPreview }: Props) {
  const state = useAppState();
  const ctx = useEngineContext();
  const { profile } = state;
  const stats = useMemo(() => computeStats(state), [state]);

  const [minutes, setMinutes] = useState<number>(profile.defaultMinutes);
  const [focus, setFocus] = useState<FocusOption>('full_body');
  const [intensity, setIntensity] = useState<Intensity>(profile.defaultIntensity);
  const [position, setPosition] = useState<PositionFilter>(profile.worksAtDesk ? 'desk' : 'any');
  const [equipment, setEquipment] = useState<Equipment[]>(profile.ownedEquipment);
  const [atDesk, setAtDesk] = useState(profile.worksAtDesk);
  const [showBuilder, setShowBuilder] = useState(false);
  const [openFamily, setOpenFamily] = useState<string | null>(null);

  const neckOff = ctx.neckSymptomsIncreasedToday || ctx.checkIn.neck === 'avoid' || !profile.neckExercisesEnabled || profile.avoidNeckAdvised;

  const baseRequest = (templateId: string, mins: number, overrides: Partial<RoutineRequest> = {}): RoutineRequest => ({
    templateId,
    minutes: mins,
    intensity,
    position: position === 'desk' && !atDesk ? 'any' : position,
    equipment,
    atDesk,
    checkIn: ctx.checkIn,
    ...overrides,
  });

  const go = (templateId: string, minsOverride?: number, overrides: Partial<RoutineRequest> = {}) => {
    const t = getTemplate(templateId);
    const mins = Math.max(t?.minMinutes ?? 2, Math.min(t?.maxMinutes ?? 30, minsOverride ?? minutes));
    const request = baseRequest(templateId, mins, overrides);
    onPreview(generateRoutine(request, ctx), request);
  };

  const surprise = () => {
    const { routine, request } = generateSurprise(ctx, {
      minutes,
      atDesk,
      equipment,
      position: position === 'any' ? undefined : position,
    });
    onPreview(routine, request);
  };

  const deskReset = () => {
    const { template, cursor } = nextDeskReset(state.deskResetCursor, ctx.checkIn, ctx);
    actions.setDeskResetCursor(cursor);
    go(template.id, Math.min(minutes, 5), { position: 'desk', atDesk: true });
  };

  const buildCustom = () => {
    const request = baseRequest('custom', minutes, { focus });
    onPreview(generateRoutine(request, ctx), request);
  };

  const greeting = profile.name ? `Hi ${profile.name}` : 'Hello';

  return (
    <div className="screen">
      <div className="stack-sm">
        <h1>{greeting}</h1>
        <p className="muted">
          {stats.streakDays > 0 ? `${stats.streakDays}-day streak · ` : ''}
          {stats.sessionsThisWeek} session{stats.sessionsThisWeek === 1 ? '' : 's'} and {stats.minutesThisWeek} min this week
        </p>
      </div>

      {lastSession && (
        <div className="card accent row between">
          <div className="grow">
            <div style={{ fontWeight: 600 }}>Logged: {lastSession.name}</div>
            <div className="small muted">
              {SESSION_TYPE_LABELS[classifySession(lastSession.durationSec)]} · {fmtMin(lastSession.durationSec)} · {lastSession.items.filter((i) => i.outcome === 'done').length} exercises
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={dismissLastSession} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      {profile.askCheckIn && <CheckInCard />}

      <div className="hero">
        <div>
          <h2>Ready when you are</h2>
          <p className="muted small">Time available: {minutes} min{atDesk ? ' · at your desk' : ''}</p>
        </div>
        <div className="chip-row" role="group" aria-label="Time">
          {TIME_OPTIONS.map((m) => (
            <button key={m} type="button" className={`btn btn-sm ${minutes === m ? 'btn-primary' : ''}`} onClick={() => setMinutes(m)}>
              {m} min
            </button>
          ))}
        </div>
        <div className="row wrap">
          <button className="btn btn-primary btn-lg grow" onClick={surprise}>
            ✨ Surprise me
          </button>
          <button className="btn btn-lg grow" onClick={deskReset}>
            ⚡ Quick desk reset
          </button>
        </div>
        {neckOff && <p className="small muted">Direct neck work is off today; routines will focus on the surrounding areas.</p>}
      </div>

      <div className="row between">
        <h2>Routines</h2>
        <button className="btn btn-sm" onClick={() => setShowBuilder((v) => !v)}>
          {showBuilder ? 'Hide filters' : 'Filters'}
        </button>
      </div>

      {showBuilder && (
        <div className="card stack">
          <div className="field">
            <span className="label">Focus</span>
            <div className="chip-row">
              {FOCUS_OPTIONS.map((f) => (
                <Chip key={f} active={focus === f} onClick={() => setFocus(f)}>
                  {FOCUS_LABELS[f]}
                </Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="label">Intensity</span>
            <Seg options={(['very_gentle', 'gentle', 'normal'] as Intensity[]).map((v) => ({ value: v, label: INTENSITY_LABELS[v] }))} value={intensity} onChange={setIntensity} />
            <span className="tiny muted">Neck exercises are always kept gentle regardless of this setting.</span>
          </div>
          <div className="field">
            <span className="label">Position</span>
            <div className="chip-row">
              {POSITION_OPTIONS.map((p) => (
                <Chip key={p} active={position === p} onClick={() => setPosition(p)}>
                  {POSITION_FILTER_LABELS[p]}
                </Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="label">Equipment available now</span>
            <div className="chip-row">
              <Chip active={equipment.length === 0} onClick={() => setEquipment([])}>
                None
              </Chip>
              {EQUIPMENT.map((eq) => (
                <Chip key={eq} active={equipment.includes(eq)} onClick={() => setEquipment((list) => (list.includes(eq) ? list.filter((x) => x !== eq) : [...list, eq]))}>
                  {EQUIPMENT_LABELS[eq]}
                </Chip>
              ))}
            </div>
          </div>
          <Toggle label="I'm at my desk" hint="Only desk-friendly exercises, no lying down." value={atDesk} onChange={setAtDesk} />
          <button className="btn btn-primary btn-block" onClick={buildCustom}>
            Build a {minutes}-minute {FOCUS_LABELS[focus].toLowerCase()} routine
          </button>
        </div>
      )}

      <FamilyCard
        title="Neck Focus"
        subtitle="5-15 min · neck, upper back, shoulders, thoracic spine, chest"
        open={openFamily === 'neck'}
        onToggle={() => setOpenFamily(openFamily === 'neck' ? null : 'neck')}
        onQuick={() => go(pickFresh(templatesForFamily('neck').map((t) => t.id), state.recentRoutines), undefined)}
        variants={templatesForFamily('neck')}
        onPick={(id) => go(id)}
        disabled={neckOff}
        disabledNote="Neck routines are unavailable today. Try Upper Body or Full Body instead."
      />
      <FamilyCard
        title="Quick Desk Reset"
        subtitle="2-5 min · seated or standing, rotates between focus areas"
        open={openFamily === 'desk'}
        onToggle={() => setOpenFamily(openFamily === 'desk' ? null : 'desk')}
        onQuick={deskReset}
        variants={templatesForFamily('desk')}
        onPick={(id) => go(id, Math.min(minutes, 5), { position: 'desk', atDesk: true })}
      />
      <FamilyCard
        title="Upper Body Mobility"
        subtitle="5-15 min · neck, shoulders, scapulae, thoracic spine, chest, wrists"
        open={false}
        onToggle={() => go('upper_body')}
        onQuick={() => go('upper_body')}
        variants={[]}
        onPick={() => go('upper_body')}
      />
      <FamilyCard
        title="Lower Body Mobility"
        subtitle="5-20 min · hips, hip flexors, glutes, hamstrings, quads, calves, ankles"
        open={false}
        onToggle={() => go('lower_body')}
        onQuick={() => go('lower_body')}
        variants={[]}
        onPick={() => go('lower_body')}
      />
      <FamilyCard
        title="Full Body"
        subtitle="5-30 min · every area, with neck and upper back first"
        open={openFamily === 'full'}
        onToggle={() => setOpenFamily(openFamily === 'full' ? null : 'full')}
        onQuick={() => go(fullFor(minutes))}
        variants={templatesForFamily('full')}
        onPick={(id) => go(id, getTemplate(id)?.defaultMinutes)}
      />

      {state.recentRoutines.length > 0 && (
        <div className="stack-sm">
          <h3>Recently generated</h3>
          <div className="list">
            {[...state.recentRoutines]
              .reverse()
              .slice(0, 3)
              .map((r) => (
                <button
                  key={r.id}
                  className="list-item"
                  style={{ cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => {
                    const request = baseRequest(r.templateId, r.requestedMinutes);
                    onPreview({ ...r, id: `${r.id}_again`, createdAt: Date.now(), notes: ['Repeated from a recent routine.'] }, request);
                  }}
                >
                  <div className="grow">
                    <div className="title">{r.name}</div>
                    <div className="small muted">
                      {r.items.length} exercises · {r.requestedMinutes} min
                    </div>
                  </div>
                  <span className="badge">Repeat</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function fullFor(minutes: number): string {
  if (minutes <= 7) return 'full_quick';
  if (minutes <= 12) return 'full_standard';
  if (minutes <= 20) return 'full_extended';
  return 'full_deep';
}

/** Pick a variant that has not been used recently. */
function pickFresh(ids: string[], recent: Routine[]): string {
  const recentIds = recent.slice(-6).map((r) => r.templateId);
  const fresh = ids.filter((id) => !recentIds.includes(id));
  const pool = fresh.length ? fresh : ids;
  return pool[Math.floor(Math.random() * pool.length)];
}

function FamilyCard({
  title,
  subtitle,
  open,
  onToggle,
  onQuick,
  variants,
  onPick,
  disabled,
  disabledNote,
}: {
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  onQuick: () => void;
  variants: typeof TEMPLATES;
  onPick: (id: string) => void;
  disabled?: boolean;
  disabledNote?: string;
}) {
  return (
    <div className="card stack-sm">
      <div className="row between">
        <button className="grow" style={{ background: 'none', border: 'none', textAlign: 'left', padding: 0, color: 'inherit' }} onClick={onToggle} disabled={disabled}>
          <h3>{title}</h3>
          <div className="small muted">{subtitle}</div>
        </button>
        <button className="btn btn-primary btn-sm" onClick={onQuick} disabled={disabled}>
          Go
        </button>
      </div>
      {disabled && disabledNote && <div className="small muted">{disabledNote}</div>}
      {open && variants.length > 0 && (
        <div className="list" style={{ marginTop: 4 }}>
          {variants.map((t) => (
            <button key={t.id} className="list-item" style={{ cursor: 'pointer', textAlign: 'left' }} onClick={() => onPick(t.id)}>
              <div className="grow">
                <div className="title">{t.name}</div>
                <div className="small muted">{t.description}</div>
              </div>
              <span className="badge">
                {t.minMinutes}-{t.maxMinutes} min
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
