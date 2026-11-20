import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import type { WorkoutSet } from '../../../core/types';
import { SetRow } from '../SetRow';

const set: WorkoutSet = { id: 7, workoutId: 1, exerciseId: 1, exerciseName: 'Sentadilla', position: 0, weightKg: 60, reps: 8, done: false };

test('re-derives the shown weight when the unit changes, so saving does not reinterpret it', async () => {
  const onSave = jest.fn(async () => {});
  const view = await render(<SetRow set={set} index={1} unit="kg" onSave={onSave} onRemove={jest.fn()} />);
  await view.rerender(<SetRow set={set} index={1} unit="lb" onSave={onSave} onRemove={jest.fn()} />);
  expect(screen.getByTestId('set-weight-7').props.value).toBe('132.28');
  await fireEvent.press(screen.getByTestId('set-done-7'));
  expect((onSave.mock.calls[0] as unknown as [{ weightKg: number }])[0].weightKg).toBeCloseTo(60, 1);
});

test('editing a set that is already done saves the new values on blur', async () => {
  const onSave = jest.fn(async () => {});
  await render(<SetRow set={{ ...set, done: true }} index={1} unit="kg" onSave={onSave} onRemove={jest.fn()} />);
  await fireEvent.changeText(screen.getByTestId('set-weight-7'), '62,5');
  await fireEvent(screen.getByTestId('set-weight-7'), 'blur');
  expect(onSave).toHaveBeenCalledWith({ weightKg: 62.5, reps: 8, done: true });
});

test('long press asks before deleting a set', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const onRemove = jest.fn();
  await render(<SetRow set={set} index={1} unit="kg" onSave={jest.fn()} onRemove={onRemove} />);
  await fireEvent(screen.getByTestId('set-done-7'), 'longPress');
  expect(alert).toHaveBeenCalled();
  expect(onRemove).not.toHaveBeenCalled();
});
