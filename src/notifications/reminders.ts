import type { Reminder } from '../db/repos/reminders';
import { listReminders, upsertReminder } from '../db/repos/reminders';
import type { Db } from '../db/types';
import { cancelNotification, scheduleWeekly } from './notifications';

/** Cancels or reschedules every enabled reminder so the OS schedule matches the mute setting. */
export async function applyMute(db: Db, muted: boolean): Promise<{ scheduled: number; failed: number }> {
  let scheduled = 0;
  let failed = 0;
  for (const r of await listReminders(db)) {
    await cancelNotification(r.notificationId);
    let notificationId: string | null = null;
    if (!muted && r.enabled) {
      notificationId = await scheduleWeekly(r.weekday, r.hour, r.minute);
      notificationId ? scheduled++ : failed++;
    }
    await upsertReminder(db, { ...r, notificationId });
  }
  return { scheduled, failed };
}

export async function addReminder(
  db: Db,
  r: Pick<Reminder, 'weekday' | 'hour' | 'minute'>,
  muted: boolean,
): Promise<{ scheduled: boolean }> {
  const notificationId = muted ? null : await scheduleWeekly(r.weekday, r.hour, r.minute);
  await upsertReminder(db, { ...r, enabled: true, notificationId });
  return { scheduled: notificationId !== null };
}
