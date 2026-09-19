import { useMemo, useState } from 'react';
import type { BodyArea, Equipment, ExerciseKind, Position } from '../types';
import { BODY_AREAS, BODY_AREA_LABELS, EQUIPMENT, EQUIPMENT_LABELS, EXERCISE_KIND_LABELS, POSITION_LABELS, POSITIONS } from '../types';
import { EXERCISES } from '../data/exercises';
import { useAppState } from '../state/store';
import type { OpenDetail } from '../App';
import { Chip, ExerciseMeta, fmtMin } from './common';
import { FigureThumb } from '../figure/Figure';

type Duration = 'all' | 'short' | 'medium' | 'long';
type NeckFilter = 'all' | 'friendly' | 'focused';

export function Library({ openDetail }: { openDetail: OpenDetail }) {
  const state = useAppState();
  const [query, setQuery] = useState('');
  const [area, setArea] = useState<BodyArea | 'all'>('all');
  const [kind, setKind] = useState<ExerciseKind | 'all'>('all');
  const [position, setPosition] = useState<Position | 'all'>('all');
  const [deskOnly, setDeskOnly] = useState(false);
  const [equipment, setEquipment] = useState<Equipment | 'all' | 'none'>('all');
  const [duration, setDuration] = useState<Duration>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [neck, setNeck] = useState<NeckFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      if (q && !`${e.name} ${e.summary} ${e.category}`.toLowerCase().includes(q)) return false;
      if (area !== 'all' && !e.primary.includes(area) && !e.secondary.includes(area)) return false;
      if (kind !== 'all' && e.kind !== kind) return false;
      if (position !== 'all' && !e.positions.includes(position)) return false;
      if (deskOnly && !e.deskFriendly) return false;
      if (equipment === 'none' && e.equipment.length > 0) return false;
      if (equipment !== 'all' && equipment !== 'none' && !e.equipment.includes(equipment)) return false;
      if (duration === 'short' && e.durationSec > 60) return false;
      if (duration === 'medium' && (e.durationSec <= 60 || e.durationSec > 80)) return false;
      if (duration === 'long' && e.durationSec <= 80) return false;
      if (favoritesOnly && !state.feedback[e.id]?.favorite) return false;
      if (neck === 'friendly' && e.cervicalLoad !== 0) return false;
      if (neck === 'focused' && !e.primary.some((a) => a === 'neck' || a === 'upper_trap' || a === 'levator')) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [query, area, kind, position, deskOnly, equipment, duration, favoritesOnly, neck, state.feedback]);

  const activeCount = [area !== 'all', kind !== 'all', position !== 'all', deskOnly, equipment !== 'all', duration !== 'all', favoritesOnly, neck !== 'all'].filter(Boolean).length;

  const reset = () => {
    setArea('all');
    setKind('all');
    setPosition('all');
    setDeskOnly(false);
    setEquipment('all');
    setDuration('all');
    setFavoritesOnly(false);
    setNeck('all');
  };

  return (
    <div className="screen">
      <div className="row between">
        <h1>Exercise library</h1>
        <span className="badge">{list.length} / {EXERCISES.length}</span>
      </div>
      <div className="row">
        <input className="input grow" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exercises" aria-label="Search exercises" />
        <button className="btn btn-sm" onClick={() => setShowFilters((v) => !v)}>
          Filters{activeCount ? ` (${activeCount})` : ''}
        </button>
      </div>

      <div className="chip-row">
        <Chip size="sm" active={favoritesOnly} onClick={() => setFavoritesOnly((v) => !v)}>
          ★ Favorites
        </Chip>
        <Chip size="sm" active={deskOnly} onClick={() => setDeskOnly((v) => !v)}>
          Desk friendly
        </Chip>
        <Chip size="sm" active={neck === 'friendly'} onClick={() => setNeck(neck === 'friendly' ? 'all' : 'friendly')}>
          Neck friendly
        </Chip>
        <Chip size="sm" active={neck === 'focused'} onClick={() => setNeck(neck === 'focused' ? 'all' : 'focused')}>
          Neck focused
        </Chip>
      </div>

      {showFilters && (
        <div className="card stack">
          <div className="field">
            <span className="label">Body area</span>
            <div className="chip-row">
              <Chip size="sm" active={area === 'all'} onClick={() => setArea('all')}>
                All
              </Chip>
              {BODY_AREAS.map((a) => (
                <Chip key={a} size="sm" active={area === a} onClick={() => setArea(a)}>
                  {BODY_AREA_LABELS[a]}
                </Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="label">Type</span>
            <div className="chip-row">
              <Chip size="sm" active={kind === 'all'} onClick={() => setKind('all')}>
                All
              </Chip>
              {(Object.keys(EXERCISE_KIND_LABELS) as ExerciseKind[]).map((k) => (
                <Chip key={k} size="sm" active={kind === k} onClick={() => setKind(k)}>
                  {EXERCISE_KIND_LABELS[k]}
                </Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="label">Position</span>
            <div className="chip-row">
              <Chip size="sm" active={position === 'all'} onClick={() => setPosition('all')}>
                Any
              </Chip>
              {POSITIONS.map((p) => (
                <Chip key={p} size="sm" active={position === p} onClick={() => setPosition(p)}>
                  {POSITION_LABELS[p]}
                </Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="label">Equipment</span>
            <div className="chip-row">
              <Chip size="sm" active={equipment === 'all'} onClick={() => setEquipment('all')}>
                Any
              </Chip>
              <Chip size="sm" active={equipment === 'none'} onClick={() => setEquipment('none')}>
                None needed
              </Chip>
              {EQUIPMENT.map((eq) => (
                <Chip key={eq} size="sm" active={equipment === eq} onClick={() => setEquipment(eq)}>
                  {EQUIPMENT_LABELS[eq]}
                </Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="label">Duration</span>
            <div className="chip-row">
              {(['all', 'short', 'medium', 'long'] as Duration[]).map((d) => (
                <Chip key={d} size="sm" active={duration === d} onClick={() => setDuration(d)}>
                  {d === 'all' ? 'Any' : d === 'short' ? 'Up to 1 min' : d === 'medium' ? '1-1.5 min' : 'Over 1.5 min'}
                </Chip>
              ))}
            </div>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={reset}>
            Reset filters
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="card empty">No exercises match. Try clearing a filter.</div>
      ) : (
        <div className="list">
          {list.map((e) => {
            const fb = state.feedback[e.id];
            return (
              <button key={e.id} className="list-item" style={{ cursor: 'pointer', textAlign: 'left', alignItems: 'flex-start' }} onClick={() => openDetail(e.id)}>
                <FigureThumb exerciseId={e.id} large />
                <div className="grow stack-sm">
                  <div className="row between">
                    <span className="title">
                      {fb?.favorite ? '★ ' : ''}
                      {e.name}
                    </span>
                    <span className="badge">{fmtMin(e.durationSec)}</span>
                  </div>
                  <div className="small muted">{e.summary}</div>
                  <ExerciseMeta exercise={e} compact />
                  {fb?.excluded && <span className="badge danger">Excluded</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
