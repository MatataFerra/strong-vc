import type { Db } from '../types';

export interface Exercise {
  id: number;
  name: string;
}

export const listExercises = (db: Db) => db.getAllAsync<Exercise>('SELECT id, name FROM exercises ORDER BY name');

export async function createExercise(db: Db, name: string): Promise<number> {
  const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM exercises WHERE name = ?', name);
  if (existing) return existing.id;
  return (await db.runAsync('INSERT INTO exercises (name) VALUES (?)', name)).lastInsertRowId;
}

export async function deleteExercise(db: Db, id: number): Promise<void> {
  await db.runAsync('DELETE FROM exercises WHERE id = ?', id);
}
