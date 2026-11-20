import { localTimestamp } from '../../core/dates';
import type { Workout, WorkoutSet } from '../../core/types';
import { migrate, USER_TABLES } from '../migrations';
import { seedIfEmpty } from '../seed';
import type { Db, SQLParam } from '../types';

const WORKOUT_COLS = `id, template_id AS templateId, name, started_at AS startedAt, ended_at AS endedAt, note`;
const SET_COLS = `id, workout_id AS workoutId, exercise_id AS exerciseId, exercise_name AS exerciseName,
  position, weight_kg AS weightKg, reps, done`;

type SetRow = Omit<WorkoutSet, 'done'> & { done: number };
const toSet = (r: SetRow): WorkoutSet => ({ ...r, done: r.done === 1 });

async function lastWeight(db: Db, exerciseId: number): Promise<number> {
  const row = await db.getFirstAsync<{ w: number }>(
    `SELECT s.weight_kg AS w FROM workout_sets s JOIN workouts w ON w.id = s.workout_id
     WHERE s.exercise_id = ? AND s.done = 1 AND w.ended_at IS NOT NULL
     ORDER BY w.started_at DESC, s.position DESC LIMIT 1`,
    exerciseId,
  );
  return row?.w ?? 0;
}

let startQueue: Promise<unknown> = Promise.resolve();

/**
 * Starts a workout from a template (or free when null). Returns the active one if it already exists.
 * Calls are serialized so a double tap cannot create two active workouts.
 */
export function startWorkout(db: Db, templateId: number | null, now = new Date()): Promise<number> {
  const run = startQueue.then(() => startWorkoutNow(db, templateId, now));
  startQueue = run.catch(() => undefined);
  return run;
}

async function startWorkoutNow(db: Db, templateId: number | null, now: Date): Promise<number> {
  const active = await db.getFirstAsync<{ id: number }>('SELECT id FROM workouts WHERE ended_at IS NULL');
  if (active) return active.id;

  let id = 0;
  await db.withTransactionAsync(async () => {
    const template = templateId
      ? await db.getFirstAsync<{ name: string }>('SELECT name FROM templates WHERE id = ?', templateId)
      : null;
    id = (
      await db.runAsync(
        'INSERT INTO workouts (template_id, name, started_at) VALUES (?, ?, ?)',
        template ? templateId : null, template?.name ?? 'Entrenamiento libre', localTimestamp(now),
      )
    ).lastInsertRowId;
    if (!template) return;
    const items = await db.getAllAsync<{ exerciseId: number; name: string; sets: number; reps: number }>(
      `SELECT te.exercise_id AS exerciseId, e.name, te.sets, te.reps
       FROM template_exercises te JOIN exercises e ON e.id = te.exercise_id
       WHERE te.template_id = ? ORDER BY te.position`,
      templateId,
    );
    let position = 0;
    for (const item of items) {
      const weight = await lastWeight(db, item.exerciseId);
      for (let i = 0; i < item.sets; i++) {
        await db.runAsync(
          `INSERT INTO workout_sets (workout_id, exercise_id, exercise_name, position, weight_kg, reps)
           VALUES (?, ?, ?, ?, ?, ?)`,
          id, item.exerciseId, item.name, position++, weight, item.reps,
        );
      }
    }
  });
  return id;
}

export async function getWorkoutSets(db: Db, workoutId: number): Promise<WorkoutSet[]> {
  const rows = await db.getAllAsync<SetRow>(
    `SELECT ${SET_COLS} FROM workout_sets WHERE workout_id = ? ORDER BY position`,
    workoutId,
  );
  return rows.map(toSet);
}

export async function getActiveWorkout(db: Db): Promise<{ workout: Workout; sets: WorkoutSet[] } | null> {
  const workout = await db.getFirstAsync<Workout>(`SELECT ${WORKOUT_COLS} FROM workouts WHERE ended_at IS NULL`);
  if (!workout) return null;
  return { workout, sets: await getWorkoutSets(db, workout.id) };
}

export async function updateSet(
  db: Db,
  setId: number,
  patch: { weightKg?: number; reps?: number; done?: boolean },
): Promise<void> {
  const fields: string[] = [];
  const params: SQLParam[] = [];
  if (patch.weightKg !== undefined) fields.push('weight_kg = ?'), params.push(patch.weightKg);
  if (patch.reps !== undefined) fields.push('reps = ?'), params.push(patch.reps);
  if (patch.done !== undefined) fields.push('done = ?'), params.push(patch.done ? 1 : 0);
  if (!fields.length) return;
  await db.runAsync(`UPDATE workout_sets SET ${fields.join(', ')} WHERE id = ?`, ...params, setId);
}

/** Appends a set for an exercise, copying weight/reps from that exercise's last set in this workout. */
export async function addSet(db: Db, workoutId: number, exerciseId: number): Promise<number> {
  const ex = await db.getFirstAsync<{ name: string }>('SELECT name FROM exercises WHERE id = ?', exerciseId);
  if (!ex) throw new Error('El ejercicio no existe.');
  const prev = await db.getFirstAsync<{ weight_kg: number; reps: number }>(
    'SELECT weight_kg, reps FROM workout_sets WHERE workout_id = ? AND exercise_id = ? ORDER BY position DESC LIMIT 1',
    workoutId, exerciseId,
  );
  const max = await db.getFirstAsync<{ p: number | null }>(
    'SELECT MAX(position) AS p FROM workout_sets WHERE workout_id = ?',
    workoutId,
  );
  const weight = prev?.weight_kg ?? (await lastWeight(db, exerciseId));
  return (
    await db.runAsync(
      `INSERT INTO workout_sets (workout_id, exercise_id, exercise_name, position, weight_kg, reps)
       VALUES (?, ?, ?, ?, ?, ?)`,
      workoutId, exerciseId, ex.name, (max?.p ?? -1) + 1, weight, prev?.reps ?? 8,
    )
  ).lastInsertRowId;
}

export async function deleteSet(db: Db, setId: number): Promise<void> {
  await db.runAsync('DELETE FROM workout_sets WHERE id = ?', setId);
}

export async function finishWorkout(db: Db, id: number, note: string | null = null, now = new Date()): Promise<void> {
  await db.runAsync('UPDATE workouts SET ended_at = ?, note = ? WHERE id = ?', localTimestamp(now), note, id);
}

export async function discardWorkout(db: Db, id: number): Promise<void> {
  await db.runAsync('DELETE FROM workouts WHERE id = ?', id);
}

export async function deleteWorkout(db: Db, id: number): Promise<void> {
  await db.runAsync('DELETE FROM workouts WHERE id = ?', id);
}

export async function getWorkout(db: Db, id: number): Promise<Workout | null> {
  return db.getFirstAsync<Workout>(`SELECT ${WORKOUT_COLS} FROM workouts WHERE id = ?`, id);
}

export function listWorkouts(db: Db, opts: { limit: number; since?: string }): Promise<Workout[]> {
  return db.getAllAsync<Workout>(
    `SELECT ${WORKOUT_COLS} FROM workouts WHERE ended_at IS NOT NULL AND started_at >= ?
     ORDER BY started_at DESC LIMIT ?`,
    opts.since ?? '', opts.limit,
  );
}

export async function listSetsSince(db: Db, since: string): Promise<WorkoutSet[]> {
  const rows = await db.getAllAsync<SetRow>(
    `SELECT ${SET_COLS} FROM workout_sets WHERE workout_id IN
       (SELECT id FROM workouts WHERE ended_at IS NOT NULL AND started_at >= ?)
     ORDER BY workout_id, position`,
    since,
  );
  return rows.map(toSet);
}

export async function getAllForExport(db: Db): Promise<Record<string, unknown[]>> {
  const data: Record<string, unknown[]> = {};
  for (const table of USER_TABLES) data[table] = await db.getAllAsync(`SELECT * FROM ${table}`);
  return data;
}

/** Deletes every user row, then restores the default exercises and templates. */
export async function deleteAllData(db: Db): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const table of USER_TABLES) await db.runAsync(`DELETE FROM ${table}`);
    await db.runAsync(`DELETE FROM sqlite_sequence`);
  });
  await migrate(db);
  await seedIfEmpty(db);
}
