import type { Db } from '../types';

export interface TemplateItem {
  exerciseId: number;
  exerciseName: string;
  sets: number;
  reps: number;
}

export interface TemplateWithExercises {
  id: number;
  name: string;
  items: TemplateItem[];
}

export async function listTemplates(db: Db): Promise<TemplateWithExercises[]> {
  const templates = await db.getAllAsync<{ id: number; name: string }>('SELECT id, name FROM templates ORDER BY id');
  const items = await db.getAllAsync<TemplateItem & { templateId: number }>(
    `SELECT te.template_id AS templateId, te.exercise_id AS exerciseId, e.name AS exerciseName, te.sets, te.reps
     FROM template_exercises te JOIN exercises e ON e.id = te.exercise_id
     ORDER BY te.template_id, te.position`,
  );
  return templates.map((t) => ({
    ...t,
    items: items.filter((i) => i.templateId === t.id).map(({ templateId: _, ...i }) => i),
  }));
}

export async function createTemplate(
  db: Db,
  name: string,
  items: { exerciseId: number; sets: number; reps: number }[],
): Promise<number> {
  let id = 0;
  await db.withTransactionAsync(async () => {
    id = (await db.runAsync('INSERT INTO templates (name) VALUES (?)', name)).lastInsertRowId;
    for (const [position, i] of items.entries()) {
      await db.runAsync(
        'INSERT INTO template_exercises (template_id, exercise_id, position, sets, reps) VALUES (?, ?, ?, ?, ?)',
        id, i.exerciseId, position, i.sets, i.reps,
      );
    }
  });
  return id;
}

export async function deleteTemplate(db: Db, id: number): Promise<void> {
  await db.runAsync('DELETE FROM templates WHERE id = ?', id);
}
