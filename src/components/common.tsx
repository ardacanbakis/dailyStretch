import { useEffect, type ReactNode } from 'react';
import type { BodyArea, Exercise } from '../types';
import { BODY_AREA_LABELS, EQUIPMENT_LABELS, EXERCISE_KIND_LABELS, INTENSITY_LABELS, POSITION_LABELS } from '../types';
import { EXERCISES } from '../data/exercises';
import { contextFromState, type EngineContext } from '../engine/context';
import { useAppState } from '../state/store';

export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function fmtMin(sec: number): string {
  if (sec < 60) return `${Math.round(sec)} s`;
  const m = sec / 60;
  const rounded = Math.round(m * 2) / 2;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} min`;
}

export function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function useEngineContext(): EngineContext {
  const state = useAppState();
  return contextFromState(state, EXERCISES);
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title ?? 'Dialog'}>
        <div className="handle" />
        {title && (
          <div className="row between" style={{ marginBottom: 10 }}>
            <h2>{title}</h2>
            <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Chip({
  active,
  onClick,
  tone,
  size,
  title,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  tone?: 'warn' | 'danger' | 'ok';
  size?: 'sm';
  title?: string;
  children: ReactNode;
}) {
  const cls = ['chip', active ? 'active' : '', tone ?? '', size ?? ''].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} onClick={onClick} title={title} aria-pressed={active}>
      {children}
    </button>
  );
}

export function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="toggle">
      <div className="grow">
        <div style={{ fontWeight: 600 }}>{label}</div>
        {hint && <div className="small muted">{hint}</div>}
      </div>
      <button type="button" className={`switch ${value ? 'on' : ''}`} onClick={() => onChange(!value)} role="switch" aria-checked={value} aria-label={label} />
    </div>
  );
}

export function Seg<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((o) => (
        <button key={o.value} type="button" className={o.value === value ? 'active' : ''} onClick={() => onChange(o.value)} role="radio" aria-checked={o.value === value}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function AreaTags({ areas, max }: { areas: BodyArea[]; max?: number }) {
  const shown = max ? areas.slice(0, max) : areas;
  return (
    <div className="row wrap" style={{ gap: 4 }}>
      {shown.map((a) => (
        <span key={a} className="badge accent">
          {BODY_AREA_LABELS[a]}
        </span>
      ))}
      {max && areas.length > max && <span className="badge">+{areas.length - max}</span>}
    </div>
  );
}

export function ExerciseMeta({ exercise, compact }: { exercise: Exercise; compact?: boolean }) {
  return (
    <div className="row wrap" style={{ gap: 4 }}>
      <span className="badge">{exercise.positions.map((p) => POSITION_LABELS[p]).join(' / ')}</span>
      <span className="badge">{EXERCISE_KIND_LABELS[exercise.kind]}</span>
      {!compact && <span className="badge">{INTENSITY_LABELS[exercise.intensity]}</span>}
      {exercise.deskFriendly && <span className="badge ok">Desk friendly</span>}
      {exercise.equipment.length > 0 && <span className="badge warn">{exercise.equipment.map((e) => EQUIPMENT_LABELS[e]).join(', ')}</span>}
      {!compact && exercise.cervicalLoad === 0 && <span className="badge accent">Neck friendly</span>}
      {!compact && exercise.cervicalLoad > 0 && <span className="badge accent">Neck focused</span>}
    </div>
  );
}

export function NoteList({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null;
  return (
    <ul className="notes">
      {notes.map((n, i) => (
        <li key={i}>{n}</li>
      ))}
    </ul>
  );
}
