import { useState } from 'react';
import type { AreaStatus, CheckIn, Region } from '../types';
import { AREA_STATUSES, AREA_STATUS_LABELS, REGIONS, REGION_LABELS } from '../types';
import { actions, todayCheckIn, useAppState } from '../state/store';
import { Chip } from './common';

const TONE: Record<AreaStatus, 'ok' | 'warn' | 'danger' | undefined> = { good: 'ok', tight: 'warn', sore: 'danger', avoid: 'danger' };

export function CheckInCard() {
  const state = useAppState();
  const today = todayCheckIn(state);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CheckIn>(today?.checkIn ?? {});

  const hasCheckIn = Boolean(today && Object.keys(today.checkIn).length > 0);

  if (hasCheckIn && !editing) {
    const summary = REGIONS.filter((r) => today!.checkIn[r] && today!.checkIn[r] !== 'good').map((r) => `${REGION_LABELS[r]}: ${AREA_STATUS_LABELS[today!.checkIn[r]!].toLowerCase()}`);
    return (
      <div className="card soft row between">
        <div className="grow">
          <div style={{ fontWeight: 600 }}>Today's check-in</div>
          <div className="small muted">{summary.length ? summary.join(' · ') : 'Everything feels good.'}</div>
          {today?.neckSymptomsIncreased && <div className="small" style={{ color: 'var(--danger)' }}>Neck exercises are paused for today.</div>}
        </div>
        <button
          className="btn btn-sm"
          onClick={() => {
            setDraft(today!.checkIn);
            setEditing(true);
          }}
        >
          Edit
        </button>
      </div>
    );
  }

  const set = (region: Region, status: AreaStatus) => setDraft((d) => (d[region] === status ? { ...d, [region]: undefined } : { ...d, [region]: status }));

  return (
    <div className="card stack">
      <div className="row between">
        <div>
          <h3>How are you feeling today?</h3>
          <div className="small muted">Optional. Tap a status per area; leave blank for "no comment".</div>
        </div>
      </div>
      <div className="check-grid">
        {REGIONS.map((r) => (
          <div key={r} className="check-row">
            <span className="name">{REGION_LABELS[r]}</span>
            <div className="chip-row">
              {AREA_STATUSES.map((s) => (
                <Chip key={s} size="sm" tone={TONE[s]} active={draft[r] === s} onClick={() => set(r, s)}>
                  {AREA_STATUS_LABELS[s]}
                </Chip>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="row between">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setDraft({});
            if (hasCheckIn) actions.setTodayCheckIn({});
            setEditing(false);
          }}
        >
          Clear
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            const cleaned: CheckIn = {};
            for (const r of REGIONS) if (draft[r]) cleaned[r] = draft[r];
            actions.setTodayCheckIn(cleaned);
            setEditing(false);
          }}
        >
          Save check-in
        </button>
      </div>
    </div>
  );
}
