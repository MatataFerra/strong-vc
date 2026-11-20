import type { Db } from '../types';

/** weekday: 1 = lunes … 7 = domingo; templateId null = día de descanso. */
export interface RoutineDay {
  weekday: number;
  templateId: number | null;
}

export const getRoutine = (db: Db) =>
  db.getAllAsync<RoutineDay>('SELECT weekday, template_id AS templateId FROM routine_days ORDER BY weekday');

export async function saveRoutine(db: Db, days: RoutineDay[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM routine_days');
    for (const d of days) {
      await db.runAsync('INSERT INTO routine_days (weekday, template_id) VALUES (?, ?)', d.weekday, d.templateId);
    }
  });
}
