import type { Db } from '../types';

export interface Reminder {
  id: number;
  weekday: number;
  hour: number;
  minute: number;
  enabled: boolean;
  notificationId: string | null;
}

type Row = Omit<Reminder, 'enabled'> & { enabled: number };

export async function listReminders(db: Db): Promise<Reminder[]> {
  const rows = await db.getAllAsync<Row>(
    'SELECT id, weekday, hour, minute, enabled, notification_id AS notificationId FROM reminders ORDER BY weekday, hour, minute',
  );
  return rows.map((r) => ({ ...r, enabled: r.enabled === 1 }));
}

export async function upsertReminder(db: Db, r: Omit<Reminder, 'id'> & { id?: number }): Promise<number> {
  if (r.id) {
    await db.runAsync(
      'UPDATE reminders SET weekday = ?, hour = ?, minute = ?, enabled = ?, notification_id = ? WHERE id = ?',
      r.weekday, r.hour, r.minute, r.enabled ? 1 : 0, r.notificationId, r.id,
    );
    return r.id;
  }
  return (
    await db.runAsync(
      'INSERT INTO reminders (weekday, hour, minute, enabled, notification_id) VALUES (?, ?, ?, ?, ?)',
      r.weekday, r.hour, r.minute, r.enabled ? 1 : 0, r.notificationId,
    )
  ).lastInsertRowId;
}

export async function deleteReminder(db: Db, id: number): Promise<void> {
  await db.runAsync('DELETE FROM reminders WHERE id = ?', id);
}
