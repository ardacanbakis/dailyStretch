import type { AppState, BodyArea, SessionRecord, SessionType } from '../types';
import { classifySession } from '../types';
import { dateKey, DAY_MS } from '../engine/context';
import { getExercise } from '../data/exercises';

export interface Stats {
  totalSessions: number;
  totalMinutes: number;
  streakDays: number;
  sessionsThisWeek: number;
  minutesThisWeek: number;
  byType: Record<SessionType, number>;
  topExercises: { id: string; name: string; count: number }[];
  areaMinutes: { area: BodyArea; minutes: number }[];
  last14: { date: string; minutes: number; sessions: number }[];
}

export function computeStats(state: AppState, now = Date.now()): Stats {
  const sessions = state.sessions.filter((s) => s.completed || s.items.some((i) => i.outcome === 'done'));
  const byDay = new Map<string, SessionRecord[]>();
  for (const s of sessions) {
    const k = dateKey(s.endedAt);
    byDay.set(k, [...(byDay.get(k) ?? []), s]);
  }

  // Streak: consecutive days ending today or yesterday.
  let streak = 0;
  let cursor = now;
  if (!byDay.has(dateKey(cursor))) cursor -= DAY_MS;
  while (byDay.has(dateKey(cursor))) {
    streak++;
    cursor -= DAY_MS;
  }

  const weekAgo = now - 7 * DAY_MS;
  const thisWeek = sessions.filter((s) => s.endedAt >= weekAgo);

  const byType: Record<SessionType, number> = { micro: 0, short: 0, full: 0, deep: 0 };
  for (const s of sessions) byType[classifySession(s.durationSec)]++;

  const exCount = new Map<string, number>();
  const areaSec = new Map<BodyArea, number>();
  for (const s of sessions) {
    for (const item of s.items) {
      if (item.outcome !== 'done') continue;
      exCount.set(item.exerciseId, (exCount.get(item.exerciseId) ?? 0) + 1);
      const e = getExercise(item.exerciseId);
      if (!e) continue;
      const share = item.actualSec / e.primary.length;
      for (const a of e.primary) areaSec.set(a, (areaSec.get(a) ?? 0) + share);
    }
  }
  const topExercises = [...exCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, count]) => ({ id, name: getExercise(id)?.name ?? id, count }));
  const areaMinutes = [...areaSec.entries()]
    .map(([area, sec]) => ({ area, minutes: Math.round(sec / 60) }))
    .sort((a, b) => b.minutes - a.minutes);

  const last14: Stats['last14'] = [];
  for (let i = 13; i >= 0; i--) {
    const d = dateKey(now - i * DAY_MS);
    const list = byDay.get(d) ?? [];
    last14.push({ date: d, minutes: Math.round(list.reduce((s, x) => s + x.durationSec, 0) / 60), sessions: list.length });
  }

  return {
    totalSessions: sessions.length,
    totalMinutes: Math.round(sessions.reduce((s, x) => s + x.durationSec, 0) / 60),
    streakDays: streak,
    sessionsThisWeek: thisWeek.length,
    minutesThisWeek: Math.round(thisWeek.reduce((s, x) => s + x.durationSec, 0) / 60),
    byType,
    topExercises,
    areaMinutes,
    last14,
  };
}
