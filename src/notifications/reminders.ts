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

/** Turns one reminder on or off; it is only scheduled when enabled and reminders are not globally muted. */
export async function setReminderEnabled(db: Db, id: number, enabled: boolean, muted: boolean): Promise<void> {
  const r = (await listReminders(db)).find((x) => x.id === id);
  if (!r) return;
  await cancelNotification(r.notificationId);
  const notificationId = enabled && !muted ? await scheduleWeekly(r.weekday, r.hour, r.minute) : null;
  await upsertReminder(db, { ...r, enabled, notificationId });
}

/**
 * Schedules enabled reminders that have no OS notification yet (e.g. created while permission was denied).
 * Run at startup and when opening Ajustes; a no-op while muted.
 */
export async function syncReminders(db: Db, muted: boolean): Promise<void> {
  if (muted) return;
  for (const r of await listReminders(db)) {
    if (!r.enabled || r.notificationId) continue;
    const notificationId = await scheduleWeekly(r.weekday, r.hour, r.minute);
    if (notificationId) await upsertReminder(db, { ...r, notificationId });
  }
}
