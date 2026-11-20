jest.mock('../notifications', () => ({
  scheduleWeekly: jest.fn(async () => 'notif-1'),
  cancelNotification: jest.fn(async () => {}),
}));

import { createTestDb } from '../../db/testDb';
import { listReminders } from '../../db/repos/reminders';
import { cancelNotification, scheduleWeekly } from '../notifications';
import { addReminder, setReminderEnabled } from '../reminders';

test('a single reminder can be turned off and back on', async () => {
  const db = await createTestDb();
  await addReminder(db, { weekday: 1, hour: 18, minute: 0 }, false);
  const [r] = await listReminders(db);
  expect(r).toMatchObject({ enabled: true, notificationId: 'notif-1' });

  await setReminderEnabled(db, r.id, false, false);
  expect(cancelNotification).toHaveBeenCalledWith('notif-1');
  expect((await listReminders(db))[0]).toMatchObject({ enabled: false, notificationId: null });

  await setReminderEnabled(db, r.id, true, false);
  expect(scheduleWeekly).toHaveBeenLastCalledWith(1, 18, 0);
  expect((await listReminders(db))[0]).toMatchObject({ enabled: true, notificationId: 'notif-1' });
});

test('enabling while globally muted keeps it unscheduled', async () => {
  const db = await createTestDb();
  await addReminder(db, { weekday: 2, hour: 7, minute: 30 }, true);
  const [r] = await listReminders(db);
  await setReminderEnabled(db, r.id, true, true);
  expect((await listReminders(db))[0]).toMatchObject({ enabled: true, notificationId: null });
});

test('syncReminders schedules reminders that could not be scheduled before (e.g. permission granted later)', async () => {
  const { syncReminders } = require('../reminders');
  const db = await createTestDb();
  (scheduleWeekly as jest.Mock).mockResolvedValueOnce(null);
  await addReminder(db, { weekday: 3, hour: 9, minute: 0 }, false);
  expect((await listReminders(db))[0].notificationId).toBeNull();
  (scheduleWeekly as jest.Mock).mockResolvedValueOnce('notif-2');
  await syncReminders(db, false);
  expect((await listReminders(db))[0].notificationId).toBe('notif-2');
});

test('syncReminders does nothing while muted', async () => {
  const { syncReminders } = require('../reminders');
  const db = await createTestDb();
  await addReminder(db, { weekday: 3, hour: 9, minute: 0 }, true);
  await syncReminders(db, true);
  expect((await listReminders(db))[0].notificationId).toBeNull();
});
