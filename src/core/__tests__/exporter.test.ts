import { buildJsonExport, buildSetsCsv } from '../exporter';
import type { Workout, WorkoutSet } from '../types';

const w: Workout = { id: 1, templateId: null, name: 'Libre', startedAt: '2026-11-17T18:00:00', endedAt: '2026-11-17T18:30:00', note: null };
const set: WorkoutSet = { id: 1, workoutId: 1, exerciseId: 1, exerciseName: 'Sentadilla', position: 0, weightKg: 60, reps: 8, done: true };

test('empty CSV has only the header', () => {
  expect(buildSetsCsv([], [])).toBe('date,workout,exercise,set,weight_kg,reps,done\n');
});

test('CSV escapes commas and quotes', () => {
  const csv = buildSetsCsv([w], [{ ...set, exerciseName: 'Press, banca "plano"' }]);
  expect(csv).toContain('"Press, banca ""plano"""');
  expect(csv.split('\n')[1]).toBe('2026-11-17,Libre,"Press, banca ""plano""",1,60,8,1');
});

test('JSON export carries app identity and data', () => {
  const json = JSON.parse(buildJsonExport({ workouts: [] }, new Date('2026-11-20T10:00:00Z')));
  expect(json).toMatchObject({ app: 'strong-personal', version: 1, exportedAt: '2026-11-20T10:00:00.000Z', data: { workouts: [] } });
});
