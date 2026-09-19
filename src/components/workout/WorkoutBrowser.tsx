import { useMemo, useState } from 'react';
import { BODY_PARTS, BODY_PART_LABELS, GEAR_GROUPS, type WorkoutExercise } from '../../workout/types';
import { datasetAttribution, gearOf } from '../../workout/data';
import { isCompound } from '../../workout/templates';
import { useAppState } from '../../state/store';
import { Chip } from '../common';
import { WorkoutGifThumb } from './WorkoutGif';

const PAGE = 30;

export function WorkoutBrowser({
  exercises,
  onOpen,
  onUse,
}: {
  exercises: WorkoutExercise[];
  onOpen: (e: WorkoutExercise) => void;
  onUse?: (e: WorkoutExercise) => void;
}) {
  const state = useAppState();
  const [query, setQuery] = useState('');
  const [part, setPart] = useState<string>('all');
  const [gear, setGear] = useState<string>('all');
  const [favOnly, setFavOnly] = useState(false);
  const [compoundOnly, setCompoundOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (q && !`${e.name} ${e.target} ${e.equipment}`.toLowerCase().includes(q)) return false;
      if (part !== 'all' && e.bodyPart !== part) return false;
      if (gear !== 'all' && gearOf(e.equipment) !== gear) return false;
      if (favOnly && !state.workout.favorites.includes(e.id)) return false;
      if (compoundOnly && !isCompound(e)) return false;
      return true;
    });
  }, [exercises, query, part, gear, favOnly, compoundOnly, state.workout.favorites]);

  const shown = list.slice(0, limit);

  return (
    <div className="stack">
      <div className="row between">
        <h2>Exercises</h2>
        <span className="badge">
          {list.length} / {exercises.length}
        </span>
      </div>
      <input
        className="input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setLimit(PAGE);
        }}
        placeholder="Search by name, muscle or equipment"
        aria-label="Search exercises"
      />
      <div className="chip-row">
        <Chip size="sm" active={part === 'all'} onClick={() => setPart('all')}>
          All areas
        </Chip>
        {BODY_PARTS.map((b) => (
          <Chip
            key={b}
            size="sm"
            active={part === b}
            onClick={() => {
              setPart(b);
              setLimit(PAGE);
            }}
          >
            {BODY_PART_LABELS[b]}
          </Chip>
        ))}
      </div>
      <div className="chip-row">
        <Chip size="sm" active={gear === 'all'} onClick={() => setGear('all')}>
          Any gear
        </Chip>
        {GEAR_GROUPS.map((g) => (
          <Chip
            key={g.id}
            size="sm"
            active={gear === g.id}
            onClick={() => {
              setGear(g.id);
              setLimit(PAGE);
            }}
          >
            {g.label}
          </Chip>
        ))}
      </div>
      <div className="chip-row">
        <Chip size="sm" active={favOnly} onClick={() => setFavOnly((v) => !v)}>
          ★ Favorites
        </Chip>
        <Chip size="sm" active={compoundOnly} onClick={() => setCompoundOnly((v) => !v)}>
          Compound only
        </Chip>
      </div>

      {shown.length === 0 ? (
        <div className="card empty">No exercises match those filters.</div>
      ) : (
        <div className="list">
          {shown.map((e) => (
            <div key={e.id} className="list-item">
              <WorkoutGifThumb exercise={e} />
              <button
                className="grow"
                style={{ background: 'none', border: 'none', textAlign: 'left', padding: 0, color: 'inherit', cursor: 'pointer' }}
                onClick={() => onOpen(e)}
              >
                <div className="title">
                  {state.workout.favorites.includes(e.id) ? '★ ' : ''}
                  {e.name}
                </div>
                <div className="small muted">
                  {BODY_PART_LABELS[e.bodyPart] ?? e.bodyPart} · {e.target} · {e.equipment}
                </div>
              </button>
              {onUse && (
                <button className="btn btn-sm btn-primary" onClick={() => onUse(e)} aria-label={`Add ${e.name}`}>
                  Add
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {shown.length < list.length && (
        <button className="btn btn-block" onClick={() => setLimit((l) => l + PAGE)}>
          Show more ({list.length - shown.length} left)
        </button>
      )}
      <div className="attribution">Exercise animations {datasetAttribution()}</div>
    </div>
  );
}
