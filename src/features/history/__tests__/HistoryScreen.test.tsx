import { render, screen } from '@testing-library/react-native';

import { DbProvider } from '../../../db/DbProvider';
import { listTemplates } from '../../../db/repos/templates';
import { finishWorkout, startWorkout } from '../../../db/repos/workouts';
import { createTestDb } from '../../../db/testDb';
import { HistoryScreen } from '../HistoryScreen';

test('shows the empty state when nothing was logged', async () => {
  const db = await createTestDb();
  await render(<DbProvider db={db}><HistoryScreen /></DbProvider>);
  expect(await screen.findByText('Tus entrenamientos aparecen acá')).toBeTruthy();
});

test('lists finished workouts', async () => {
  const db = await createTestDb();
  const [t] = await listTemplates(db);
  const id = await startWorkout(db, t.id);
  await finishWorkout(db, id);
  await render(<DbProvider db={db}><HistoryScreen /></DbProvider>);
  expect(await screen.findByTestId(`workout-row-${id}`)).toBeTruthy();
  expect(screen.getByText(t.name)).toBeTruthy();
});
