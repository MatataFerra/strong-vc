import { addDays, minutesBetween, weekStart } from './dates';
import type { DailyLog, Workout, WorkoutSet } from './types';

export interface WeeklySummary {
  weekStart: string;
  activeDays: number;
  workouts: number;
  volumeKg: number;
  minutes: number;
  avgSleepMin: number | null;
  avgMood: number | null;
  avgEnergy: number | null;
}

const average = (values: number[]) =>
  values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null;

/** Summaries for the last `weeks` weeks ending with the week of `today`, oldest first. */
export function weeklySummaries(
  workouts: Workout[],
  sets: WorkoutSet[],
  logs: DailyLog[],
  weeks: number,
  today: string,
): WeeklySummary[] {
  const current = weekStart(today);
  const finished = workouts.filter((w) => w.endedAt !== null);
  const volumeByWorkout = new Map<number, number>();
  for (const s of sets) {
    if (s.done) volumeByWorkout.set(s.workoutId, (volumeByWorkout.get(s.workoutId) ?? 0) + s.weightKg * s.reps);
  }

  const result: WeeklySummary[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(current, -7 * i);
    const inWeek = (date: string) => weekStart(date) === start;
    const weekWorkouts = finished.filter((w) => inWeek(w.startedAt.slice(0, 10)));
    const weekLogs = logs.filter((l) => inWeek(l.date));
    const activity = weekLogs.filter((l) => l.kind === 'activity');
    const values = (kind: DailyLog['kind']) =>
      weekLogs.filter((l) => l.kind === kind && l.value !== null).map((l) => l.value as number);

    const days = new Set([...weekWorkouts.map((w) => w.startedAt.slice(0, 10)), ...activity.map((l) => l.date)]);
    result.push({
      weekStart: start,
      activeDays: days.size,
      workouts: weekWorkouts.length,
      volumeKg: Math.round(weekWorkouts.reduce((sum, w) => sum + (volumeByWorkout.get(w.id) ?? 0), 0)),
      minutes:
        weekWorkouts.reduce((sum, w) => sum + minutesBetween(w.startedAt, w.endedAt as string), 0) +
        activity.filter((l) => l.unit === 'min').reduce((sum, l) => sum + (l.value ?? 0), 0),
      avgSleepMin: average(values('sleep')),
      avgMood: average(values('mood')),
      avgEnergy: average(values('energy')),
    });
  }
  return result;
}
