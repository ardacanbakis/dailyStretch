import { ANIMATIONS } from './anims';
import { FigureView } from './FigureView';
import type { FigureAnimation } from './model';

/** Fallback used if an exercise has no authored animation yet. */
const FALLBACK: FigureAnimation = {
  caption: 'Exercise demonstration',
  frames: [{}, { neck: 6, head: 6 }],
};

export function animFor(exerciseId: string): FigureAnimation {
  return ANIMATIONS[exerciseId] ?? FALLBACK;
}

export function ExerciseFigure({
  exerciseId,
  playing = true,
  staticFrame,
  size = '100%',
}: {
  exerciseId: string;
  playing?: boolean;
  staticFrame?: number;
  size?: number | string;
}) {
  return <FigureView anim={animFor(exerciseId)} playing={playing} staticFrame={staticFrame} size={size} />;
}

export function FigureThumb({ exerciseId, large }: { exerciseId: string; large?: boolean }) {
  return (
    <div className={`figure-thumb ${large ? 'lg' : ''}`} aria-hidden>
      <ExerciseFigure exerciseId={exerciseId} staticFrame={1} />
    </div>
  );
}
