import { useEffect, useState } from 'react';
import { MEDIA_SOURCE_COUNT, mediaUrl } from '../../workout/data';
import type { WorkoutExercise } from '../../workout/types';

/**
 * Exercise animation. The media is hosted by the upstream dataset repository,
 * so this falls through the available sources and degrades to a label if none
 * of them load (offline, blocked, or the source moved).
 */
export function WorkoutGif({
  exercise,
  className = 'gif-stage full',
  still = false,
}: {
  exercise: WorkoutExercise;
  className?: string;
  /** Use the light still image instead of the animation. */
  still?: boolean;
}) {
  const [source, setSource] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSource(0);
    setFailed(false);
  }, [exercise.id]);

  return (
    <div className={className}>
      {failed ? (
        <div className="fallback">
          <div style={{ fontSize: 22 }} aria-hidden>
            🏋
          </div>
          {exercise.name}
        </div>
      ) : (
        <img
          src={mediaUrl(exercise.gif, source, still ? 'still' : 'gif')}
          alt={`${exercise.name} demonstration`}
          loading="lazy"
          decoding="async"
          onError={() => {
            if (source + 1 < MEDIA_SOURCE_COUNT) setSource(source + 1);
            else setFailed(true);
          }}
        />
      )}
    </div>
  );
}

export function WorkoutGifThumb({ exercise }: { exercise: WorkoutExercise }) {
  return <WorkoutGif exercise={exercise} className="gif-thumb" still />;
}
