import type { DailyLog } from '../../core/types';
import type { Db } from '../types';

export async function addLog(db: Db, log: Omit<DailyLog, 'id'>): Promise<number> {
  return (
    await db.runAsync(
      'INSERT INTO daily_logs (date, kind, value, unit, note) VALUES (?, ?, ?, ?, ?)',
      log.date, log.kind, log.value, log.unit, log.note,
    )
  ).lastInsertRowId;
}

export const listLogs = (db: Db, fromDate: string, toDate: string) =>
  db.getAllAsync<DailyLog>(
    'SELECT id, date, kind, value, unit, note FROM daily_logs WHERE date BETWEEN ? AND ? ORDER BY date, id',
    fromDate, toDate,
  );

export async function deleteLog(db: Db, id: number): Promise<void> {
  await db.runAsync('DELETE FROM daily_logs WHERE id = ?', id);
}
