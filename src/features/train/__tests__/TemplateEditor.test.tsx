import { fireEvent, render, screen } from '@testing-library/react-native';

import { DbProvider } from '../../../db/DbProvider';
import { createTestDb } from '../../../db/testDb';
import type { Db } from '../../../db/types';
import { ToastProvider } from '../../../ui/Toast';
import { TemplateEditor } from '../TemplateEditor';

async function renderEditor(db: Db) {
  await render(<DbProvider db={db}><ToastProvider><TemplateEditor /></ToastProvider></DbProvider>);
  await fireEvent.changeText(await screen.findByPlaceholderText('Nombre de la plantilla'), 'Pierna');
  await fireEvent(screen.getByLabelText('Incluir Sentadilla'), 'valueChange', true);
}

test('a database error while saving is reported instead of failing silently', async () => {
  const db = await createTestDb();
  await renderEditor(db);
  const failing: Db = { ...db, withTransactionAsync: async () => { throw new Error('disk full'); } };
  Object.assign(db, failing);
  await fireEvent.press(screen.getByText('Guardar plantilla'));
  expect(await screen.findByText('No se pudo completar. Probá de nuevo.')).toBeTruthy();
});
