import { BODY_PART_LABELS, type WorkoutExercise } from '../../workout/types';
import { datasetAttribution } from '../../workout/data';
import { isCompound } from '../../workout/templates';
import { actions, useAppState } from '../../state/store';
import { Sheet } from '../common';
import { WorkoutGif, WorkoutGifThumb } from './WorkoutGif';

interface Props {
  exercise: WorkoutExercise;
  onClose: () => void;
  onUse?: (e: WorkoutExercise) => void;
  alternatives?: WorkoutExercise[];
  onOpen?: (e: WorkoutExercise) => void;
}

export function WorkoutExerciseDetail({ exercise, onClose, onUse, alternatives = [], onOpen }: Props) {
  const state = useAppState();
  const fav = state.workout.favorites.includes(exercise.id);
  const excluded = state.workout.excluded.includes(exercise.id);
  const last = state.workout.lastWeight[exercise.id];

  return (
    <Sheet open onClose={onClose} title={exercise.name}>
      <div className="stack">
        <WorkoutGif exercise={exercise} />
        <div className="attribution">{datasetAttribution()}</div>

        {onUse && (
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              onUse(exercise);
              onClose();
            }}
          >
            Use this exercise
          </button>
        )}

        <div className="row wrap" style={{ gap: 4 }}>
          <span className="badge accent">{BODY_PART_LABELS[exercise.bodyPart] ?? exercise.bodyPart}</span>
          <span className="badge">{exercise.equipment}</span>
          <span className="badge">{exercise.target}</span>
          {isCompound(exercise) && <span className="badge ok">Compound</span>}
          {last !== undefined && (
            <span className="badge warn">
              Last: {last} {state.workout.profile.unit}
            </span>
          )}
        </div>

        <div className="stack-sm">
          <div className="label">How to do it</div>
          <ol className="steps">
            {exercise.instructions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>

        <div className="stack-sm">
          <div className="label">Muscles</div>
          <div className="small">
            Primary: {exercise.target}
            {exercise.muscleGroup ? ` · ${exercise.muscleGroup}` : ''}
          </div>
          {exercise.secondary.length > 0 && <div className="small muted">Also worked: {exercise.secondary.join(', ')}</div>}
        </div>

        <div className="row wrap">
          <button className={`btn btn-sm ${fav ? 'btn-primary' : ''}`} onClick={() => actions.toggleWorkoutFavorite(exercise.id)}>
            {fav ? '★ Favorite' : '☆ Favorite'}
          </button>
          <button className={`btn btn-sm ${excluded ? 'btn-danger' : ''}`} onClick={() => actions.toggleWorkoutExcluded(exercise.id)}>
            {excluded ? 'Excluded' : 'Exclude'}
          </button>
        </div>

        {alternatives.length > 0 && (
          <div className="stack-sm">
            <h3>Similar exercises</h3>
            <div className="list">
              {alternatives.map((a) => (
                <div key={a.id} className="list-item">
                  <WorkoutGifThumb exercise={a} />
                  <div className="grow">
                    <div className="title">{a.name}</div>
                    <div className="small muted">{a.equipment}</div>
                  </div>
                  <div className="stack-sm">
                    {onOpen && (
                      <button className="btn btn-sm" onClick={() => onOpen(a)}>
                        View
                      </button>
                    )}
                    {onUse && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          onUse(a);
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
