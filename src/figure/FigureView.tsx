import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { GROUND, SEG, add, animViewBox, poseAt, resolve, type FigureAnimation, type Prop, type Resolved } from './model';

interface Props {
  anim: FigureAnimation;
  size?: number | string;
  playing?: boolean;
  className?: string;
  /** Render a single static frame (for thumbnails). */
  staticFrame?: number;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

export function FigureView({ anim, size = '100%', playing = true, className, staticFrame }: Props) {
  const reduced = useReducedMotion();
  const [time, setTime] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef<number>(0);
  const animate = playing && !reduced && staticFrame === undefined;

  useEffect(() => {
    if (!animate) return;
    let last = 0;
    const tick = (now: number) => {
      if (!start.current) start.current = now;
      if (now - last > 33) {
        last = now;
        setTime((now - start.current) / 1000);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [animate, anim]);

  const pose = useMemo(() => {
    if (staticFrame !== undefined) return anim.frames[Math.min(staticFrame, anim.frames.length - 1)] ?? {};
    if (!animate) return anim.frames[Math.min(1, anim.frames.length - 1)] ?? {};
    return poseAt(anim, time);
  }, [anim, time, animate, staticFrame]);

  const r = useMemo(() => resolve(pose), [pose]);
  const viewBox = useMemo(() => animViewBox(anim), [anim]);

  return (
    <svg
      className={className}
      viewBox={viewBox}
      width={size}
      height={size}
      style={{ display: 'block', maxWidth: '100%' }}
      role="img"
      aria-label={anim.caption ?? 'Exercise demonstration'}
    >
      <Props props={r.props} r={r} />
      <Body r={r} />
    </svg>
  );
}

const FAR = { stroke: 'var(--fig-far, #9aa5a0)', opacity: 0.7 };
const NEAR = { stroke: 'var(--fig, #1d2321)' };

function Line({ a, b, w, style }: { a: { x: number; y: number }; b: { x: number; y: number }; w: number; style: { stroke: string; opacity?: number } }) {
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={w} strokeLinecap="round" stroke={style.stroke} opacity={style.opacity ?? 1} />;
}

function Body({ r }: { r: Resolved }) {
  const [far, near] = r.arms;
  const [farLeg, nearLeg] = r.legs;
  const limbW = 6;
  const noseDir = r.view === 'side' ? r.headAngle + r.facing * 90 : 180;
  const nose = add(r.headCenter, noseDir, SEG.head * 0.75);
  return (
    <g fill="none">
      {/* far limbs */}
      <Line a={farLeg.hip} b={farLeg.knee} w={limbW} style={FAR} />
      <Line a={farLeg.knee} b={farLeg.ankle} w={limbW} style={FAR} />
      <Line a={farLeg.ankle} b={farLeg.toe} w={4} style={FAR} />
      <Line a={far.shoulder} b={far.elbow} w={limbW - 1} style={FAR} />
      <Line a={far.elbow} b={far.hand} w={limbW - 1} style={FAR} />
      {/* torso and neck */}
      <Line a={r.hip} b={r.shoulder} w={9} style={NEAR} />
      <Line a={r.shoulder} b={r.neckEnd} w={5} style={NEAR} />
      {/* near limbs */}
      <Line a={nearLeg.hip} b={nearLeg.knee} w={limbW} style={NEAR} />
      <Line a={nearLeg.knee} b={nearLeg.ankle} w={limbW} style={NEAR} />
      <Line a={nearLeg.ankle} b={nearLeg.toe} w={4} style={NEAR} />
      <Line a={near.shoulder} b={near.elbow} w={limbW - 1} style={NEAR} />
      <Line a={near.elbow} b={near.hand} w={limbW - 1} style={NEAR} />
      {/* head */}
      <circle cx={r.headCenter.x} cy={r.headCenter.y} r={SEG.head} fill="var(--fig-head, #ffffff)" stroke="var(--fig, #1d2321)" strokeWidth={4} />
      {r.view === 'side' ? (
        <circle cx={nose.x} cy={nose.y} r={2.2} fill="var(--fig, #1d2321)" />
      ) : (
        <>
          <circle cx={r.headCenter.x - 4 + r.turn * 3} cy={r.headCenter.y - 1} r={1.8} fill="var(--fig, #1d2321)" />
          <circle cx={r.headCenter.x + 4 + r.turn * 3} cy={r.headCenter.y - 1} r={1.8} fill="var(--fig, #1d2321)" />
        </>
      )}
    </g>
  );
}

function Props({ props, r }: { props: Prop[]; r: Resolved }) {
  const stroke = 'var(--fig-prop, #b9b3a6)';
  const items: ReactElement[] = [];
  for (const p of props) {
    switch (p) {
      case 'floor':
        items.push(<line key={p} x1={8} y1={GROUND + 3} x2={192} y2={GROUND + 3} stroke={stroke} strokeWidth={3} strokeLinecap="round" />);
        break;
      case 'mat':
        items.push(<rect key={p} x={12} y={GROUND - 1} width={176} height={7} rx={3} fill={stroke} />);
        break;
      case 'chair':
        items.push(
          <g key={p} stroke={stroke} strokeWidth={4} strokeLinecap="round" fill="none">
            <line x1={58} y1={142} x2={134} y2={142} />
            <line x1={62} y1={142} x2={62} y2={GROUND} />
            <line x1={130} y1={142} x2={130} y2={GROUND} />
            <line x1={60} y1={142} x2={60} y2={92} />
          </g>,
        );
        break;
      case 'desk-right':
        items.push(
          <g key={p} stroke={stroke} strokeWidth={4} strokeLinecap="round" fill="none">
            <line x1={140} y1={112} x2={196} y2={112} />
            <line x1={146} y1={112} x2={146} y2={GROUND} />
            <line x1={190} y1={112} x2={190} y2={GROUND} />
          </g>,
        );
        break;
      case 'desk-left':
        items.push(
          <g key={p} stroke={stroke} strokeWidth={4} strokeLinecap="round" fill="none">
            <line x1={4} y1={112} x2={60} y2={112} />
            <line x1={10} y1={112} x2={10} y2={GROUND} />
            <line x1={54} y1={112} x2={54} y2={GROUND} />
          </g>,
        );
        break;
      case 'wall-left':
        items.push(<rect key={p} x={0} y={0} width={10} height={GROUND + 4} fill={stroke} opacity={0.6} />);
        break;
      case 'wall-right':
        items.push(<rect key={p} x={190} y={0} width={10} height={GROUND + 4} fill={stroke} opacity={0.6} />);
        break;
      case 'roller':
        items.push(<circle key={p} cx={r.shoulder.x + (r.hip.x - r.shoulder.x) * 0.35} cy={GROUND - 9} r={9} fill={stroke} />);
        break;
      case 'ball-head':
        items.push(<circle key={p} cx={r.headCenter.x + 4} cy={r.headCenter.y + 12} r={6} fill={stroke} />);
        break;
      case 'ball-shoulder':
        items.push(<circle key={p} cx={r.shoulder.x - 8} cy={r.shoulder.y} r={6} fill={stroke} />);
        break;
      case 'band':
        items.push(<line key={p} x1={r.arms[0].hand.x} y1={r.arms[0].hand.y} x2={r.arms[1].hand.x} y2={r.arms[1].hand.y} stroke="var(--accent, #1f6f5f)" strokeWidth={3} strokeLinecap="round" />);
        break;
      case 'strap':
        items.push(<line key={p} x1={r.arms[1].hand.x} y1={r.arms[1].hand.y} x2={r.legs[1].toe.x} y2={r.legs[1].toe.y} stroke="var(--accent, #1f6f5f)" strokeWidth={2.5} strokeLinecap="round" />);
        break;
    }
  }
  return <g>{items}</g>;
}
