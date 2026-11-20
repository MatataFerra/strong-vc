import { useEffect } from 'react';

import { useDb } from '../db/DbProvider';
import { getSettings } from '../db/repos/settings';
import { syncReminders } from './reminders';

/** On startup, schedules reminders that could not be scheduled earlier (e.g. permission granted later in iOS). */
export function ReminderSync() {
  const db = useDb();
  useEffect(() => {
    getSettings(db)
      .then((s) => syncReminders(db, s.remindersMuted))
      .catch(() => {
        // best effort; Ajustes retries when opened
      });
  }, [db]);
  return null;
}
