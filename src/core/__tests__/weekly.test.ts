import { weekStart } from '../dates';
import type { DailyLog, Workout, WorkoutSet } from '../types';
import { weeklySummaries } from '../weekly';

const workout: Workout = {
  id: 1, templateId: null, name: 'Cuerpo completo A',
  startedAt: '2026-11-17T18:00:00', endedAt: '2026-11-17T18:45:00', note: null,
};
const set: WorkoutSet = {
  id: 1, workoutId: 1, exerciseId: 1, exerciseName: 'Sentadilla', position: 0, weightKg: 50, reps: 10, done: true,
};

test('weekStart maps Sunday to the previous Monday', () => {
  expect(weekStart('2026-11-22')).toBe('2026-11-16');
  expect(weekStart('2026-11-16')).toBe('2026-11-16');
});

test('weeklySummaries includes empty weeks and sums only completed sets', () => {
  const logs: DailyLog[] = [{ id: 1, date: '2026-11-18', kind: 'mood', value: 4, unit: null, note: null }];
  const s = weeklySummaries([workout], [set, { ...set, id: 2, done: false }], logs, 2, '2026-11-20');
  expect(s).toHaveLength(2);
  expect(s[0]).toMatchObject({ weekStart: '2026-11-09', workouts: 0, volumeKg: 0, avgMood: null });
  expect(s[1]).toMatchObject({ weekStart: '2026-11-16', workouts: 1, activeDays: 1, volumeKg: 500, minutes: 45, avgMood: 4 });
});

test('a Sunday-night workout counts in the week that started the previous Monday', () => {
  const sunday = { ...workout, startedAt: '2026-11-22T23:30:00', endedAt: '2026-11-22T23:59:00' };
  const s = weeklySummaries([sunday], [], [], 2, '2026-11-24');
  expect(s[0]).toMatchObject({ weekStart: '2026-11-16', workouts: 1 });
  expect(s[1]).toMatchObject({ weekStart: '2026-11-23', workouts: 0 });
});

test('activity logs add minutes and active days; unfinished workouts are ignored', () => {
  const logs: DailyLog[] = [
    { id: 1, date: '2026-11-19', kind: 'activity', value: 30, unit: 'min', note: null },
    { id: 2, date: '2026-11-19', kind: 'sleep', value: 420, unit: 'min', note: null },
  ];
  const running = { ...workout, id: 2, endedAt: null };
  const [w] = weeklySummaries([running], [], logs, 1, '2026-11-20');
  expect(w).toMatchObject({ workouts: 0, activeDays: 1, minutes: 30, avgSleepMin: 420 });
});
