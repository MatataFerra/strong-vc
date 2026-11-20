import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DbProvider, useDb } from '../../db/DbProvider';
import { createTestDb } from '../../db/testDb';
import { EmptyState } from '../EmptyState';
import { ErrorRetry } from '../ErrorRetry';

test('ErrorRetry shows the message and retries on press', async () => {
  const onRetry = jest.fn();
  await render(<ErrorRetry message="No se pudo cargar" onRetry={onRetry} />);
  expect(screen.getByText('No se pudo cargar')).toBeTruthy();
  await fireEvent.press(screen.getByText('Reintentar'));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test('EmptyState renders title and message', async () => {
  await render(<EmptyState title="Nada por acá" message="Todo es opcional." />);
  expect(screen.getByText('Nada por acá')).toBeTruthy();
  expect(screen.getByText('Todo es opcional.')).toBeTruthy();
});

test('DbProvider with an injected db renders children that can use it', async () => {
  const db = await createTestDb();
  function Child() {
    return <Text>{useDb() === db ? 'db lista' : 'otra db'}</Text>;
  }
  await render(<DbProvider db={db}><Child /></DbProvider>);
  expect(await screen.findByText('db lista')).toBeTruthy();
});
