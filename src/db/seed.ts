import type { Db } from './types';

export const DEFAULT_EXERCISES = [
  'Sentadilla', 'Press banca', 'Peso muerto', 'Press militar', 'Remo con barra', 'Dominadas', 'Fondos',
  'Zancadas', 'Hip thrust', 'Curl bíceps', 'Extensión tríceps', 'Elevaciones laterales', 'Prensa',
  'Curl femoral', 'Remo con mancuerna', 'Plancha', 'Face pull', 'Jalón al pecho', 'Gemelos', 'Caminata',
];

const DEFAULT_TEMPLATES: { name: string; exercises: string[] }[] = [
  { name: 'Cuerpo completo A', exercises: ['Sentadilla', 'Press banca', 'Remo con barra'] },
  { name: 'Cuerpo completo B', exercises: ['Peso muerto', 'Press militar', 'Jalón al pecho'] },
];

export async function seedIfEmpty(db: Db): Promise<void> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM exercises');
  if (row && row.n > 0) return;
  await db.withTransactionAsync(async () => {
    for (const name of DEFAULT_EXERCISES) await db.runAsync('INSERT INTO exercises (name) VALUES (?)', name);
    for (const t of DEFAULT_TEMPLATES) {
      const { lastInsertRowId } = await db.runAsync('INSERT INTO templates (name) VALUES (?)', t.name);
      for (const [position, name] of t.exercises.entries()) {
        await db.runAsync(
          `INSERT INTO template_exercises (template_id, exercise_id, position, sets, reps)
           SELECT ?, id, ?, 3, 8 FROM exercises WHERE name = ?`,
          lastInsertRowId, position, name,
        );
      }
    }
  });
}
