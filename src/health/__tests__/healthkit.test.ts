jest.mock('@kingstinct/react-native-healthkit', () => {
  throw new Error('native module not available');
});

import { isHealthAvailable, readSleepMinutes, requestPermission, writeWorkout } from '../healthkit';

const workout = { id: 1, templateId: null, name: 'Libre', startedAt: '2026-11-20T10:00:00', endedAt: '2026-11-20T10:30:00', note: null };

test('without the native module every call degrades gracefully', async () => {
  expect(await isHealthAvailable()).toBe(false);
  expect(await requestPermission('workouts')).toBe(false);
  await expect(writeWorkout(workout)).resolves.toBeUndefined();
  expect(await readSleepMinutes('2026-11-20')).toBeNull();
});
