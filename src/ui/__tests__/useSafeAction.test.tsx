import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ToastProvider } from '../Toast';
import { useSafeAction } from '../useSafeAction';

const wrapper = ({ children }: { children: ReactNode }) => <ToastProvider>{children}</ToastProvider>;

test('a second run while the first is in flight (double tap) is ignored', async () => {
  const { result } = await renderHook(() => useSafeAction(), { wrapper });
  let calls = 0;
  let release!: () => void;
  const slow = () => {
    calls++;
    return new Promise<void>((r) => (release = r));
  };
  await act(async () => {
    const first = result.current.run(slow);
    const second = result.current.run(slow);
    release();
    await Promise.all([first, second]);
  });
  expect(calls).toBe(1);
});

test('a failing action resolves instead of rejecting', async () => {
  const { result } = await renderHook(() => useSafeAction(), { wrapper });
  await act(async () => {
    await expect(result.current.run(async () => { throw new Error('boom'); })).resolves.toBeUndefined();
  });
});
