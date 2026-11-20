jest.mock('../../../health/healthkit', () => ({
  isHealthEnabled: () => true,
  readSleepMinutes: jest.fn(async () => 450),
  readSteps: jest.fn(async () => 8123),
}));

import { render, screen } from '@testing-library/react-native';

import { DbProvider } from '../../../db/DbProvider';
import { setSetting } from '../../../db/repos/settings';
import { createTestDb } from '../../../db/testDb';
import { ToastProvider } from '../../../ui/Toast';
import { LogsScreen } from '../LogsScreen';

test('shows sleep and steps read from Apple Health when those types are enabled', async () => {
  const db = await createTestDb();
  await setSetting(db, 'healthSleep', true);
  await setSetting(db, 'healthSteps', true);
  await render(<DbProvider db={db}><ToastProvider><LogsScreen /></ToastProvider></DbProvider>);
  expect(await screen.findByText('Sueño (Salud): 7 h 30 min')).toBeTruthy();
  expect(screen.getByText('Pasos (Salud): 8123')).toBeTruthy();
});

test('shows nothing from Health when the types are off', async () => {
  const db = await createTestDb();
  await render(<DbProvider db={db}><ToastProvider><LogsScreen /></ToastProvider></DbProvider>);
  await screen.findByText('Nada registrado este día');
  expect(screen.queryByText(/Salud\)/)).toBeNull();
});
