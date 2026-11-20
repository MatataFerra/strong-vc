import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { buildJsonExport } from '../src/core/exporter';
import { DbProvider } from '../src/db/DbProvider';
import { listTemplates } from '../src/db/repos/templates';
import { getActiveWorkout, getAllForExport } from '../src/db/repos/workouts';
import { createTestDb } from '../src/db/testDb';
import { HistoryScreen } from '../src/features/history/HistoryScreen';
import { TrainScreen } from '../src/features/train/TrainScreen';
import { ToastProvider } from '../src/ui/Toast';

jest.mock('expo-notifications', () => {
  throw new Error('no native notifications in tests');
});

test('template → log a set → finish → appears in history → included in export', async () => {
  const db = await createTestDb();
  const [template] = await listTemplates(db);

  const train = await render(
    <DbProvider db={db}>
      <ToastProvider>
        <TrainScreen />
      </ToastProvider>
    </DbProvider>,
  );
  await fireEvent.press(await screen.findByTestId(`start-template-${template.id}`));

  const active = await waitFor(async () => {
    const a = await getActiveWorkout(db);
    if (!a) throw new Error('workout not started yet');
    return a;
  });
  const first = active.sets[0];
  await fireEvent.changeText(await screen.findByTestId(`set-weight-${first.id}`), '62,5');
  await fireEvent.changeText(screen.getByTestId(`set-reps-${first.id}`), '8');
  await fireEvent.press(screen.getByTestId(`set-done-${first.id}`));
  await screen.findByTestId('rest-remaining');
  await fireEvent.press(screen.getByTestId('finish-workout'));
  expect(await screen.findByText('Entrenamiento guardado')).toBeTruthy();
  await train.unmount();

  await render(
    <DbProvider db={db}>
      <HistoryScreen />
    </DbProvider>,
  );
  expect(await screen.findByText(template.name)).toBeTruthy();

  const json = JSON.parse(buildJsonExport(await getAllForExport(db), new Date()));
  expect(json.data.workout_sets).toEqual(
    expect.arrayContaining([expect.objectContaining({ id: first.id, weight_kg: 62.5, reps: 8, done: 1 })]),
  );
});
