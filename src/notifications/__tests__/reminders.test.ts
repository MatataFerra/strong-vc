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
