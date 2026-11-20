import { fireEvent, render, screen } from '@testing-library/react-native';

import { DbProvider } from '../../../db/DbProvider';
import { deleteTemplate, listTemplates } from '../../../db/repos/templates';
import { createTestDb } from '../../../db/testDb';
import { ToastProvider } from '../../../ui/Toast';
import { RoutineScreen } from '../RoutineScreen';

test('saving with a template deleted meanwhile shows a recoverable error instead of failing silently', async () => {
  const db = await createTestDb();
  const [t] = await listTemplates(db);
  await render(<DbProvider db={db}><ToastProvider><RoutineScreen /></ToastProvider></DbProvider>);
  await fireEvent.press((await screen.findAllByText(t.name))[0]);
  await deleteTemplate(db, t.id);
  await fireEvent.press(screen.getByText('Guardar rutina'));
  expect(await screen.findByText('No se pudo guardar la rutina. Probá de nuevo.')).toBeTruthy();
});
