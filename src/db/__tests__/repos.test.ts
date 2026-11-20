import { createTestDb } from '../testDb';
import { deleteExercise, listExercises } from '../repos/exercises';
import { addLog, listLogs } from '../repos/logs';
import { getRoutine, saveRoutine } from '../repos/routines';
import { getSettings, setSetting } from '../repos/settings';
import { createTemplate, deleteTemplate, listTemplates } from '../repos/templates';
import {
  addSet, deleteAllData, discardWorkout, finishWorkout, getActiveWorkout, getAllForExport,
  getWorkoutSets, listWorkouts, startWorkout, updateSet,
} from '../repos/workouts';

test('seeds exercises and two templates on first run', async () => {
  const db = await createTestDb();
  expect((await listExercises(db)).length).toBeGreaterThanOrEqual(20);
  expect((await listTemplates(db)).map((t) => t.name)).toEqual(['Cuerpo completo A', 'Cuerpo completo B']);
});

test('active workout survives a reopen and is not duplicated', async () => {
  const db = await createTestDb();
  const [t] = await listTemplates(db);
  const id = await startWorkout(db, t.id);
  expect(await startWorkout(db, t.id)).toBe(id);
  const active = await getActiveWorkout(db);
  expect(active!.workout.id).toBe(id);
  expect(active!.sets.length).toBe(t.items.reduce((n, i) => n + i.sets, 0));
});

test('finishing a workout moves it to history and keeps exercise names after deletion', async () => {
  const db = await createTestDb();
  const [t] = await listTemplates(db);
  const id = await startWorkout(db, t.id);
  const active = (await getActiveWorkout(db))!;
  await updateSet(db, active.sets[0].id, { weightKg: 60, reps: 8, done: true });
  await finishWorkout(db, id, 'Bien');
  expect(await getActiveWorkout(db)).toBeNull();
  expect((await listWorkouts(db, { limit: 10 })).map((w) => w.id)).toEqual([id]);

  await deleteExercise(db, active.sets[0].exerciseId!);
  await deleteTemplate(db, t.id);
  const sets = await getWorkoutSets(db, id);
  expect(sets[0]).toMatchObject({ exerciseName: active.sets[0].exerciseName, exerciseId: null, weightKg: 60, reps: 8, done: true });
});

test('a new workout prefills weight from the last completed set of that exercise', async () => {
  const db = await createTestDb();
  const [t] = await listTemplates(db);
  const first = await startWorkout(db, t.id);
  const s0 = (await getActiveWorkout(db))!.sets[0];
  await updateSet(db, s0.id, { weightKg: 62.5, done: true });
  await finishWorkout(db, first);
  await startWorkout(db, t.id);
  expect((await getActiveWorkout(db))!.sets[0].weightKg).toBe(62.5);
});

test('free workout, add set and discard', async () => {
  const db = await createTestDb();
  const id = await startWorkout(db, null);
  const [ex] = await listExercises(db);
  await addSet(db, id, ex.id);
  expect((await getActiveWorkout(db))!.sets).toHaveLength(1);
  await discardWorkout(db, id);
  expect(await getActiveWorkout(db)).toBeNull();
  expect(await listWorkouts(db, { limit: 10 })).toEqual([]);
});

test('custom templates, routines, logs and settings round trip', async () => {
  const db = await createTestDb();
  const [a, b] = await listExercises(db);
  const tid = await createTemplate(db, 'Pierna', [{ exerciseId: a.id, sets: 2, reps: 10 }, { exerciseId: b.id, sets: 1, reps: 5 }]);
  expect((await listTemplates(db)).find((t) => t.id === tid)!.items).toHaveLength(2);

  await saveRoutine(db, [{ weekday: 1, templateId: tid }, { weekday: 2, templateId: null }]);
  expect(await getRoutine(db)).toEqual([{ weekday: 1, templateId: tid }, { weekday: 2, templateId: null }]);

  await addLog(db, { date: '2026-11-20', kind: 'mood', value: 3, unit: null, note: null });
  expect(await listLogs(db, '2026-11-20', '2026-11-20')).toHaveLength(1);

  expect(await getSettings(db)).toMatchObject({ weightUnit: 'kg', distanceUnit: 'km', remindersMuted: false, healthWorkouts: false });
  await setSetting(db, 'weightUnit', 'lb');
  await setSetting(db, 'remindersMuted', true);
  expect(await getSettings(db)).toMatchObject({ weightUnit: 'lb', remindersMuted: true });
});

test('deleteAllData wipes user data and restores defaults', async () => {
  const db = await createTestDb();
  const [t] = await listTemplates(db);
  await finishWorkout(db, await startWorkout(db, t.id));
  await addLog(db, { date: '2026-11-20', kind: 'note', value: null, unit: null, note: 'hola' });
  await setSetting(db, 'weightUnit', 'lb');
  await deleteAllData(db);
  expect(await listWorkouts(db, { limit: 10 })).toEqual([]);
  expect(await listLogs(db, '2000-01-01', '2100-01-01')).toEqual([]);
  expect(await getSettings(db)).toMatchObject({ weightUnit: 'kg' });
  expect(await listTemplates(db)).toHaveLength(2);
});

test('export includes every user table', async () => {
  const db = await createTestDb();
  const data = await getAllForExport(db);
  expect(Object.keys(data).sort()).toEqual(
    ['daily_logs', 'exercises', 'reminders', 'routine_days', 'settings', 'template_exercises', 'templates', 'workout_sets', 'workouts'],
  );
});

test('concurrent starts (double tap) create a single active workout', async () => {
  const db = await createTestDb();
  const [t] = await listTemplates(db);
  const [a, b] = await Promise.all([startWorkout(db, t.id), startWorkout(db, t.id)]);
  expect(a).toBe(b);
  await finishWorkout(db, a);
  expect(await getActiveWorkout(db)).toBeNull();
});
